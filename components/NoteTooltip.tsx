"use client";

import { useState, useRef, useCallback, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { computeFloatingCardPosition } from "@/lib/note-tooltip-position";

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
  const [positioned, setPositioned] = useState(false);
  const [entered, setEntered] = useState(false);
  const [cardPos, setCardPos] = useState({ left: 0, top: 0 });

  const cardRef = useRef<HTMLDivElement | null>(null);
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

  // Measure the rendered card before revealing it so collision handling uses
  // the note's real height instead of a large fixed estimate.
  useEffect(() => {
    if (!visible) {
      setPositioned(false);
      return;
    }

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    setCardPos(
      computeFloatingCardPosition({
        cursorX: cursorRef.current.x,
        cursorY: cursorRef.current.y,
        cardWidth: rect.width,
        cardHeight: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
    );
    setPositioned(true);
  }, [visible]);

  // Entrance animation starts only after the card has its final position.
  useEffect(() => {
    if (!positioned) {
      setEntered(false);
      return;
    }
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, [positioned]);

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
            ref={cardRef}
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
            style={{
              left: cardPos.left,
              top: cardPos.top,
              visibility: positioned ? "visible" : "hidden",
            }}
          >
            {trimmed}
          </div>,
          document.body
        )}
    </div>
  );
}
