"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Journey, JourneyPhoto } from "@/lib/types";
import { revokePhotoObjectUrls, saveJourney, createDefaultCategories } from "@/lib/storage";
import { deletePhotoBlobs, savePhotoBlob } from "@/lib/image-storage";
import { generateId, deriveTitle } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import JourneyForm from "@/components/JourneyForm";
import type { JourneyFormData } from "@/components/JourneyForm";
import UploadDropzone from "@/components/UploadDropzone";
import PhotoGrid from "@/components/PhotoGrid";

export default function NewJourneyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<JourneyFormData>({
    title: "",
    location: "",
    locationProvince: "",
    locationCities: [],
    locationAddress: "",
    startDate: "",
    endDate: "",
    companions: "",
    notes: "",
  });
  const [photos, setPhotos] = useState<JourneyPhoto[]>([]);
  const [archiving, setArchiving] = useState(false);
  const [storageError, setStorageError] = useState("");
  const photosRef = useRef<JourneyPhoto[]>([]);
  const archivedRef = useRef(false);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      const currentPhotos = photosRef.current;
      revokePhotoObjectUrls(currentPhotos);
      if (!archivedRef.current) {
        void deletePhotoBlobs(
          currentPhotos.flatMap((photo) => (photo.storageKey ? [photo.storageKey] : []))
        );
      }
    };
  }, []);

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
        categoryId: "default-other",
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

  const handleSetCover = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isCover: p.id === id,
      }))
    );
  }, []);

  const handleToggleHighlight = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, isHighlight: !p.isHighlight } : p
      )
    );
  }, []);

  const handleSetNote = useCallback((id: string, note: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, note: note || undefined, hasNote: note.length > 0 } : p
      )
    );
  }, []);

  const handleRemove = useCallback((id: string) => {
    const removed = photosRef.current.find((photo) => photo.id === id);
    if (removed) revokePhotoObjectUrls([removed]);
    if (removed?.storageKey) {
      void deletePhotoBlobs([removed.storageKey]).catch(() => {
        setStorageError("The photo was removed, but its browser storage could not be cleaned up.");
      });
    }
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      photosRef.current = next;
      return next;
    });
  }, []);

  const canArchive =
    formData.locationProvince.length > 0 &&
    formData.locationCities.length > 0 &&
    !archiving;

  const handleArchive = useCallback(async () => {
    if (!canArchive) return;
    setArchiving(true);
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

    const now = new Date().toISOString();
    const coverPhotoId = finalPhotos.find((p) => p.isCover)?.id;
    const companions = formData.companions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const title = formData.title.trim() || undefined;

    const journey: Journey = {
      id: generateId(),
      title,
      location: formData.location.trim(),
      locationCountry: "China" as const,
      locationProvince: formData.locationProvince,
      locationCities: formData.locationCities,
      locationCity: formData.locationCities[0] ?? "",
      locationAddress: formData.locationAddress.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      companions,
      notes: formData.notes.trim() || undefined,
      status: "archived",
      coverPhotoId,
      photos: finalPhotos,
      categories: createDefaultCategories(now),
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveJourney(journey);
      archivedRef.current = true;
      router.push(`/journeys/${journey.id}`);
    } catch {
      setArchiving(false);
      setStorageError("This journey could not be archived. Please try again.");
    }
  }, [canArchive, photos, formData, router]);

  const displayTitle = deriveTitle(
    formData.title,
    formData.location,
    formData.startDate
  );

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-5xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-10 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          New Journey
        </h1>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left: Form */}
          <div>
            <h2 className="mb-5 text-[18px] font-semibold text-foreground">
              Journey Info
            </h2>
            <JourneyForm onChange={setFormData} />
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

        {/* Archive action */}
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
                {formData.location
                  ? formData.location
                  : "Select a province and at least one city to archive"}
              </p>
            </div>
            <button
              onClick={handleArchive}
              disabled={!canArchive}
              className="w-full rounded-button bg-accent px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {archiving ? "Archiving…" : "Archive Journey"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
