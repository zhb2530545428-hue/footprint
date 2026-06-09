"use client";

import Link from "next/link";
import type { Journey } from "@/lib/types";
import { deriveTitle, formatDateRange } from "@/lib/utils";

interface JourneyCardProps {
  journey: Journey;
}

export default function JourneyCard({ journey }: JourneyCardProps) {
  const coverPhoto = journey.photos.find(
    (p) => p.id === journey.coverPhotoId
  );
  const displayTitle = deriveTitle(
    journey.title,
    journey.location,
    journey.startDate
  );
  const dateRange = formatDateRange(journey.startDate, journey.endDate);

  return (
    <Link href={`/journeys/${journey.id}`} className="group block">
      <div className="overflow-hidden rounded-card bg-surface transition group-hover:opacity-95">
        {/* Cover image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverPhoto ? (
            <img
              src={coverPhoto.url}
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
        <div className="px-4 py-3">
          <p className="text-[15px] font-semibold text-foreground leading-snug">
            {journey.location}
          </p>
          {dateRange && (
            <p className="mt-0.5 text-[14px] text-muted">{dateRange}</p>
          )}
          {journey.companions.length > 0 && (
            <p className="mt-1 text-[14px] text-muted">
              {journey.companions.join(", ")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
