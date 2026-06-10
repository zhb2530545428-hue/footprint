"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface NoteTooltipProps {
  note: string;
  children: ReactNode;
  /** Delay in ms before showing the tooltip (default 1000) */
  delay?: number;
}

/**
 * Wraps children and shows a subtle note tooltip on desktop hover after a delay.
 * On touch devices the tooltip never appears (mobile users view notes in the lightbox).
 */
export default function NoteTooltip({ note, children, delay = 1000 }: NoteTooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTouchRef = useRef(false);

  const handlePointerEnter = useCallback(() => {
    // Skip hover preview on touch — mobile users use the lightbox
    wasTouchRef.current = false;
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const handlePointerLeave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisible(false);
  }, []);

  // Eat touchstart so we don't trigger hover + tap at the same time
  const handleTouchStart = useCallback(() => {
    wasTouchRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
    >
      {children}

      {/* Tooltip */}
      {visible && !wasTouchRef.current && (
        <div
          className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 pointer-events-none"
          onMouseEnter={(e) => e.stopPropagation()}
        >
          <div className="max-w-[220px] rounded-lg bg-white/95 px-3 py-2 text-[12px] leading-relaxed text-foreground shadow-lg ring-1 ring-black/5">
            <p className="line-clamp-4">{note}</p>
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-[5px] border-transparent border-t-white/95" />
        </div>
      )}
    </div>
  );
}
