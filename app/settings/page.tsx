"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FootprintSettings } from "@/lib/settings";
import { getSettingsRepo } from "@/lib/data/repositoryFactory";
import { isTauri } from "@/lib/environment";
import {
  getLibraryPath,
  setLibraryPath,
  getLibraryDisplayName,
  openLibraryFolder,
  getRecentLibraries,
  addRecentLibrary,
  removeRecentLibrary,
} from "@/lib/desktop/library";
import { initDatabase, closeDatabase } from "@/lib/desktop/sqlite";
import { setDataMode } from "@/lib/data/repositoryFactory";
import { loadDesktopSettings } from "@/lib/data/desktopLibraryRepository";
import { checkBrowserData, migrateBrowserToLibrary } from "@/lib/desktop/migration";
import { allow_library_path, check_library, create_library } from "@/lib/desktop/tauri-bridge";
import { rebuildMissingThumbnails } from "@/lib/desktop/thumbnail";
import TopNav from "@/components/TopNav";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<FootprintSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [libPath, setLibPath] = useState<string | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryMessage, setLibraryMessage] = useState("");
  const [recentLibraries, setRecentLibraries] = useState<string[]>([]);
  const [thumbnailMessage, setThumbnailMessage] = useState("");

  useEffect(() => {
    setSettings(getSettingsRepo().getSettings());
    if (isTauri()) {
      getLibraryPath().then((p) => setLibPath(p ?? null)).catch(() => {});
      getRecentLibraries().then(setRecentLibraries).catch(() => {});
    }
  }, []);

  // ── Library handlers ──────────────────────────────────────────

  const reloadRecent = async () => {
    try {
      setRecentLibraries(await getRecentLibraries());
    } catch { /* ignore */ }
  };

  const handleChangeLibrary = async () => {
    if (!isTauri()) return;
    setLibraryLoading(true);
    setLibraryMessage("");
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Select your Footprint Library folder",
      });
      if (!selected || typeof selected !== "string") {
        setLibraryLoading(false);
        return;
      }

      const result = await check_library(selected);
      if (!result.valid) {
        if (!result.folder_exists) {
          setLibraryMessage("The selected folder does not exist.");
        } else if (!result.db_exists && !result.can_write) {
          setLibraryMessage("Cannot read or write to this folder. Please check permissions.");
        } else {
          setLibraryMessage("This folder does not contain a valid Footprint Library.");
        }
        setLibraryLoading(false);
        return;
      }

      await closeDatabase().catch(() => {});
      await setLibraryPath(selected);
      await allow_library_path(selected);
      await initDatabase(selected);
      setSettings(await loadDesktopSettings());
      setDataMode("desktop");
      setLibPath(selected);
      await addRecentLibrary(selected);
      await reloadRecent();
      setLibraryMessage("Library changed successfully.");
    } catch (e) {
      setLibraryMessage(`Failed to change Library: ${e}`);
    }
    setLibraryLoading(false);
  };

  const handleCreateLibrary = async () => {
    if (!isTauri()) return;
    setLibraryLoading(true);
    setLibraryMessage("");
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose a folder for your new Footprint Library",
      });
      if (!selected || typeof selected !== "string") {
        setLibraryLoading(false);
        return;
      }

      await create_library(selected);
      await allow_library_path(selected);
      await initDatabase(selected);
      await loadDesktopSettings();

      await setLibraryPath(selected);
      setLibPath(selected);
      setDataMode("desktop");
      await addRecentLibrary(selected);
      await reloadRecent();

      // Check for browser data
      const browserData = await checkBrowserData();
      if (browserData.journeyCount > 0) {
        setLibraryMessage(
          `Library created. Found ${browserData.journeyCount} browser memor${browserData.journeyCount === 1 ? "y" : "ies"} — use "Import browser data" to bring them in.`
        );
      } else {
        setLibraryMessage("New Library created successfully.");
      }
    } catch (e) {
      setLibraryMessage(`Failed to create Library: ${e}`);
    }
    setLibraryLoading(false);
  };

  const handleOpenLibraryFolder = async () => {
    await openLibraryFolder().catch(() => {
      setLibraryMessage("Could not open the Library folder.");
    });
  };

  const handleImportBrowserData = async () => {
    if (!libPath) return;
    setLibraryLoading(true);
    setLibraryMessage("");
    try {
      const report = await migrateBrowserToLibrary(libPath);
      setLibraryMessage(
        `Imported ${report.journeysImported} journeys, ${report.photosImported} photos.${report.errors.length > 0 ? ` ${report.errors.length} errors.` : ""}`
      );
    } catch (e) {
      setLibraryMessage(`Import failed: ${e}`);
    }
    setLibraryLoading(false);
  };

  const handleRebuildThumbnails = async () => {
    setThumbnailMessage("Rebuilding thumbnails…");
    try {
      const result = await rebuildMissingThumbnails();
      if (result.errors.length > 0) {
        setThumbnailMessage(
          `Rebuilt ${result.rebuilt} thumbnails. ${result.errors.length} errors occurred.`
        );
      } else {
        setThumbnailMessage(
          `Rebuilt ${result.rebuilt} thumbnails. ${result.skipped} were skipped.`
        );
      }
    } catch (e) {
      setThumbnailMessage(`Thumbnail rebuild failed: ${e}`);
    }
  };

  const handleSwitchToRecent = async (path: string) => {
    if (!isTauri()) return;
    setLibraryLoading(true);
    setLibraryMessage("");
    try {
      const result = await check_library(path);
      if (!result.valid) {
        setLibraryMessage("This Library is no longer accessible. You can remove it from the list.");
        setLibraryLoading(false);
        return;
      }

      await closeDatabase().catch(() => {});
      await setLibraryPath(path);
      await allow_library_path(path);
      await initDatabase(path);
      setSettings(await loadDesktopSettings());
      setDataMode("desktop");
      setLibPath(path);
      await addRecentLibrary(path);
      await reloadRecent();
      setLibraryMessage("Switched to selected Library.");
    } catch (e) {
      setLibraryMessage(`Failed to open Library: ${e}`);
    }
    setLibraryLoading(false);
  };

  // ── Early return ───────────────────────────────────────────────

  if (!settings) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  const toggle = (key: "showLocation" | "showTime" | "showCompanions") => {
    const next: FootprintSettings = {
      ...settings,
      homepageCard: {
        ...settings.homepageCard,
        [key]: !settings.homepageCard[key],
      },
    };
    setSettings(next);
    getSettingsRepo().saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-2xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          Settings
        </h1>
        <p className="mb-10 text-[15px] text-muted">
          Customize how your Footprints appear.
        </p>

        <section className="rounded-panel border border-border bg-white px-6 py-6">
          <h2 className="mb-1 text-[17px] font-semibold text-foreground">
            Homepage Card Display
          </h2>
          <p className="mb-5 text-[14px] text-muted leading-relaxed">
            Choose which Journey metadata appears on homepage cards.
          </p>

          <div className="space-y-4">
            {/* Show location */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showLocation}
                  onChange={() => toggle("showLocation")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show location</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Kyoto, Japan</span>
              </div>
            </label>

            {/* Show time */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showTime}
                  onChange={() => toggle("showTime")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show time</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Nov 15 – 22, 2025</span>
              </div>
            </label>

            {/* Show companions */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showCompanions}
                  onChange={() => toggle("showCompanions")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show companions</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Yuki, Mei</span>
              </div>
            </label>
          </div>
        </section>

        {/* ── Local Library section ── */}
        {isTauri() ? (
          <section className="mt-8 rounded-panel border border-border bg-white px-6 py-6">
            <h2 className="mb-1 text-[17px] font-semibold text-foreground">
              Local Library
            </h2>
            <p className="mb-5 text-[14px] text-muted leading-relaxed">
              Footprint stores your journeys and photos in a folder you control.
              You can keep it on your computer, an external drive, or a synced folder you trust.
            </p>

            {libPath ? (
              <div className="space-y-4">
                {/* Current Library info */}
                <div className="rounded-card bg-surface px-4 py-3">
                  <p className="text-[13px] font-medium text-foreground">
                    {getLibraryDisplayName(libPath)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-muted/60 break-all">{libPath}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleOpenLibraryFolder}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-surface"
                  >
                    Open Library Folder
                  </button>
                  <button
                    onClick={handleChangeLibrary}
                    disabled={libraryLoading}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                  >
                    Change Library
                  </button>
                  <button
                    onClick={handleCreateLibrary}
                    disabled={libraryLoading}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                  >
                    Create New Library
                  </button>
                </div>

                {/* Secondary actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleImportBrowserData}
                    disabled={libraryLoading}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground hover:bg-surface disabled:opacity-50"
                  >
                    Import browser data
                  </button>
                  <button
                    onClick={handleRebuildThumbnails}
                    disabled={libraryLoading}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-muted transition hover:text-foreground hover:bg-surface disabled:opacity-50"
                  >
                    Rebuild Thumbnails
                  </button>
                </div>

                {thumbnailMessage && (
                  <p className="text-[13px] text-muted">{thumbnailMessage}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[14px] text-muted">No Library selected.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCreateLibrary}
                    disabled={libraryLoading}
                    className="rounded-button bg-foreground px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-foreground/85 disabled:opacity-50"
                  >
                    Create New Library
                  </button>
                  <button
                    onClick={handleChangeLibrary}
                    disabled={libraryLoading}
                    className="rounded-button border border-border px-4 py-1.5 text-[13px] font-medium text-foreground transition hover:bg-surface disabled:opacity-50"
                  >
                    Open Existing Library
                  </button>
                </div>
              </div>
            )}

            {/* Recent Libraries */}
            {recentLibraries.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-[13px] font-medium text-muted mb-2">
                  Recent Libraries
                </p>
                <div className="space-y-1">
                  {recentLibraries.map((recentPath) => (
                    <div
                      key={recentPath}
                      className="flex items-center justify-between rounded-md px-3 py-1.5 hover:bg-surface group"
                    >
                      <button
                        onClick={() => handleSwitchToRecent(recentPath)}
                        disabled={libraryLoading}
                        className="text-left text-[13px] text-foreground truncate flex-1 disabled:opacity-50"
                      >
                        {getLibraryDisplayName(recentPath)}
                        <span className="ml-2 text-[11px] text-muted/50">{recentPath}</span>
                      </button>
                      <button
                        onClick={async () => {
                          await removeRecentLibrary(recentPath);
                          await reloadRecent();
                        }}
                        className="ml-2 shrink-0 text-[11px] text-muted/40 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        title="Remove from recent list"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {libraryMessage && (
              <p className="mt-4 text-[13px] text-muted">{libraryMessage}</p>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-panel border border-border bg-white px-6 py-6">
            <h2 className="mb-1 text-[17px] font-semibold text-foreground">
              Local Library
            </h2>
            <p className="text-[14px] text-muted leading-relaxed">
              Local Library management is available in the desktop app.
            </p>
          </section>
        )}

        {/* Saved indicator */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-button border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Back to Home
          </button>
          {saved && (
            <span className="text-[14px] text-accent transition-opacity">
              Saved
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
