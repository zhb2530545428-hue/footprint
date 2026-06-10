"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Journey, JourneyPhoto } from "@/lib/types";
import { createDefaultCategories } from "@/lib/storage";
import { getJourneyRepo, getPhotoRepo } from "@/lib/data/repositoryFactory";
import { generateId, deriveTitle } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import JourneyForm from "@/components/JourneyForm";
import type { JourneyFormData } from "@/components/JourneyForm";
import UploadDropzone from "@/components/UploadDropzone";
import PhotoGrid from "@/components/PhotoGrid";

interface PendingFile {
  id: string;
  file: File;
}

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
  const pendingFilesRef = useRef<PendingFile[]>([]);
  const photosRef = useRef<JourneyPhoto[]>([]);
  const archivedRef = useRef(false);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      // Clean up temporary blob URLs and browser IndexedDB blobs on unmount
      const currentPhotos = photosRef.current;
      getPhotoRepo().revokeObjectUrls(currentPhotos);
      if (!archivedRef.current) {
        void getPhotoRepo().deletePhotos(
          currentPhotos.map((p) => p.id),
          ""
        ).catch(() => {});
      }
    };
  }, []);

  const handleFilesSelected = useCallback((files: File[]) => {
    setStorageError("");
    const prepared: PendingFile[] = files.map((file) => ({
      file,
      id: generateId(),
    }));

    // Create temporary blob URLs for preview
    const newPhotos: JourneyPhoto[] = prepared.map(({ file, id }) => ({
      id,
      url: URL.createObjectURL(file),
      fileName: file.name,
      isCover: false,
      isHighlight: false,
      categoryId: "default-other",
      hasNote: false,
      createdAt: new Date().toISOString(),
    }));

    pendingFilesRef.current = [...pendingFilesRef.current, ...prepared];

    setPhotos((prev) => {
      const hasCover = prev.some((p) => p.isCover) || newPhotos.length === 0;
      if (!hasCover && prev.length === 0) {
        newPhotos[0].isCover = true;
      }
      const next = [...prev, ...newPhotos];
      photosRef.current = next;
      return next;
    });
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
    // Revoke blob URL for removed photo
    const removed = photosRef.current.find((photo) => photo.id === id);
    if (removed) getPhotoRepo().revokeObjectUrls([removed]);
    // Remove from pending files
    pendingFilesRef.current = pendingFilesRef.current.filter((pf) => pf.id !== id);
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
    const journeyId = generateId();
    const companions = formData.companions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const title = formData.title.trim() || undefined;
    let savedPhotos: JourneyPhoto[] = [];

    try {
      // Step 1: Save photo files via repo (IndexedDB in browser, Library folder in desktop)
      const pendingFiles = pendingFilesRef.current;

      if (pendingFiles.length > 0) {
        const photoRepo = getPhotoRepo();
        savedPhotos = await photoRepo.savePhotos(journeyId, pendingFiles);

        // Merge user-set metadata (cover, highlight, note, category) from preview photos
        const previewMap = new Map(finalPhotos.map((p) => [p.id, p]));
        savedPhotos = savedPhotos.map((sp) => {
          const preview = previewMap.get(sp.id);
          if (!preview) return sp;
          return {
            ...sp,
            isCover: preview.isCover,
            isHighlight: preview.isHighlight,
            note: preview.note,
            hasNote: preview.hasNote,
            categoryId: preview.categoryId,
          };
        });
      }

      const coverPhotoId = savedPhotos.find((p) => p.isCover)?.id;

      const journey: Journey = {
        id: journeyId,
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
        photos: savedPhotos,
        categories: createDefaultCategories(now),
        createdAt: now,
        updatedAt: now,
      };

      // Step 2: Save journey via repo (localStorage in browser, SQLite in desktop)
      await getJourneyRepo().saveJourney(journey);
      getPhotoRepo().revokeObjectUrls(finalPhotos);
      archivedRef.current = true;
      router.push(`/journeys/${journey.id}`);
    } catch (err) {
      if (savedPhotos.length > 0) {
        const photoRepo = getPhotoRepo();
        await photoRepo
          .deletePhotos(savedPhotos.map((photo) => photo.id), journeyId)
          .catch(() => {});
        await photoRepo.deleteAllPhotosForJourney(journeyId).catch(() => {});
      }
      setArchiving(false);
      setStorageError(`Archive failed: ${err}`);
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
