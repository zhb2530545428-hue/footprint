"use client";

import { useEffect, useState } from "react";
import { isTauri, setDesktopMode } from "@/lib/environment";
import { getLibraryPath } from "@/lib/desktop/library";
import { initDatabase, closeDatabase } from "@/lib/desktop/sqlite";
import { initializeDataLayer } from "@/lib/data/repositoryFactory";
import { loadDesktopSettings } from "@/lib/data/desktopLibraryRepository";
import { allow_library_path } from "@/lib/desktop/tauri-bridge";
import TopNav from "./TopNav";
import LibrarySetupOverlay from "./LibrarySetupOverlay";

interface AppShellProps {
  children: React.ReactNode;
}

type ShellState = "loading" | "setup" | "ready";

export default function AppShell({ children }: AppShellProps) {
  const [state, setState] = useState<ShellState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isTauri()) {
        // Browser mode — use localStorage/IndexedDB directly
        await initializeDataLayer();
        if (!cancelled) setState("ready");
        return;
      }

      // Desktop mode — check for existing Library
      try {
        const savedPath = await getLibraryPath();

        if (savedPath) {
          // Try to open existing Library
          try {
            await allow_library_path(savedPath);
            await initDatabase(savedPath);
            await loadDesktopSettings();
            setDesktopMode(true);
            await initializeDataLayer();
            if (!cancelled) setState("ready");
            return;
          } catch (error) {
            console.error("Failed to open saved Footprint Library", error);
            // Library invalid or inaccessible — fall through to setup
          }
        }

        // No valid Library — show setup overlay
        if (!cancelled) setState("setup");
      } catch (error) {
        console.error("Failed to read saved Footprint Library path", error);
        if (!cancelled) setState("setup");
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleLibraryReady = () => {
    setState("ready");
  };

  // ── Loading ────────────────────────────────────────────────────
  // Matches the page-level loading pattern: TopNav + centered spinner

  if (state === "loading") {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  // ── Library Setup ──────────────────────────────────────────────
  // App frame (TopNav + page layout) is visible behind the overlay

  if (state === "setup") {
    return (
      <>
        <TopNav />
        <div className="min-h-screen">
          <main className="mx-auto max-w-7xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
            {/* Placeholder page content — TopNav provides the only "+ New Journey" CTA */}
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-6 text-6xl">🏕️</div>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">
                No footprints yet
              </h2>
              <p className="max-w-sm text-base text-muted leading-relaxed">
                Create your first journey and turn photos into memories.
              </p>
            </div>
          </main>
        </div>
        <LibrarySetupOverlay onLibraryReady={handleLibraryReady} />
      </>
    );
  }

  // ── App Ready ──────────────────────────────────────────────────

  return <>{children}</>;
}
