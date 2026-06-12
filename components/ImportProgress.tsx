"use client";

import { useEffect, useState } from "react";
import type { PhotoImportProgress } from "@/lib/data/types";

interface ImportProgressProps {
  progress: PhotoImportProgress | null;
  /** If true, also show thumbnail-generation status messages. */
  showThumbnailStage?: boolean;
}

export default function ImportProgress({
  progress,
  showThumbnailStage = false,
}: ImportProgressProps) {
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (!progress || progress.phase === "idle") {
      setVisible(false);
      setFadingOut(false);
      return;
    }

    setVisible(true);
    setFadingOut(false);

    if (progress.phase === "complete") {
      // Fade away after a short delay
      const timer = setTimeout(() => {
        setFadingOut(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!visible || !progress) return null;

  const barWidth = Math.min(100, Math.max(0, progress.percent));

  return (
    <div
      className={`mt-4 rounded-card border border-border bg-surface px-4 py-3 transition-opacity duration-500 ${
        fadingOut ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-label={progress.message}
    >
      {/* Status line */}
      <div className="flex items-center justify-between gap-2 text-[13px]">
        <span className="font-medium text-foreground">
          {progress.phase === "error"
            ? "Import encountered an error"
            : progress.message}
        </span>
        {progress.total > 0 && (
          <span className="tabular-nums text-muted">
            {progress.completedOriginals + progress.failed} / {progress.total}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {progress.phase !== "complete" && progress.phase !== "error" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>
      )}

      {/* Current file name */}
      {progress.currentFileName &&
        progress.phase === "saving-originals" && (
          <p className="mt-1.5 truncate text-[12px] text-muted">
            {progress.currentFileName}
          </p>
        )}

      {/* Thumbnail stage note */}
      {showThumbnailStage &&
        progress.phase === "generating-thumbnails" && (
          <p className="mt-1.5 text-[12px] text-muted">
            Optimizing previews… you can continue editing.
          </p>
        )}

      {/* Failed count */}
      {progress.failed > 0 && (
        <p className="mt-1 text-[12px] text-red-600">
          {progress.failed} photo{progress.failed > 1 ? "s" : ""} could not be
          imported
        </p>
      )}
    </div>
  );
}
