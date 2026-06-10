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
    files: { id: string; file: File }[]
  ): Promise<JourneyPhoto[]> {
    // Store blobs in IndexedDB
    await Promise.all(files.map(({ id, file }) => savePhotoBlob(id, file)));

    return files.map(({ id, file }) => ({
      id,
      storageKey: id,
      url: URL.createObjectURL(file),
      fileName: file.name,
      isCover: false,
      isHighlight: false,
      categoryId: "default-other",
      hasNote: false,
      createdAt: new Date().toISOString(),
    }));
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
