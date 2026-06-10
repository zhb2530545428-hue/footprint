"use client";

import { useEffect, useCallback } from "react";
import type { JourneyPhoto } from "@/lib/types";

interface PhotoLightboxProps {
  photo: JourneyPhoto | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function PhotoLightbox({
  photo,
  onClose,
  onPrev,
  onNext,
}: PhotoLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    if (!photo) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [photo, handleKeyDown]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Prev button */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Previous photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
          aria-label="Next photo"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      )}

      {/* Photo */}
      <img
        src={photo.url}
        alt={photo.fileName ?? "Photo"}
        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Note below photo */}
      {photo.note && (
        <div
          className="mt-5 w-full max-w-lg px-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/40">
              Memory Note
            </span>
          </div>
          <p className="text-center text-[15px] text-white/85 leading-relaxed">
            {photo.note}
          </p>
        </div>
      )}
    </div>
  );
}
