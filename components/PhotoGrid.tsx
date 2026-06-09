"use client";

import type { JourneyPhoto } from "@/lib/types";
import PhotoTile from "./PhotoTile";

interface PhotoGridProps {
  photos: JourneyPhoto[];
  onSetCover: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function PhotoGrid({
  photos,
  onSetCover,
  onToggleHighlight,
  onRemove,
}: PhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          onSetCover={onSetCover}
          onToggleHighlight={onToggleHighlight}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
