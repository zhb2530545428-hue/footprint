"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";
import { getJourneyRepo, getPhotoRepo } from "@/lib/data/repositoryFactory";
import { deriveTitle, formatDateRange } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import SegmentedTabs from "@/components/SegmentedTabs";
import PhotoLightbox from "@/components/PhotoLightbox";
import NoteTooltip from "@/components/NoteTooltip";

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showWithNotes, setShowWithNotes] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedJourney: Journey | undefined;

    void getJourneyRepo().getJourney(id)
      .then((found) => {
        loadedJourney = found;
        if (cancelled) {
          if (found) getPhotoRepo().revokeObjectUrls(found.photos);
          return;
        }
        setJourney(found ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
      if (loadedJourney) getPhotoRepo().revokeObjectUrls(loadedJourney.photos);
    };
  }, [id]);

  // Combined filter: category tab + optional With Notes
  const filteredPhotos = useMemo(() => {
    if (!journey) return [];
    let photos = journey.photos;

    if (activeTab !== "all") {
      photos = photos.filter((p) => p.categoryId === activeTab);
    }

    if (showWithNotes) {
      photos = photos.filter((p) => p.hasNote);
    }

    return photos;
  }, [journey, activeTab, showWithNotes]);

  const lightboxPhoto =
    lightboxIndex !== null ? filteredPhotos[lightboxIndex] ?? null : null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex > 0 ? lightboxIndex - 1 : filteredPhotos.length - 1
    );
  };
  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex < filteredPhotos.length - 1 ? lightboxIndex + 1 : 0
    );
  };

  // ── Loading state ──
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

  // ── Not found state ──
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

  const displayTitle = deriveTitle(
    journey.title,
    journey.location,
    journey.startDate
  );
  const dateRange = formatDateRange(journey.startDate, journey.endDate);
  const coverPhoto = journey.photos.find(
    (p) => p.id === journey.coverPhotoId
  );
  const highlights = journey.photos.filter((p) => p.isHighlight);

  return (
    <div className="min-h-screen">
      <TopNav />

      <main className="mx-auto max-w-5xl px-page-mobile pt-8 lg:px-page-desktop lg:pt-12">
        {/* ═══════════════════════════════════════════
            Section 1 — Hero Memory Header
            ═══════════════════════════════════════════ */}
        <section>
          {coverPhoto ? (
            <>
              {/* Cover photo hero */}
              <div className="overflow-hidden rounded-[2rem] h-[320px] sm:h-[440px] lg:h-[500px]">
                <img
                  src={coverPhoto.url}
                  alt={displayTitle}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Floating info card — overlaps the cover bottom */}
              <div className="relative -mt-12 mx-3 sm:mx-6">
                <div className="rounded-panel bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] px-6 py-5 lg:px-8 lg:py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-[26px] font-semibold text-foreground lg:text-[32px] break-words">
                        {displayTitle}
                      </h1>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[14px] text-muted">
                        {dateRange && <span>{dateRange}</span>}
                        {journey.companions.length > 0 && (
                          <span>
                            With {journey.companions.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/journeys/${journey.id}/edit`)
                      }
                      className="shrink-0 rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground hover:border-muted"
                    >
                      Edit journey
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Calm fallback hero — no cover photo */
            <div className="rounded-[2rem] bg-surface px-8 py-14 sm:py-16 lg:py-20 text-center">
              <h1 className="text-[28px] font-semibold text-foreground lg:text-[36px]">
                {displayTitle}
              </h1>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[15px] text-muted">
                {dateRange && <span>{dateRange}</span>}
                {journey.companions.length > 0 && (
                  <span>With {journey.companions.join(", ")}</span>
                )}
              </div>
              <p className="mt-5 text-[13px] text-muted/50">
                Add a cover photo in Edit
              </p>
              <div className="mt-5">
                <button
                  onClick={() =>
                    router.push(`/journeys/${journey.id}/edit`)
                  }
                  className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground hover:border-muted"
                >
                  Edit journey
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ═══════════════════════════════════════════
            Section 2 — Journey Notes
            ═══════════════════════════════════════════ */}
        {journey.notes && journey.notes.trim() && (
          <section className="mt-12">
            <h2 className="text-[20px] font-semibold text-foreground">
              Notes from this journey
            </h2>
            <div className="mt-3 rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-5 lg:px-8 lg:py-6">
              <p className="text-[15px] text-foreground/85 leading-7 whitespace-pre-wrap">
                {journey.notes}
              </p>
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            Section 3 — Highlights
            ═══════════════════════════════════════════ */}
        {highlights.length > 0 && (
          <section className="mt-14">
            <h2 className="text-[22px] font-semibold text-foreground">
              Highlights
            </h2>
            <p className="mt-1 text-[15px] text-muted">
              A few moments worth keeping close.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {highlights.map((photo, i) => {
                const isFirst = i === 0;
                const btn = (
                  <button
                    key={photo.id}
                    onClick={() => {
                      // Open lightbox showing all photos
                      setActiveTab("all");
                      setShowWithNotes(false);
                      const idx = journey.photos.findIndex(
                        (p) => p.id === photo.id
                      );
                      setLightboxIndex(idx >= 0 ? idx : 0);
                    }}
                    className={`group relative overflow-hidden rounded-card bg-surface w-full text-left ${
                      isFirst ? "lg:col-span-2" : ""
                    }`}
                  >
                    <img
                      src={photo.url}
                      alt={photo.fileName ?? "Highlight"}
                      className={`w-full object-cover transition group-hover:scale-[1.02] ${
                        isFirst
                          ? "aspect-[4/3] sm:aspect-[16/9]"
                          : "aspect-[4/3]"
                      }`}
                    />
                    {photo.hasNote && (
                      <div className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-accent ring-1 ring-white/60" />
                    )}
                  </button>
                );
                return photo.hasNote ? (
                  <NoteTooltip key={photo.id} note={photo.note!}>
                    {btn}
                  </NoteTooltip>
                ) : (
                  <div key={photo.id}>{btn}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══════════════════════════════════════════
            Section 4 — Photo Library
            ═══════════════════════════════════════════ */}
        <section className="mt-14 pb-16">
          <h2 className="text-[22px] font-semibold text-foreground">
            Photo Library
          </h2>
          <p className="mt-1 text-[15px] text-muted">
            Browse the full set of moments from this journey.
          </p>

          {/* Filter bar: category tabs + lightweight With Notes toggle */}
          <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full overflow-x-auto pb-1 sm:w-auto sm:pb-0">
              <SegmentedTabs
                tabs={buildCategoryTabs(journey)}
                active={activeTab}
                onChange={(key) => {
                  setActiveTab(key);
                  setLightboxIndex(null);
                }}
              />
            </div>

            {/* With Notes — lightweight chip, separate from category tabs */}
            <button
              onClick={() => {
                setShowWithNotes((prev) => !prev);
                setLightboxIndex(null);
              }}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                showWithNotes
                  ? "bg-accent/10 text-accent ring-1 ring-accent/20"
                  : "text-muted hover:text-foreground bg-surface"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  showWithNotes ? "bg-accent" : "bg-muted/40"
                }`}
              />
              With Notes
            </button>
          </div>

          {/* Photo grid or quiet empty state */}
          <div className="mt-4">
            {filteredPhotos.length === 0 ? (
              <div className="py-20 text-center">
                <p className="text-[15px] text-muted">
                  {showWithNotes
                    ? "No noted photos in this view yet."
                    : "No photos here yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filteredPhotos.map((photo, i) => {
                  const btn = (
                    <button
                      key={photo.id}
                      onClick={() => openLightbox(i)}
                      className="group relative overflow-hidden rounded-card bg-surface w-full text-left"
                    >
                      <img
                        src={photo.url}
                        alt={photo.fileName ?? "Photo"}
                        className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                      />
                      {photo.isCover && (
                        <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
                          Cover
                        </span>
                      )}
                      {photo.isHighlight && !photo.isCover && (
                        <span className="absolute left-2 top-2 rounded-md bg-foreground/70 px-2 py-0.5 text-[11px] font-medium text-white">
                          Highlight
                        </span>
                      )}
                      {photo.hasNote && (
                        <div className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-accent ring-1 ring-white/60" />
                      )}
                    </button>
                  );
                  return photo.hasNote ? (
                    <NoteTooltip key={photo.id} note={photo.note!}>
                      {btn}
                    </NoteTooltip>
                  ) : (
                    <div key={photo.id}>{btn}</div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ═══════════════════════════════════════════
          Section 5 — Lightbox (unchanged behavior)
          ═══════════════════════════════════════════ */}
      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={closeLightbox}
        onPrev={filteredPhotos.length > 1 ? prevPhoto : undefined}
        onNext={filteredPhotos.length > 1 ? nextPhoto : undefined}
      />
    </div>
  );
}

/** Build category tabs from journey.categories — no counts, no hard-coded enum. */
function buildCategoryTabs(journey: Journey): { key: string; label: string }[] {
  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All" },
  ];

  for (const cat of journey.categories) {
    const hasPhotos = journey.photos.some((p) => p.categoryId === cat.id);
    if (hasPhotos) {
      tabs.push({ key: cat.id, label: cat.name });
    }
  }

  return tabs;
}
