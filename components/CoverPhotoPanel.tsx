"use client";

import type { JourneyPhoto } from "@/lib/types";
import { getPhotoDisplayUrl } from "@/lib/data/desktopLibraryRepository";

interface CoverPhotoPanelProps {
  coverPhoto: JourneyPhoto | undefined;
  hasPhotos: boolean;
}

export default function CoverPhotoPanel({
  coverPhoto,
  hasPhotos,
}: CoverPhotoPanelProps) {
  return (
    <section className="rounded-panel bg-white ring-1 ring-black/[0.04] px-6 py-6 lg:px-8 lg:py-8">
      <h2 className="text-[20px] font-semibold text-foreground">
        Cover Photo
      </h2>
      <p className="mt-1 text-[14px] text-muted">
        This is the first image you&rsquo;ll see when opening this memory.
      </p>

      {coverPhoto ? (
        <div className="mt-5">
          <div className="overflow-hidden rounded-card max-w-md">
            <img
              src={getPhotoDisplayUrl(coverPhoto)}
              alt={coverPhoto.fileName ?? "Cover photo"}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Current cover — choose a different one from the photos below.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-card bg-surface px-6 py-10 text-center max-w-md">
          <p className="text-[14px] text-muted">
            {hasPhotos
              ? "Choose a cover from your photos below."
              : "Upload photos first, then choose a cover."}
          </p>
        </div>
      )}
    </section>
  );
}
