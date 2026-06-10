"use client";

import type { JourneyPhoto } from "@/lib/types";

interface HighlightsPreviewProps {
  highlights: JourneyPhoto[];
}

export default function HighlightsPreview({
  highlights,
}: HighlightsPreviewProps) {
  return (
    <section className="rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-6 lg:px-8 lg:py-8">
      <h2 className="text-[20px] font-semibold text-foreground">
        Highlights
      </h2>
      <p className="mt-1 text-[14px] text-muted">
        Pick the moments that best represent this journey.
      </p>

      {highlights.length > 0 ? (
        <div className="mt-5">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {highlights.map((photo) => (
              <div
                key={photo.id}
                className="shrink-0 w-[120px] sm:w-[140px]"
              >
                <div className="overflow-hidden rounded-card ring-2 ring-accent/30">
                  <img
                    src={photo.url}
                    alt={photo.fileName ?? "Highlight"}
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                {photo.hasNote && (
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
                    <span className="text-[11px] text-muted truncate">
                      {photo.note}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-muted">
            {highlights.length} highlight{highlights.length > 1 ? "s" : ""}{" "}
            selected — toggle highlights from the photos below.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-card bg-surface px-6 py-10 text-center">
          <p className="text-[14px] text-muted">
            No highlights yet. Mark a few photos below.
          </p>
        </div>
      )}
    </section>
  );
}
