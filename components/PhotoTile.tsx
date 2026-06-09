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
      {/* Use padding-bottom trick for reliable aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
        <img
          src={photo.url}
          alt={photo.fileName ?? "Photo"}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* Orange note dot */}
      {photo.hasNote && (
        <div className="absolute right-2 top-2 z-10 h-2 w-2 rounded-full bg-accent" />
      )}

      {/* Cover badge */}
      {photo.isCover && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-white">
          Cover
        </span>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-0 flex items-end justify-center bg-black/0 transition group-hover:bg-black/20">
        <div className="flex w-full gap-1 px-2 pb-2 opacity-0 transition group-hover:opacity-100">
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
