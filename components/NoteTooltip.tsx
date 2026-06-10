"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface NoteTooltipProps {
  note: string;
  children: ReactNode;
  /** Delay in ms before showing the floating note card (default 1000) */
  delay?: number;
}

/**
 * Wraps children and shows a floating Apple-style note card on desktop hover
 * after a configurable delay. The card is positioned near the cursor with
 * viewport collision handling. On touch devices the card never appears —
 * mobile users read notes in the lightbox.
 */
export default function NoteTooltip({ note, children, delay = 1000 }: NoteTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [cardPos, setCardPos] = useState({ left: 0, top: 0 });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasTouchRef = useRef(false);
  const supportsHoverRef = useRef(true);
  const cursorRef = useRef({ x: 0, y: 0 });

  // Guard against SSR and check whether the device supports fine hover
  useEffect(() => {
    setMounted(true);
    supportsHoverRef.current = window.matchMedia(
      "(hover: hover) and (pointer: fine)"
    ).matches;
  }, []);

  // Entrance animation: after the portal mounts we flip `entered` on the
  // next animation frame so the browser paints the "before" state first.
  useEffect(() => {
    if (!visible) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (!supportsHoverRef.current) return;
      wasTouchRef.current = false;
      cursorRef.current = { x: e.clientX, y: e.clientY };
      clearTimer();
      timerRef.current = setTimeout(() => {
        setCardPos(computePosition(cursorRef.current.x, cursorRef.current.y));
        setVisible(true);
      }, delay);
    },
    [delay, clearTimer]
  );

  // Update cursor position while the timer is running so the card appears
  // at the latest hover point when the timer fires.
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    cursorRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  // Prevent touch interactions from triggering the hover card.
  const handleTouchStart = useCallback(() => {
    wasTouchRef.current = true;
    clearTimer();
    setVisible(false);
  }, [clearTimer]);

  const trimmed = note.trim();
  if (!trimmed) return <>{children}</>;

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {children}

      {mounted &&
        visible &&
        !wasTouchRef.current &&
        createPortal(
          <div
            className={[
              // Escape the photo tile / grid stacking context
              "pointer-events-none fixed z-[100]",
              // Size & overflow
              "w-[min(360px,calc(100vw-32px))] max-h-[70vh] overflow-y-auto",
              // Apple-like translucent surface
              "rounded-3xl bg-white/85 backdrop-blur-xl",
              "ring-1 ring-black/5",
              "shadow-[0_24px_80px_rgba(15,23,42,0.16)]",
              // Internal spacing
              "px-5 py-4",
              // Calm, readable typography — no line-clamp
              "text-[14px] leading-relaxed text-foreground",
              "whitespace-pre-wrap break-words",
              // Smooth entrance
              "transition-all duration-200 ease-out",
              entered
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[0.96] translate-y-1.5",
            ].join(" ")}
            style={{ left: cardPos.left, top: cardPos.top }}
          >
            {trimmed}
          </div>,
          document.body
        )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Viewport collision helper
// ---------------------------------------------------------------------------

const CARD_W = 360;
const CARD_H_EST = 520;
const OFFSET = 16;
const MARGIN = 16;

function computePosition(cx: number, cy: number): { left: number; top: number } {
  if (typeof window === "undefined") return { left: 0, top: 0 };

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = cx + OFFSET;
  let top = cy + OFFSET;

  // If the card would overflow the right viewport edge, place it to the
  // left of the cursor instead.
  if (left + CARD_W + MARGIN > vw) {
    left = cx - CARD_W - OFFSET;
  }

  // If the card would overflow the bottom viewport edge, place it above
  // the cursor instead.
  if (top + CARD_H_EST + MARGIN > vh) {
    top = cy - CARD_H_EST - OFFSET;
  }

  // Clamp within the viewport with at least MARGIN pixels of breathing room.
  left = Math.max(MARGIN, Math.min(left, vw - CARD_W - MARGIN));
  top = Math.max(MARGIN, top);

  return { left, top };
}
