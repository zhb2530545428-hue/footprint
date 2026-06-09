"use client";

import type { JourneyPhoto } from "@/lib/types";

interface PhotoTileProps {
  photo: JourneyPhoto;
  onSetCover: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function PhotoTile({
  photo,
  onSetCover,
  onToggleHighlight,
  onRemove,
}: PhotoTileProps) {
  return (
    <div className="group relative overflow-hidden rounded-card bg-surface">
      <img
        src={photo.url}
        alt={photo.fileName ?? "Photo"}
        className="aspect-[4/3] w-full object-cover"
      />

      {/* Orange note dot */}
      {photo.hasNote && (
        <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
      )}

      {/* Controls stay visible on touch devices and reveal on hover/focus elsewhere. */}
      <div className="absolute inset-0 flex items-end justify-center bg-black/20 transition [@media(hover:hover)]:bg-black/0 [@media(hover:hover)]:group-hover:bg-black/20 group-focus-within:bg-black/20">
        <div className="flex w-full gap-1 px-2 pb-2 transition [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover:translate-y-0 group-focus-within:translate-y-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetCover(photo.id);
            }}
            className={`min-w-0 flex-1 rounded-lg px-1.5 py-1 text-[10px] font-medium transition sm:px-2 sm:py-1.5 sm:text-xs ${
              photo.isCover
                ? "bg-accent text-white"
                : "bg-white/90 text-foreground hover:bg-white"
            }`}
          >
            {photo.isCover ? "★ Cover" : "Set Cover"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHighlight(photo.id);
            }}
            className={`min-w-0 flex-1 rounded-lg px-1.5 py-1 text-[10px] font-medium transition sm:px-2 sm:py-1.5 sm:text-xs ${
              photo.isHighlight
                ? "bg-accent text-white"
                : "bg-white/90 text-foreground hover:bg-white"
            }`}
          >
            {photo.isHighlight ? "✓ Highlight" : "Highlight"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(photo.id);
            }}
            className="rounded-lg bg-white/90 px-1.5 py-1 text-[10px] font-medium text-red-600 hover:bg-white sm:px-2 sm:py-1.5 sm:text-xs"
            aria-label={`Remove ${photo.fileName ?? "photo"}`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
