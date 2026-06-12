"use client";

import { memo, useState } from "react";
import type { JourneyPhoto, PhotoCategory } from "@/lib/types";
import { getPhotoDisplayUrl } from "@/lib/data/desktopLibraryRepository";

interface PhotoTileProps {
  photo: JourneyPhoto;
  categories?: PhotoCategory[];
  onSetCover: (id: string) => void;
  onToggleHighlight: (id: string) => void;
  onRemove: (id: string) => void;
  onSetNote: (id: string, note: string) => void;
  onSetCategory?: (photoId: string, categoryId: string) => void;
}

function PhotoTile({
  photo,
  categories,
  onSetCover,
  onToggleHighlight,
  onRemove,
  onSetNote,
  onSetCategory,
}: PhotoTileProps) {
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [draftNote, setDraftNote] = useState(photo.note ?? "");

  const handleSaveNote = () => {
    const trimmed = draftNote.trim();
    onSetNote(photo.id, trimmed);
    setDraftNote(trimmed);
    setShowNoteInput(false);
  };

  const handleCancelNote = () => {
    setDraftNote(photo.note ?? "");
    setShowNoteInput(false);
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-card bg-surface ${
        photo.isCover ? "ring-2 ring-accent/40" : ""
      }`}
    >
      {/* Use padding-bottom trick for reliable aspect ratio */}
      <div className="relative w-full" style={{ paddingBottom: "75%" }}>
        <img
          src={getPhotoDisplayUrl(photo)}
          alt={photo.fileName ?? "Photo"}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>

      {/* ── Always-visible state indicators ── */}

      {/* State indicators: Cover and Highlight badges */}
      {photo.isCover && (
        <span className="absolute left-2 top-2 z-10 rounded-md bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-white select-none">
          Cover
        </span>
      )}
      {photo.isHighlight && (
        <span
          className={`absolute left-2 z-10 rounded-md bg-foreground/70 px-1.5 py-0.5 text-[10px] font-medium text-white select-none ${
            photo.isCover ? "top-9" : "top-2"
          }`}
        >
          Highlight
        </span>
      )}

      {/* Orange note dot */}
      {photo.hasNote && (
        <div
          className="absolute right-2 top-2 z-10 h-2.5 w-2.5 rounded-full bg-accent ring-1 ring-white/60"
          title={photo.note}
        />
      )}

      {/* ── Hover-revealed controls ── */}

      {/* Note input — appears above controls */}
      {showNoteInput && (
        <div
          className="absolute inset-x-2 bottom-[52px] z-20 rounded-lg bg-white/95 p-2 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <textarea
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value)}
            placeholder="Add a note about this photo…"
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-white px-2 py-1.5 text-[12px] text-foreground outline-none placeholder:text-muted"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSaveNote();
              }
              if (e.key === "Escape") {
                handleCancelNote();
              }
            }}
          />
          <div className="mt-1 flex justify-end gap-1.5">
            <button
              type="button"
              onClick={handleCancelNote}
              className="rounded-md px-2 py-0.5 text-[11px] text-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveNote}
              className="rounded-md bg-accent px-2.5 py-0.5 text-[11px] font-medium text-white hover:bg-accent/85"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Action bar — appears on hover */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/40 via-black/20 to-transparent px-2 pb-2 pt-6 opacity-0 transition group-hover:opacity-100">
        {/* Primary curation: Cover + Highlight */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSetCover(photo.id);
          }}
          className={`rounded-lg px-1.5 py-1 text-[10px] font-medium transition sm:px-2 sm:py-1.5 sm:text-[11px] ${
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
          className={`rounded-lg px-1.5 py-1 text-[10px] font-medium transition sm:px-2 sm:py-1.5 sm:text-[11px] ${
            photo.isHighlight
              ? "bg-accent text-white"
              : "bg-white/90 text-foreground hover:bg-white"
          }`}
        >
          {photo.isHighlight ? "✓ Highlight" : "Highlight"}
        </button>

        {/* Spacer: separates curation from memory actions */}
        <span className="flex-1" />

        {/* Memory actions: Note + Category */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setDraftNote(photo.note ?? "");
            setShowNoteInput(true);
          }}
          className={`rounded-lg px-1.5 py-1 text-[10px] font-medium transition sm:px-2 sm:py-1.5 sm:text-[11px] ${
            photo.hasNote
              ? "bg-accent/20 text-accent hover:bg-accent/30"
              : "bg-white/90 text-foreground hover:bg-white"
          }`}
        >
          {photo.hasNote ? "Note ✎" : "Note"}
        </button>

        {categories && categories.length > 0 && onSetCategory && (
          <select
            value={photo.categoryId ?? "default-other"}
            onChange={(e) => {
              e.stopPropagation();
              onSetCategory(photo.id, e.target.value);
            }}
            className="rounded-lg bg-white/90 px-1.5 py-1 text-[10px] font-medium text-foreground outline-none transition hover:bg-white sm:px-2 sm:py-1.5 sm:text-[11px] appearance-none cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        )}

        {/* Destructive: Remove — visually separated */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(photo.id);
          }}
          className="ml-0.5 rounded-lg px-1.5 py-1 text-[10px] font-medium text-red-600 transition hover:bg-white/90 sm:px-2 sm:py-1.5 sm:text-[11px]"
          aria-label={`Remove ${photo.fileName ?? "photo"}`}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default memo(PhotoTile);
