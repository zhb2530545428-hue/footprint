"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Journey, JourneyPhoto, PhotoCategory } from "@/lib/types";
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
import ConfirmModal from "@/components/ConfirmModal";
import EditJourneyHeader from "@/components/EditJourneyHeader";
import CoverPhotoPanel from "@/components/CoverPhotoPanel";
import HighlightsPreview from "@/components/HighlightsPreview";

interface PendingFile {
  id: string;
  file: File;
}

export default function EditJourneyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loaded, setLoaded] = useState(false);
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
  const [categories, setCategories] = useState<PhotoCategory[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [saveStep, setSaveStep] = useState<ArchiveStep>("preparing");
  const [savePercent, setSavePercent] = useState(0);
  const [storageError, setStorageError] = useState("");
  const [importProgress, setImportProgress] = useState<PhotoImportProgress | null>(null);
  const photosRef = useRef<JourneyPhoto[]>([]);
  const pendingFilesRef = useRef<PendingFile[]>([]);
  const savedPhotosRef = useRef<JourneyPhoto[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Category management state
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(
    null
  );
  const [renamingCategoryName, setRenamingCategoryName] = useState("");
  const [deleteCategoryModal, setDeleteCategoryModal] = useState<{
    category: PhotoCategory;
    photoCount: number;
  } | null>(null);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    let cancelled = false;

    void getJourneyRepo().getJourney(id)
      .then((found) => {
        if (cancelled) {
          if (found) getPhotoRepo().revokeObjectUrls(found.photos);
          return;
        }
        if (!found) {
          setLoaded(true);
          return;
        }

        photosRef.current = found.photos;
        setJourney(found);
        setCategories(found.categories ?? createDefaultCategories());

        // Derive city list: prefer locationCities, then locationCity as single entry, then empty
        const existingCities = found.locationCities?.length
          ? found.locationCities
          : found.locationCity
            ? [found.locationCity]
            : [];

        setFormData({
          title: found.title ?? "",
          location: found.location,
          locationProvince: found.locationProvince ?? "",
          locationCities: existingCities,
          locationAddress: found.locationAddress ?? "",
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
          setStorageError(
            "This journey could not be loaded from storage."
          );
          setLoaded(true);
        }
      });

    return () => {
      cancelled = true;
      getPhotoRepo().revokeObjectUrls(photosRef.current);
    };
  }, [id]);

  const savingInProgressRef = useRef(false);

  const drainPendingSaves = useCallback(async () => {
    savingInProgressRef.current = true;

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
        const newSaved = await getPhotoRepo().savePhotos(id, batch, {
          onProgress: (p) => {
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
          (p2) => p2.url && p2.url.length > 0
        );
        savedPhotosRef.current = [...savedPhotosRef.current, ...valid];

        // Swap the grid from full-resolution blob previews to the saved
        // thumbnails (or originals on disk), keeping any user-set curation.
        const savedById = new Map(valid.map((p2) => [p2.id, p2]));
        const staleBlobUrls: string[] = [];
        setPhotos((prev) => {
          const next = prev.map((p2) => {
            const saved = savedById.get(p2.id);
            if (!saved) return p2;
            if (p2.url.startsWith("blob:") && p2.url !== saved.url) {
              staleBlobUrls.push(p2.url);
            }
            return {
              ...saved,
              isCover: p2.isCover,
              isHighlight: p2.isHighlight,
              note: p2.note,
              hasNote: p2.hasNote,
              categoryId: p2.categoryId,
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
  }, [id]);

  const handleFilesSelected = useCallback((files: File[]) => {
    setStorageError("");
    const prepared: PendingFile[] = files.map((file) => ({
      file,
      id: generateId(),
    }));
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
        p.id === photoId
          ? { ...p, note: note || undefined, hasNote: note.length > 0 }
          : p
      )
    );
  }, []);

  const handleRemove = useCallback((photoId: string) => {
    const removed = photosRef.current.find((photo) => photo.id === photoId);
    if (removed) getPhotoRepo().revokeObjectUrls([removed]);
    pendingFilesRef.current = pendingFilesRef.current.filter(
      (pending) => pending.id !== photoId
    );
    savedPhotosRef.current = savedPhotosRef.current.filter(
      (sp) => sp.id !== photoId
    );

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

  const handleSetCategory = useCallback(
    (photoId: string, categoryId: string) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, categoryId } : p))
      );
    },
    []
  );

  const handleAddCategory = useCallback(() => {
    const name = newCategoryName.trim();
    if (!name) return;
    setCategories((prev) => [
      ...prev,
      { id: generateId(), name, createdAt: new Date().toISOString() },
    ]);
    setNewCategoryName("");
    setAddingCategory(false);
  }, [newCategoryName]);

  const handleRenameCategory = useCallback(
    (categoryId: string) => {
      const name = renamingCategoryName.trim();
      if (!name) {
        setRenamingCategoryId(null);
        return;
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === categoryId
            ? { ...c, name, updatedAt: new Date().toISOString() }
            : c
        )
      );
      setRenamingCategoryId(null);
    },
    [renamingCategoryName]
  );

  const handleDeleteCategory = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;

      const photoCount = photos.filter(
        (p) => p.categoryId === categoryId
      ).length;

      if (photoCount > 0) {
        // Show confirmation modal
        setDeleteCategoryModal({ category: cat, photoCount });
        return;
      }

      // No photos — delete immediately
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    },
    [categories, photos]
  );

  const confirmDeleteCategory = useCallback(() => {
    if (!deleteCategoryModal) return;
    const { category } = deleteCategoryModal;

    // Find "Other" or first remaining category as fallback
    const other =
      categories.find(
        (c) => c.id === "default-other" && c.id !== category.id
      ) ?? categories.find((c) => c.id !== category.id);

    const fallbackId = other?.id ?? "default-other";

    // If no "Other" exists yet, create it
    if (!other) {
      setCategories((prev) => [
        ...prev.filter((c) => c.id !== category.id),
        {
          id: "default-other",
          name: "Other",
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
    }

    // Reassign photos
    setPhotos((prev) =>
      prev.map((p) =>
        p.categoryId === category.id ? { ...p, categoryId: fallbackId } : p
      )
    );

    setDeleteCategoryModal(null);
  }, [deleteCategoryModal, categories]);

  const filteredPhotos = useMemo(() => {
    if (activeFilter === "all") return photos;
    if (activeFilter === "highlights")
      return photos.filter((p) => p.isHighlight);
    if (activeFilter === "with-notes")
      return photos.filter((p) => p.hasNote);
    return photos.filter((p) => p.categoryId === activeFilter);
  }, [photos, activeFilter]);

  const canSave =
    !saving &&
    (formData.locationProvince.length > 0
      ? formData.locationCities.length > 0
      : formData.location.trim().length > 0) &&
    (importProgress?.canSafelySaveJourney ?? true);

  const handleSave = useCallback(async () => {
    if (!canSave || !journey) return;
    setSaving(true);
    setSaveStep("preparing");
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

    try {
      // Merge newly saved photos with user metadata
      const newlySavedPhotos = savedPhotosRef.current;
      if (newlySavedPhotos.length > 0) {
        const savedMap = new Map(newlySavedPhotos.map((photo) => [photo.id, photo]));
        finalPhotos = finalPhotos.map((photo) => {
          const saved = savedMap.get(photo.id);
          return saved
            ? {
                ...saved,
                isCover: photo.isCover,
                isHighlight: photo.isHighlight,
                note: photo.note,
                hasNote: photo.hasNote,
                categoryId: photo.categoryId,
              }
            : photo;
        });
      }

      const updated: Journey = {
        ...journey,
        title,
        location: formData.location.trim(),
        locationCountry: formData.locationProvince
          ? ("China" as const)
          : undefined,
        locationProvince: formData.locationProvince || undefined,
        locationCities:
          formData.locationCities.length > 0
            ? formData.locationCities
            : undefined,
        locationCity:
          formData.locationCities.length > 0
            ? formData.locationCities[0]
            : undefined,
        locationAddress: formData.locationAddress.trim() || undefined,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        companions,
        notes: formData.notes.trim() || undefined,
        coverPhotoId,
        photos: finalPhotos,
        categories,
      };

      // Step 1 → 2: Saving to Library
      setSaveStep("saving");
      setSavePercent(0);
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      await getJourneyRepo().updateJourney(updated, (current, total) => {
        setSavePercent(Math.round((current / Math.max(total, 1)) * 100));
      });

      // Step 2 → 3: Finishing up
      setSaveStep("finishing");
      setSavePercent(100);

      // Start background thumbnail generation for new photos only (non-blocking)
      if (newlySavedPhotos.length > 0) {
        queueThumbnailGeneration(journey.id, newlySavedPhotos);
      }

      await new Promise((r) => setTimeout(r, 400));

      pendingFilesRef.current = [];
      savedPhotosRef.current = [];
      router.push(`/journeys/${journey.id}`);
    } catch {
      setSaving(false);
      setStorageError("These changes could not be saved. Please try again.");
    }
  }, [canSave, journey, photos, categories, formData, router]);

  const handleDelete = useCallback(async () => {
    if (!journey) return;
    setDeleting(true);
    try {
      await getJourneyRepo().moveJourneyToTrash(journey.id);
      router.push("/");
    } catch {
      setDeleting(false);
      setDeleteModalOpen(false);
      setStorageError(
        "This journey could not be moved to Trash. Please try again."
      );
    }
  }, [journey, router]);

  const displayTitle = deriveTitle(
    formData.title,
    formData.location,
    formData.startDate
  );

  // Derived data for panels
  const coverPhoto = photos.find(
    (p) => p.isCover || p.id === journey?.coverPhotoId
  );
  const highlightedPhotos = photos.filter((p) => p.isHighlight);

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

      {/* Saving modal */}
      <ArchivingModal
        open={saving}
        step={saveStep}
        percent={savePercent}
        detail={
          saveStep === "saving" && photos.length > 0
            ? `${photos.length} photo${photos.length > 1 ? "s" : ""}`
            : undefined
        }
      />

      <main className="mx-auto max-w-3xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        {/* ═══════════════════════════════════════════
            Header
            ═══════════════════════════════════════════ */}
        <EditJourneyHeader journeyId={id} />

        {/* ═══════════════════════════════════════════
            Section 1 — Basic Journey Information
            ═══════════════════════════════════════════ */}
        <section className="rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-6 lg:px-8 lg:py-8">
          <h2 className="text-[20px] font-semibold text-foreground">
            Journey Info
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            The basics that describe this journey.
          </p>
          <div className="mt-5">
            <JourneyForm initial={formData} onChange={setFormData} />
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            Section 2 — Cover Photo
            ═══════════════════════════════════════════ */}
        <div className="mt-8">
          <CoverPhotoPanel
            coverPhoto={coverPhoto}
            hasPhotos={photos.length > 0}
          />
        </div>

        {/* ═══════════════════════════════════════════
            Section 3 — Highlights
            ═══════════════════════════════════════════ */}
        <div className="mt-8">
          <HighlightsPreview highlights={highlightedPhotos} />
        </div>

        {/* ═══════════════════════════════════════════
            Section 4 — Organize Photos
            ═══════════════════════════════════════════ */}
        <section className="mt-8 rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-6 lg:px-8 lg:py-8">
          <h2 className="text-[20px] font-semibold text-foreground">
            Organize Photos
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            Set a cover, choose highlights, add notes, and organize photos by
            category.
          </p>

          {/* Upload */}
          <div className="mt-5">
            <UploadDropzone onFilesSelected={handleFilesSelected} />
            {storageError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {storageError}
              </p>
            )}
            {/* Import progress */}
            <ImportProgress progress={importProgress} />
          </div>

          {/* Filter tabs + Photo grid */}
          {photos.length > 0 && (
            <div className="mt-6">
              <div className="mb-4 overflow-x-auto pb-1">
                <div className="inline-flex min-w-max rounded-xl bg-surface p-1">
                  {[
                    { key: "all", label: `All (${photos.length})` },
                    {
                      key: "highlights",
                      label: `Highlights (${photos.filter((p) => p.isHighlight).length})`,
                    },
                    ...(photos.filter((p) => p.hasNote).length > 0
                      ? [
                          {
                            key: "with-notes" as const,
                            label: `With Notes (${photos.filter((p) => p.hasNote).length})`,
                          },
                        ]
                      : []),
                    ...categories.map((c) => ({
                      key: c.id,
                      label: `${c.name} (${photos.filter((p) => p.categoryId === c.id).length})`,
                    })),
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab.key}
                      onClick={() => setActiveFilter(tab.key)}
                      className={`whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-medium transition sm:px-4 ${
                        activeFilter === tab.key
                          ? "bg-white text-foreground shadow-sm"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <PhotoGrid
                photos={filteredPhotos}
                categories={categories}
                onSetCover={handleSetCover}
                onToggleHighlight={handleToggleHighlight}
                onRemove={handleRemove}
                onSetNote={handleSetNote}
                onSetCategory={handleSetCategory}
              />
              {filteredPhotos.length === 0 && photos.length > 0 && (
                <p className="mt-6 py-8 text-center text-[14px] text-muted">
                  No photos in this category.
                </p>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <div className="mt-5 rounded-card bg-surface px-6 py-12 text-center">
              <p className="text-[14px] text-muted">
                No photos yet. Upload some above to start curating.
              </p>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            Section 5 — Categories
            ═══════════════════════════════════════════ */}
        <section className="mt-8 rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-6 lg:px-8 lg:py-8">
          <h2 className="text-[20px] font-semibold text-foreground">
            Categories
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            Customize how this journey&rsquo;s photos are organized.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-foreground"
              >
                {renamingCategoryId === cat.id ? (
                  <input
                    value={renamingCategoryName}
                    onChange={(e) => setRenamingCategoryName(e.target.value)}
                    onBlur={() => handleRenameCategory(cat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameCategory(cat.id);
                      if (e.key === "Escape") setRenamingCategoryId(null);
                    }}
                    className="w-24 rounded border border-border px-1.5 py-0.5 text-[13px] outline-none focus:border-accent"
                    autoFocus
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingCategoryId(cat.id);
                        setRenamingCategoryName(cat.name);
                      }}
                      className="hover:text-accent"
                      title="Rename category"
                    >
                      {cat.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="ml-0.5 text-muted hover:text-red-500"
                      title="Delete category"
                    >
                      ×
                    </button>
                  </>
                )}
              </span>
            ))}

            {addingCategory ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent bg-white px-3 py-1.5">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onBlur={() => {
                    if (!newCategoryName.trim()) setAddingCategory(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddCategory();
                    if (e.key === "Escape") {
                      setAddingCategory(false);
                      setNewCategoryName("");
                    }
                  }}
                  placeholder="Category name"
                  className="w-28 rounded border-0 px-0 py-0.5 text-[13px] outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCategoryName.trim()}
                  className="text-[13px] font-medium text-accent disabled:opacity-40"
                >
                  Add
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAddingCategory(true)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-muted px-3 py-1.5 text-[13px] text-muted hover:border-accent hover:text-accent"
              >
                + Add Category
              </button>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            Save action
            ═══════════════════════════════════════════ */}
        <div className="mt-10 border-t border-border pt-8">
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
                {formData.location || "Select a province and at least one city to save"}
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
                {(() => {
                  if (saving) return "Saving…";
                  if (
                    importProgress &&
                    !importProgress.canSafelySaveJourney &&
                    importProgress.total > 0
                  ) {
                    return importProgress.message ?? "Saving photos…";
                  }
                  return "Save Changes";
                })()}
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            Danger Zone
            ═══════════════════════════════════════════ */}
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

        {/* Delete Journey Confirmation Modal */}
        <ConfirmModal
          open={deleteModalOpen}
          title="Move to Trash"
          message="This journey will be moved to Trash and will no longer appear on your homepage. Photos will not be permanently deleted yet — you can restore this journey from the Trash page at any time."
          confirmLabel={deleting ? "Moving…" : "Move to Trash"}
          confirmVariant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteModalOpen(false)}
        />

        {/* Delete Category Confirmation Modal */}
        <ConfirmModal
          open={deleteCategoryModal !== null}
          title="Delete Category"
          message={
            deleteCategoryModal
              ? `"${deleteCategoryModal.category.name}" contains ${deleteCategoryModal.photoCount} photo${deleteCategoryModal.photoCount > 1 ? "s" : ""}. Deleting a category will not delete photos. They will be moved to "Other" instead.`
              : ""
          }
          confirmLabel="Delete Category"
          confirmVariant="danger"
          onConfirm={confirmDeleteCategory}
          onCancel={() => setDeleteCategoryModal(null)}
        />
      </main>
    </div>
  );
}
