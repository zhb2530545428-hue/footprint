"use client";

import Link from "next/link";
import type { Journey } from "@/lib/types";
import type { FootprintSettings } from "@/lib/settings";
import { deriveTitle, formatDateRange, formatJourneyLocation } from "@/lib/utils";
import { getPhotoDisplayUrl } from "@/lib/data/desktopLibraryRepository";

interface JourneyCardProps {
  journey: Journey;
  settings: FootprintSettings;
}

export default function JourneyCard({ journey, settings }: JourneyCardProps) {
  const coverPhoto = journey.photos.find(
    (p) => p.id === journey.coverPhotoId
  );

  // Derive display location from structured fields, falling back to legacy location
  const displayLocation = formatJourneyLocation({
    province: journey.locationProvince,
    cities: journey.locationCities,
    city: journey.locationCity,
    fallback: journey.location,
  });

  const displayTitle = deriveTitle(
    journey.title,
    displayLocation,
    journey.startDate
  );
  const dateRange = formatDateRange(journey.startDate, journey.endDate);

  const showLocation = settings.homepageCard.showLocation;
  const showTime = settings.homepageCard.showTime;
  const showCompanions = settings.homepageCard.showCompanions;

  const hasAnyMeta = showLocation || showTime || (showCompanions && journey.companions.length > 0);

  return (
    <Link href={`/journeys/${journey.id}`} className="group block">
      <div className="overflow-hidden rounded-card bg-surface transition group-hover:opacity-95">
        {/* Cover image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverPhoto ? (
            <img
              src={getPhotoDisplayUrl(coverPhoto)}
              alt={displayTitle}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface text-muted text-sm">
              No cover photo
            </div>
          )}
        </div>
        {/* Card info */}
        {hasAnyMeta && (
          <div className="px-4 py-3">
            {showLocation && (
              <p className="text-[15px] font-semibold text-foreground leading-snug">
                {displayLocation}
              </p>
            )}
            {showTime && dateRange && (
              <p className="mt-0.5 text-[14px] text-muted">{dateRange}</p>
            )}
            {showCompanions && journey.companions.length > 0 && (
              <p className="mt-1 text-[14px] text-muted">
                {journey.companions.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
