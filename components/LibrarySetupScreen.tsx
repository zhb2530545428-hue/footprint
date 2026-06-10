/**
 * @deprecated — Replaced by LibrarySetupOverlay.tsx for in-app overlay use.
 * Kept for reference. Use LibrarySetupOverlay instead.
 */
"use client";

import { useState } from "react";
import { isTauri } from "@/lib/environment";
import { create_library, check_library } from "@/lib/desktop/tauri-bridge";
import { setLibraryPath, getLibraryDisplayName } from "@/lib/desktop/library";
import { initDatabase } from "@/lib/desktop/sqlite";
import { setDataMode } from "@/lib/data/repositoryFactory";
import { checkBrowserData, migrateBrowserToLibrary } from "@/lib/desktop/migration";

interface LibrarySetupScreenProps {
  onLibraryReady: () => void;
}

export default function LibrarySetupScreen({ onLibraryReady }: LibrarySetupScreenProps) {
  const [step, setStep] = useState<"choose" | "creating" | "opening" | "migrating" | "error">(
    "choose"
  );
  const [error, setError] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [migrationReport, setMigrationReport] = useState<{
    browserCount: number;
  } | null>(null);

  // ── Create new Library ──────────────────────────────────────────

  const handleCreateLibrary = async () => {
    if (!isTauri()) {
      setError("Library setup is only available in the desktop app.");
      setStep("error");
      return;
    }

    setStep("creating");
    setError("");

    try {
      const { open } = await import("@tauri-apps/plugin-dialog");

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose a folder for your Footprint Library",
      });

      if (!selected || typeof selected !== "string") {
        setStep("choose");
        return;
      }

      // Create Library structure via Rust command
      await create_library(selected);

      // Initialize SQLite database
      await initDatabase(selected);

      // Store the path
      await setLibraryPath(selected);
      setSelectedPath(selected);

      // Check for browser data to migrate
      const browserData = await checkBrowserData();
      if (browserData.journeyCount > 0) {
        setMigrationReport({ browserCount: browserData.journeyCount });
        setStep("migrating");
      } else {
        // No browser data — finish setup
        setDataMode("desktop");
        onLibraryReady();
      }
    } catch (err) {
      setError(`Failed to create Library: ${err}`);
      setStep("error");
    }
  };

  // ── Open existing Library ──────────────────────────────────────

  const handleOpenLibrary = async () => {
    if (!isTauri()) {
      setError("Library setup is only available in the desktop app.");
      setStep("error");
      return;
    }

    setStep("opening");
    setError("");

    try {
      const { open } = await import("@tauri-apps/plugin-dialog");

      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select your Footprint Library folder",
      });

      if (!selected || typeof selected !== "string") {
        setStep("choose");
        return;
      }

      // Validate
      const valid = await check_library(selected);
      if (!valid) {
        setError(
          "This folder doesn't contain a Footprint Library. Please select a valid Library folder or create a new one."
        );
        setStep("error");
        return;
      }

      // Initialize SQLite
      await initDatabase(selected);

      // Store the path
      await setLibraryPath(selected);
      setSelectedPath(selected);

      // Check for browser data
      const browserData = await checkBrowserData();
      if (browserData.journeyCount > 0) {
        setMigrationReport({ browserCount: browserData.journeyCount });
        setStep("migrating");
      } else {
        setDataMode("desktop");
        onLibraryReady();
      }
    } catch (err) {
      setError(`Failed to open Library: ${err}`);
      setStep("error");
    }
  };

  // ── Migration ──────────────────────────────────────────────────

  const handleMigrate = async () => {
    if (!selectedPath) return;

    try {
      const report = await migrateBrowserToLibrary(selectedPath);

      if (report.errors.length > 0) {
        console.warn("Migration warnings:", report.errors);
      }

      setDataMode("desktop");
      onLibraryReady();
    } catch (err) {
      setError(`Migration failed: ${err}`);
      setStep("error");
    }
  };

  const handleSkipMigration = () => {
    setDataMode("desktop");
    onLibraryReady();
  };

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-panel bg-white px-8 py-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04]">
        {/* Icon */}
        <div className="mb-6 text-5xl">📷</div>

        <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
          Footprint
        </h1>

        {step === "choose" && (
          <>
            <p className="mt-3 text-[15px] text-muted leading-relaxed">
              Choose your Footprint Library
            </p>
            <p className="mt-1 text-[13px] text-muted/70 leading-relaxed">
              Keep your journeys, photos, notes, and categories in one local folder.
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleCreateLibrary}
                className="w-full rounded-button bg-foreground px-6 py-3 text-[15px] font-medium text-white transition hover:bg-foreground/85"
              >
                Create new Library
              </button>
              <button
                onClick={handleOpenLibrary}
                className="w-full rounded-button border border-border px-6 py-3 text-[15px] font-medium text-foreground transition hover:bg-surface"
              >
                Open existing Library
              </button>
            </div>

            <p className="mt-6 text-[12px] text-muted/50 leading-relaxed">
              You can place this folder on your computer, an external drive, or a
              synced folder you control.
            </p>
          </>
        )}

        {(step === "creating" || step === "opening") && (
          <div className="py-8">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
            <p className="mt-4 text-[15px] text-muted">
              {step === "creating" ? "Setting up your Library…" : "Opening your Library…"}
            </p>
          </div>
        )}

        {step === "migrating" && migrationReport && (
          <>
            <p className="mt-3 text-[15px] text-muted leading-relaxed">
              We found {migrationReport.browserCount} memor{migrationReport.browserCount === 1 ? "y" : "ies"} in this browser.
            </p>
            <p className="mt-1 text-[13px] text-muted/70 leading-relaxed">
              Import them into your Library so they can travel with the app.
            </p>

            <div className="mt-8 space-y-3">
              <button
                onClick={handleMigrate}
                className="w-full rounded-button bg-accent px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-accent/85"
              >
                Import browser data
              </button>
              <button
                onClick={handleSkipMigration}
                className="w-full rounded-button border border-border px-6 py-3 text-[15px] font-medium text-muted transition hover:text-foreground"
              >
                Skip for now
              </button>
            </div>

            <p className="mt-4 text-[12px] text-muted/50">
              Your original browser data will not be deleted.
            </p>
          </>
        )}

        {step === "error" && (
          <>
            <p className="mt-3 text-[15px] text-red-600 leading-relaxed">{error}</p>
            <div className="mt-8 space-y-3">
              <button
                onClick={() => { setStep("choose"); setError(""); }}
                className="w-full rounded-button border border-border px-6 py-3 text-[15px] font-medium text-foreground transition hover:bg-surface"
              >
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
