"use client";

import { useEffect, useState } from "react";

export type ArchiveStep = "preparing" | "saving" | "finishing";

interface ArchivingModalProps {
  open: boolean;
  step: ArchiveStep;
  /** 0–100 progress percentage */
  percent?: number;
  /** Optional detail, e.g. "4 / 10 photos" */
  detail?: string;
}

const STEP_LABELS: Record<ArchiveStep, string> = {
  preparing: "Preparing journey…",
  saving: "Saving to Library…",
  finishing: "Finishing up…",
};

export default function ArchivingModal({
  open,
  step,
  percent = 0,
  detail,
}: ArchivingModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const barWidth = Math.min(100, Math.max(0, percent));

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={STEP_LABELS[step]}
    >
      <div
        className={`w-[320px] rounded-card bg-white px-7 py-6 shadow-lg ring-1 ring-black/[0.06] transition-transform duration-300 ${
          visible ? "scale-100" : "scale-95"
        }`}
      >
        {/* Step label */}
        <p className="text-center text-[15px] font-medium text-foreground">
          {STEP_LABELS[step]}
        </p>

        {/* Detail */}
        {detail && (
          <p className="mt-1 text-center text-[13px] text-muted">{detail}</p>
        )}

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface ring-1 ring-black/[0.04]">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
            style={{ width: `${barWidth}%` }}
          />
        </div>

        {/* Percentage label */}
        <p className="mt-1.5 text-center text-[12px] tabular-nums text-muted">
          {percent}%
        </p>

        {/* Step dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {(Object.keys(STEP_LABELS) as ArchiveStep[]).map((s, i) => {
            const currentIdx = Object.keys(STEP_LABELS).indexOf(step);
            const isActive = i === currentIdx;
            const isPast = i < currentIdx;

            return (
              <div
                key={s}
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  isActive
                    ? "bg-accent"
                    : isPast
                      ? "bg-accent/40"
                      : "bg-muted"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
