"use client";

import { memo } from "react";
import type { JourneyPhoto, PhotoCategory } from "@/lib/types";
import PhotoTile from "./PhotoTile";

interface PhotoGridProps {
  photos: JourneyPhoto[];
  categories?: PhotoCategory[];
  onSetCover: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onRemove: (id: string) => void;
  onSetNote: (id: string, note: string) => void;
  onSetCategory?: (photoId: string, categoryId: string) => void;
}

function PhotoGrid({
  photos,
  categories,
  onSetCover,
  onToggleHighlight,
  onRemove,
  onSetNote,
  onSetCategory,
}: PhotoGridProps) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          categories={categories}
          onSetCover={onSetCover}
          onToggleHighlight={onToggleHighlight}
          onRemove={onRemove}
          onSetNote={onSetNote}
          onSetCategory={onSetCategory}
        />
      ))}
    </div>
  );
}

export default memo(PhotoGrid);
