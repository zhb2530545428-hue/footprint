/**
 * Repository interfaces for Footprint data access.
 *
 * Two implementations exist:
 *   LocalBrowserRepository  — localStorage + IndexedDB (existing browser mode)
 *   DesktopLibraryRepository — SQLite + local filesystem (desktop mode)
 */
import type { Journey, JourneyPhoto, PhotoCategory } from "../types";
import type { FootprintSettings } from "../settings";

// ── Journey Repository ──────────────────────────────────────────────

export interface JourneyRepository {
  /** Get all journeys */
  getJourneys(): Promise<Journey[]>;

  /** Get a single journey by ID */
  getJourney(id: string): Promise<Journey | undefined>;

  /** Save a new journey */
  saveJourney(journey: Journey): Promise<void>;

  /** Update an existing journey */
  updateJourney(journey: Journey): Promise<void>;

  /** Move a journey to trash (soft delete) */
  moveJourneyToTrash(id: string): Promise<void>;

  /** Restore a trashed journey back to archived */
  restoreJourney(id: string): Promise<void>;

  /** Permanently delete a journey and its photos */
  permanentlyDeleteJourney(id: string): Promise<void>;

  /** Get all trashed journeys */
  getTrashedJourneys(): Promise<Journey[]>;

  /** Replace all journeys (for seeding / migration) */
  setJourneys(journeys: Journey[]): Promise<void>;

  /** Revoke object URLs for photos */
  revokeObjectUrls(journeys: Journey[]): void;

  /** Clean up photo resources */
  cleanup(): void;
}

// ── Photo Repository ────────────────────────────────────────────────

export interface SavedPhoto {
  photo: JourneyPhoto;
  /** Absolute path to the saved file (desktop) or blob URL (browser) */
  filePath: string;
}

export interface PhotoRepository {
  /** Save uploaded photo files for a journey. Returns hydrated JourneyPhoto objects. */
  savePhotos(
    journeyId: string,
    files: { id: string; file: File }[]
  ): Promise<JourneyPhoto[]>;

  /** Delete photo files and return the JourneyPhoto IDs that were deleted. */
  deletePhotos(photoIds: string[], journeyId: string): Promise<void>;

  /** Delete all photos for a journey (used during permanent deletion). */
  deleteAllPhotosForJourney(journeyId: string): Promise<void>;

  /** Clean up object URLs for a list of photos. */
  revokeObjectUrls(photos: JourneyPhoto[]): void;
}

// ── Settings Repository ─────────────────────────────────────────────

export interface SettingsRepository {
  getSettings(): FootprintSettings;
  saveSettings(settings: FootprintSettings): void;
}

// ── Migration ───────────────────────────────────────────────────────

export interface MigrationReport {
  journeysImported: number;
  photosImported: number;
  duplicatesSkipped: number;
  errors: string[];
}

export interface MigrationRepository {
  /** Check if browser data exists for migration. */
  checkBrowserData(): Promise<{ journeyCount: number; photoCount: number }>;

  /** Migrate browser data into the selected Library. */
  migrateToLibrary(libraryPath: string): Promise<MigrationReport>;
}
