"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Journey, JourneyPhoto } from "@/lib/types";
import { createDefaultCategories } from "@/lib/storage";
import { getJourneyRepo, getPhotoRepo } from "@/lib/data/repositoryFactory";
import type { PhotoImportProgress } from "@/lib/data/types";
import { generateId, deriveTitle } from "@/lib/utils";
import { queueThumbnailGeneration } from "@/lib/desktop/thumbnailQueue";
import TopNav from "@/components/TopNav";
import JourneyForm from "@/components/JourneyForm";
import type { JourneyFormData } from "@/components/JourneyForm";
import UploadDropzone from "@/components/UploadDropzone";
import PhotoGrid from "@/components/PhotoGrid";
import ImportProgress from "@/components/ImportProgress";
import ArchivingModal, { type ArchiveStep } from "@/components/ArchivingModal";

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
  const [archiveStep, setArchiveStep] = useState<ArchiveStep>("preparing");
  const [archivePercent, setArchivePercent] = useState(0);
  const [storageError, setStorageError] = useState("");
  const [importProgress, setImportProgress] = useState<PhotoImportProgress | null>(null);
  const pendingFilesRef = useRef<PendingFile[]>([]);
  const photosRef = useRef<JourneyPhoto[]>([]);
  const archivedRef = useRef(false);
  const journeyIdRef = useRef<string>(generateId());
  const savedPhotosRef = useRef<JourneyPhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    const journeyId = journeyIdRef.current;
    const savedRef = savedPhotosRef;
    const archived = archivedRef;
    return () => {
      // Clean up temporary blob URLs and files on unmount
      const currentPhotos = photosRef.current;
      getPhotoRepo().revokeObjectUrls(currentPhotos);
      if (!archived.current) {
        const savedIds = savedRef.current.map((p) => p.id);
        if (savedIds.length > 0) {
          void getPhotoRepo().deletePhotos(savedIds, journeyId).catch(() => {});
        }
        void getPhotoRepo().deleteAllPhotosForJourney(journeyId).catch(() => {});
      }
    };
  }, []);

  const savingInProgressRef = useRef(false);

  // Drain all pending files through savePhotos, processing new arrivals too
  const drainPendingSaves = useCallback(async () => {
    savingInProgressRef.current = true;
    const journeyId = journeyIdRef.current;

    while (pendingFilesRef.current.length > 0) {
      const batch = pendingFilesRef.current.splice(0);
      const totalPending = savedPhotosRef.current.length + batch.length;

      setImportProgress({
        phase: "saving-originals",
        total: totalPending,
        completedOriginals: savedPhotosRef.current.length,
        completedThumbnails: 0,
        failed: 0,
        percent: Math.round((savedPhotosRef.current.length / totalPending) * 100),
        canSafelySaveJourney: false,
        message: `Saving originals… ${savedPhotosRef.current.length} / ${totalPending}`,
      });

      try {
        const newSaved = await getPhotoRepo().savePhotos(journeyId, batch, {
          onProgress: (p) => {
            // Adjust total to reflect cumulative count
            const adjusted: PhotoImportProgress = {
              ...p,
              total: Math.max(p.total, savedPhotosRef.current.length + batch.length),
              completedOriginals: savedPhotosRef.current.length + p.completedOriginals,
              canSafelySaveJourney:
                savedPhotosRef.current.length + p.completedOriginals ===
                savedPhotosRef.current.length + batch.length &&
                pendingFilesRef.current.length === 0,
            };
            setImportProgress(adjusted);
          },
        });

        const valid = newSaved.filter(
          (p) => p.url && p.url.length > 0
        );
        savedPhotosRef.current = [...savedPhotosRef.current, ...valid];

        // Swap the grid from full-resolution blob previews to the saved
        // thumbnails (or originals on disk), keeping any user-set curation.
        const savedById = new Map(valid.map((p) => [p.id, p]));
        const staleBlobUrls: string[] = [];
        setPhotos((prev) => {
          const next = prev.map((p) => {
            const saved = savedById.get(p.id);
            if (!saved) return p;
            if (p.url.startsWith("blob:") && p.url !== saved.url) {
              staleBlobUrls.push(p.url);
            }
            return {
              ...saved,
              isCover: p.isCover,
              isHighlight: p.isHighlight,
              note: p.note,
              hasNote: p.hasNote,
              categoryId: p.categoryId,
            };
          });
          photosRef.current = next;
          return next;
        });
        if (staleBlobUrls.length > 0) {
          requestAnimationFrame(() => {
            for (const url of staleBlobUrls) URL.revokeObjectURL(url);
          });
        }
      } catch {
        setImportProgress((prev) =>
          prev
            ? { ...prev, phase: "error", message: "Import encountered an error" }
            : null
        );
      }
    }

    savingInProgressRef.current = false;
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

    // Start background save if not already running
    if (!savingInProgressRef.current && pendingFilesRef.current.length > 0) {
      void drainPendingSaves();
    }
  }, [drainPendingSaves]);

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
    // Remove from pending files and saved photos
    pendingFilesRef.current = pendingFilesRef.current.filter((pf) => pf.id !== id);
    savedPhotosRef.current = savedPhotosRef.current.filter((sp) => sp.id !== id);
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id);
      photosRef.current = next;
      return next;
    });
  }, []);

  const canArchive =
    formData.locationProvince.length > 0 &&
    formData.locationCities.length > 0 &&
    !archiving &&
    (importProgress?.canSafelySaveJourney ?? photos.length === 0);

  const handleArchive = useCallback(async () => {
    if (!canArchive) return;
    setArchiving(true);
    setArchiveStep("preparing");
    setStorageError("");

    const journeyId = journeyIdRef.current;

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
    const companions = formData.companions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const title = formData.title.trim() || undefined;

    try {
      // Merge user-set metadata (cover, highlight, note, category) into saved photos
      const savedPhotos = savedPhotosRef.current;
      const previewMap = new Map(finalPhotos.map((p) => [p.id, p]));
      const mergedPhotos: JourneyPhoto[] = savedPhotos
        .filter((sp) => previewMap.has(sp.id)) // only keep photos still in the UI
        .map((sp) => {
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

      const coverPhotoId = mergedPhotos.find((p) => p.isCover)?.id;

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
        photos: mergedPhotos,
        categories: createDefaultCategories(now),
        createdAt: now,
        updatedAt: now,
      };

      // Step 1 → 2: Saving to Library
      setArchiveStep("saving");
      setArchivePercent(0);

      // Wait for browser paint so the modal step updates before heavy DB write
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      // Save journey via repo (localStorage in browser, SQLite in desktop)
      // onProgress fires after each photo row is written to DB
      await getJourneyRepo().saveJourney(journey, (current, total) => {
        setArchivePercent(Math.round((current / Math.max(total, 1)) * 100));
      });

      // Step 2 → 3: Finishing up
      setArchiveStep("finishing");
      setArchivePercent(100);

      // Start background thumbnail generation (desktop only, non-blocking)
      queueThumbnailGeneration(journeyId, mergedPhotos);

      // Brief pause so the user sees "Finishing up" before the page transitions
      await new Promise((r) => setTimeout(r, 400));

      getPhotoRepo().revokeObjectUrls(finalPhotos);
      archivedRef.current = true;
      router.push(`/journeys/${journey.id}`);
    } catch (err) {
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

      {/* Archiving modal */}
      <ArchivingModal
        open={archiving}
        step={archiveStep}
        percent={archivePercent}
        detail={
          archiveStep === "saving" && photos.length > 0
            ? `${photos.length} photo${photos.length > 1 ? "s" : ""}`
            : undefined
        }
      />
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

            {/* Import progress */}
            <ImportProgress progress={importProgress} />

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
                {!importProgress?.canSafelySaveJourney && photos.length > 0
                  ? importProgress?.message ?? "Saving photos…"
                  : formData.location
                    ? formData.location
                    : "Select a province and at least one city to archive"}
              </p>
            </div>
            <button
              onClick={handleArchive}
              disabled={!canArchive}
              className="w-full rounded-button bg-accent px-8 py-3 text-[15px] font-semibold text-white transition hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              {(() => {
                if (archiving) return "Archiving…";
                if (!importProgress?.canSafelySaveJourney && photos.length > 0) {
                  return importProgress?.message ?? "Saving photos…";
                }
                return "Archive Journey";
              })()}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
