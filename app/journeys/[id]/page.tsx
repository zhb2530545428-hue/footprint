"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Journey } from "@/lib/types";
import { getJourney, revokePhotoObjectUrls } from "@/lib/storage";
import { deriveTitle, formatDateRange } from "@/lib/utils";
import TopNav from "@/components/TopNav";
import SegmentedTabs from "@/components/SegmentedTabs";
import PhotoLightbox from "@/components/PhotoLightbox";

export default function JourneyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [journey, setJourney] = useState<Journey | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadedJourney: Journey | undefined;

    void getJourney(id)
      .then((found) => {
        loadedJourney = found;
        if (cancelled) {
          if (found) revokePhotoObjectUrls(found.photos);
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
      if (loadedJourney) revokePhotoObjectUrls(loadedJourney.photos);
    };
  }, [id]);

  const lightboxPhotos = useMemo(() => {
    if (!journey) return [];
    if (activeTab === "all") return journey.photos;
    if (activeTab === "highlights") return journey.photos.filter((p) => p.isHighlight);
    return journey.photos.filter((p) => p.categoryId === activeTab);
  }, [journey, activeTab]);

  const lightboxPhoto =
    lightboxIndex !== null ? lightboxPhotos[lightboxIndex] ?? null : null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex > 0 ? lightboxIndex - 1 : lightboxPhotos.length - 1
    );
  };
  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex < lightboxPhotos.length - 1 ? lightboxIndex + 1 : 0
    );
  };

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

      <main className="mx-auto max-w-5xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        {/* Hero */}
        <div className="mb-12">
          {coverPhoto ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-panel sm:aspect-[16/7]">
              <img
                src={coverPhoto.url}
                alt={displayTitle}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 lg:p-8">
                <h1 className="text-[28px] font-semibold text-white lg:text-[36px]">
                  {displayTitle}
                </h1>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-white/80">
                  {dateRange && <span>{dateRange}</span>}
                  {journey.companions.length > 0 && (
                    <span>{journey.companions.join(", ")}</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-panel bg-surface px-8 py-16 text-center">
              <h1 className="text-[28px] font-semibold text-foreground lg:text-[36px]">
                {displayTitle}
              </h1>
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[15px] text-muted">
                {dateRange && <span>{dateRange}</span>}
                {journey.companions.length > 0 && (
                  <span>{journey.companions.join(", ")}</span>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {journey.notes && (
            <p className="mt-6 max-w-2xl text-[15px] text-muted leading-relaxed">
              {journey.notes}
            </p>
          )}

          {/* Edit button */}
          <div className="mt-6">
            <button
              onClick={() => router.push(`/journeys/${journey.id}/edit`)}
              className="rounded-button border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
            >
              Edit Journey
            </button>
          </div>
        </div>

        {/* Highlights */}
        {highlights.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-5 text-[22px] font-semibold text-foreground">
              Highlights
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {highlights.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => {
                    setActiveTab("all");
                    const idx = journey.photos.findIndex(
                      (p) => p.id === photo.id
                    );
                    setLightboxIndex(idx >= 0 ? idx : 0);
                  }}
                  className="group relative overflow-hidden rounded-card bg-surface"
                >
                  <img
                    src={photo.url}
                    alt={photo.fileName ?? "Highlight"}
                    className="aspect-[4/3] w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  {photo.hasNote && (
                    <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All Photos */}
        <section>
          <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-[22px] font-semibold text-foreground">
              All Photos
            </h2>
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
          </div>

          {lightboxPhotos.length === 0 ? (
            <p className="py-16 text-center text-muted">
              No photos in this category.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {lightboxPhotos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => openLightbox(i)}
                  className="group relative overflow-hidden rounded-card bg-surface"
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
                    <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Lightbox */}
      <PhotoLightbox
        photo={lightboxPhoto}
        onClose={closeLightbox}
        onPrev={lightboxPhotos.length > 1 ? prevPhoto : undefined}
        onNext={lightboxPhotos.length > 1 ? nextPhoto : undefined}
      />
    </div>
  );
}

function buildCategoryTabs(journey: Journey): { key: string; label: string }[] {
  const tabs: { key: string; label: string }[] = [
    { key: "all", label: `All (${journey.photos.length})` },
    { key: "highlights", label: `Highlights (${journey.photos.filter((p) => p.isHighlight).length})` },
  ];

  for (const cat of journey.categories) {
    const count = journey.photos.filter((p) => p.categoryId === cat.id).length;
    if (count > 0) {
      tabs.push({ key: cat.id, label: `${cat.name} (${count})` });
    }
  }

  return tabs;
}
