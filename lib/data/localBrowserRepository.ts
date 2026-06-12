/**
 * Browser-local repository implementation.
 *
 * Wraps the existing localStorage + IndexedDB storage functions
 * (from lib/storage.ts and lib/image-storage.ts) behind the
 * JourneyRepository and PhotoRepository interfaces.
 *
 * This is the fallback used when NOT running in Tauri desktop mode
 * or when no Library has been selected.
 */
import type { Journey, JourneyPhoto } from "../types";
import type { FootprintSettings } from "../settings";
import type {
  JourneyRepository,
  PhotoRepository,
  SettingsRepository,
  SavePhotosOptions,
  PhotoImportProgress,
} from "./types";
import {
  getJourneys,
  getJourney,
  saveJourney,
  updateJourney,
  moveJourneyToTrash,
  restoreJourney,
  permanentlyDeleteJourney,
  getTrashedJourneys,
  setJourneys,
  revokeJourneyObjectUrls,
} from "../storage";
import { savePhotoBlob, deletePhotoBlobs } from "../image-storage";
import { getSettings, saveSettings } from "../settings";
import { generateId } from "../utils";

// ── Journey Repository ──────────────────────────────────────────────

export const browserJourneyRepo: JourneyRepository = {
  getJourneys,
  getJourney,
  saveJourney,
  updateJourney,
  moveJourneyToTrash,
  restoreJourney,
  permanentlyDeleteJourney,
  getTrashedJourneys,
  setJourneys,
  revokeObjectUrls: revokeJourneyObjectUrls,
  cleanup() {
    // Browser cleanup handled by individual page unmount effects
  },
};

// ── Photo Repository ────────────────────────────────────────────────

export const browserPhotoRepo: PhotoRepository = {
  async savePhotos(
    _journeyId: string,
    files: { id: string; file: File }[],
    options?: SavePhotosOptions
  ): Promise<JourneyPhoto[]> {
    const { onProgress } = options ?? {};
    const total = files.length;
    let completed = 0;
    let failed = 0;

    const buildProgress = (currentFile?: string): PhotoImportProgress => ({
      phase: total === 0 ? "complete" : "saving-originals",
      total,
      completedOriginals: completed,
      completedThumbnails: 0,
      failed,
      currentFileName: currentFile,
      percent: total > 0 ? Math.round(((completed + failed) / total) * 100) : 100,
      canSafelySaveJourney: completed === total,
      message:
        total === 0
          ? "Import complete"
          : `Saving originals… ${completed} / ${total}`,
    });

    onProgress?.(buildProgress());

    const results: JourneyPhoto[] = [];

    // Process one at a time — browser IndexedDB has no real parallelism benefit
    for (const { id, file } of files) {
      try {
        await savePhotoBlob(id, file);
        completed++;
        results.push({
          id,
          storageKey: id,
          url: URL.createObjectURL(file),
          fileName: file.name,
          isCover: false,
          isHighlight: false,
          categoryId: "default-other",
          hasNote: false,
          createdAt: new Date().toISOString(),
        });
      } catch {
        failed++;
      }

      onProgress?.(buildProgress(file.name));

      // Wait for the browser to paint before processing the next file
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }

    const finalProgress = buildProgress();
    finalProgress.phase = "complete";
    finalProgress.message =
      failed > 0
        ? `${completed} photos added, ${failed} failed`
        : `Import complete — ${completed} photos added`;
    onProgress?.(finalProgress);

    return results;
  },

  async deletePhotos(photoIds: string[], _journeyId: string): Promise<void> {
    await deletePhotoBlobs(photoIds);
  },

  async deleteAllPhotosForJourney(_journeyId: string): Promise<void> {
    // Individual photo cleanup is handled by the journey's storageKey tracking
  },

  revokeObjectUrls(photos: JourneyPhoto[]): void {
    photos.forEach((photo) => {
      if (photo.url.startsWith("blob:")) {
        URL.revokeObjectURL(photo.url);
      }
    });
  },
};

// ── Settings Repository ─────────────────────────────────────────────

export const browserSettingsRepo: SettingsRepository = {
  getSettings,
  saveSettings,
};
