"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Journey, JourneyPhoto } from "@/lib/types";
import {
  getJourney,
  moveJourneyToTrash,
  revokePhotoObjectUrls,
  updateJourney,
} from "@/lib/storage";
import { deletePhotoBlobs, savePhotoBlob } from "@/lib/image-storage";
import { generateId, deriveTitle } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import JourneyForm from "@/components/JourneyForm";
import type { JourneyFormData } from "@/components/JourneyForm";
import UploadDropzone from "@/components/UploadDropzone";
import PhotoGrid from "@/components/PhotoGrid";
import ConfirmModal from "@/components/ConfirmModal";

export default function EditJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [formData, setFormData] = useState<JourneyFormData>({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    companions: "",
    notes: "",
  });
  const [photos, setPhotos] = useState<JourneyPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState("");
  const photosRef = useRef<JourneyPhoto[]>([]);
  const originalStorageKeysRef = useRef(new Set<string>());
  const savedRef = useRef(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    let cancelled = false;

    void getJourney(id)
      .then((found) => {
        if (cancelled) {
          if (found) revokePhotoObjectUrls(found.photos);
          return;
        }
        if (!found) {
          setLoaded(true);
          return;
        }

        originalStorageKeysRef.current = new Set(
          found.photos.flatMap((photo) => (photo.storageKey ? [photo.storageKey] : []))
        );
        photosRef.current = found.photos;
        setJourney(found);
        setFormData({
          title: found.title ?? "",
          location: found.location,
          startDate: found.startDate ?? "",
          endDate: found.endDate ?? "",
          companions: found.companions.join(", "),
          notes: found.notes ?? "",
        });
        setPhotos(found.photos);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setStorageError("This journey could not be loaded from browser storage.");
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
      const currentPhotos = photosRef.current;
      revokePhotoObjectUrls(currentPhotos);
      if (!savedRef.current) {
        void deletePhotoBlobs(
          currentPhotos.flatMap((photo) =>
            photo.storageKey && !originalStorageKeysRef.current.has(photo.storageKey)
              ? [photo.storageKey]
              : []
          )
        );
      }
    };
  }, [id]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setStorageError("");
    const prepared = files.map((file) => ({ file, id: generateId() }));

    try {
      await Promise.all(
        prepared.map(({ file, id }) => savePhotoBlob(id, file))
      );

      const newPhotos: JourneyPhoto[] = prepared.map(({ file, id }) => ({
        id,
        storageKey: id,
        url: URL.createObjectURL(file),
        fileName: file.name,
        isCover: false,
        isHighlight: false,
        category: "other",
        hasNote: false,
        createdAt: new Date().toISOString(),
      }));

      setPhotos((prev) => {
        // Auto-set first photo as cover if none is set yet
        const hasCover = prev.some((p) => p.isCover) || newPhotos.length === 0;
        if (!hasCover && prev.length === 0) {
          newPhotos[0].isCover = true;
        }
        const next = [...prev, ...newPhotos];
        photosRef.current = next;
        return next;
      });
    } catch {
      await deletePhotoBlobs(prepared.map(({ id }) => id)).catch(() => undefined);
      setStorageError("These photos could not be saved in this browser. Please try again.");
    }
  }, []);

  const handleSetCover = useCallback((photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === photoId,
      }))
    );
  }, []);

  const handleToggleHighlight = useCallback((photoId: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, isHighlight: !p.isHighlight } : p
      )
    );
  }, []);

  const handleSetNote = useCallback((photoId: string, note: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId ? { ...p, note: note || undefined, hasNote: note.length > 0 } : p
      )
    );
  }, []);

  const handleRemove = useCallback((photoId: string) => {
    const removed = photosRef.current.find((photo) => photo.id === photoId);
    if (removed) revokePhotoObjectUrls([removed]);
    if (
      removed?.storageKey &&
      !originalStorageKeysRef.current.has(removed.storageKey)
    ) {
      void deletePhotoBlobs([removed.storageKey]).catch(() => {
        setStorageError("The photo was removed, but its browser storage could not be cleaned up.");
      });
    }

    setPhotos((prev) => {
      // Reassign cover if the removed photo was the cover
      const nextPhotos = prev.filter((p) => p.id !== photoId);
      const wasCover = removed?.isCover;
      if (wasCover && nextPhotos.length > 0) {
        // Attempt to keep an existing cover; otherwise auto-pick first
        const existingCover = nextPhotos.find((p) => p.isCover);
        if (!existingCover) {
          nextPhotos[0] = { ...nextPhotos[0], isCover: true };
        }
      }
      photosRef.current = nextPhotos;
      return nextPhotos;
    });
  }, []);

  const canSave = formData.location.trim().length > 0 && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave || !journey) return;
    setSaving(true);
    setStorageError("");

    // Ensure exactly one cover photo
    let finalPhotos = [...photos];
    const coverCount = finalPhotos.filter((p) => p.isCover).length;
    if (coverCount === 0 && finalPhotos.length > 0) {
      finalPhotos[0] = { ...finalPhotos[0], isCover: true };
    } else if (coverCount > 1) {
      const firstCoverIdx = finalPhotos.findIndex((p) => p.isCover);
      finalPhotos = finalPhotos.map((p, i) => ({
        ...p,
        isCover: i === firstCoverIdx,
      }));
    }

    const coverPhotoId = finalPhotos.find((p) => p.isCover)?.id;
    const companions = formData.companions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const title = formData.title.trim() || undefined;

    const updated: Journey = {
      ...journey,
      title,
      location: formData.location.trim(),
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      companions,
      notes: formData.notes.trim() || undefined,
      coverPhotoId,
      photos: finalPhotos,
    };

    try {
      await updateJourney(updated);
      savedRef.current = true;
      router.push(`/journeys/${journey.id}`);
    } catch {
      setSaving(false);
      setStorageError("These changes could not be saved. Please try again.");
    }
  }, [canSave, journey, photos, formData, router]);

  const handleDelete = useCallback(async () => {
    if (!journey) return;
    setDeleting(true);
    try {
      await moveJourneyToTrash(journey.id);
      savedRef.current = true;
      router.push("/");
    } catch {
      setDeleting(false);
      setDeleteModalOpen(false);
      setStorageError("This journey could not be moved to Trash. Please try again.");
    }
  }, [journey, router]);

  const displayTitle = deriveTitle(
    formData.title,
    formData.location,
    formData.startDate
  );

  if (!loaded) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div>
        <TopNav />
        <main className="mx-auto max-w-7xl px-page-mobile py-20 text-center lg:px-page-desktop">
          <h2 className="text-2xl font-semibold text-foreground">
            Journey not found
          </h2>
          <p className="mt-3 text-muted">
            This journey may have been deleted or the link is incorrect.
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 rounded-button bg-foreground px-6 py-2.5 text-sm font-medium text-white"
          >
            Back to Home
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-10 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          Edit Journey
        </h1>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: Form */}
          <div>
            <h2 className="mb-5 text-[18px] font-semibold text-foreground">
              Journey Info
            </h2>
            <JourneyForm initial={formData} onChange={setFormData} />
          </div>

          {/* Right: Upload */}
          <div>
            <h2 className="mb-5 text-[18px] font-semibold text-foreground">
              Photos
            </h2>
            <UploadDropzone onFilesSelected={handleFilesSelected} />
            {storageError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {storageError}
              </p>
            )}

            {/* Photo grid */}
            <div className="mt-6">
              <PhotoGrid
                photos={photos}
                onSetCover={handleSetCover}
                onToggleHighlight={handleToggleHighlight}
                onRemove={handleRemove}
                onSetNote={handleSetNote}
              />
            </div>
          </div>
        </div>

        {/* Save action */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[18px] font-semibold text-foreground">
                {displayTitle}
              </p>
              <p className="mt-0.5 text-[14px] text-muted">
                {photos.length > 0
                  ? `${photos.length} photo${photos.length > 1 ? "s" : ""}`
                  : "No photos yet"}
                {" · "}
                {formData.location || "Add a location to save"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/journeys/${id}`)}
                className="rounded-button border border-border px-6 py-3 text-[15px] font-medium text-foreground transition hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="w-full rounded-button bg-accent px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Delete Journey */}
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="mb-3 text-[15px] font-semibold text-muted uppercase tracking-wide">
            Danger Zone
          </h2>
          <p className="mb-4 text-[14px] text-muted leading-relaxed max-w-lg">
            Move this journey to Trash. It will be hidden from your homepage
            but can be restored from the Trash page. Photos will not be
            permanently deleted until you confirm deletion from Trash.
          </p>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="rounded-button border border-red-200 bg-white px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            Delete Journey
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteModalOpen}
          title="Move to Trash"
          message="This journey will be moved to Trash and will no longer appear on your homepage. Photos will not be permanently deleted yet — you can restore this journey from the Trash page at any time."
          confirmLabel={deleting ? "Moving…" : "Move to Trash"}
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />
      </main>
    </div>
  );
}
