/**
 * Desktop Library repository implementation.
 *
 * Journeys, photos, categories, and settings are stored in SQLite
 * inside the user-selected Library folder. Photo files are copied
 * into <Library>/photos/<journeyId>/ and referenced by relative paths.
 */
import type { Journey, JourneyPhoto, PhotoCategory } from "../types";
import type { FootprintSettings } from "../settings";
import type {
  JourneyRepository,
  PhotoRepository,
  SettingsRepository,
} from "./types";
import { getDb, getLibraryPath as getDbLibraryPath } from "../desktop/sqlite";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  copy_photo_to_library,
  delete_photo_from_library,
  delete_journey_photos_dir,
} from "../desktop/tauri-bridge";

type DesktopJourneyPhoto = JourneyPhoto & { _relativePath?: string };

// ══════════════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════════════

function requireDb() {
  const db = getDb();
  if (!db) throw new Error("Database not initialized");
  return db;
}

function requireLibraryPath() {
  const path = getDbLibraryPath();
  if (!path) throw new Error("Library path not set");
  return path;
}

/** Serialize a string array to JSON for SQLite storage. */
function pack(arr: string[]): string {
  return JSON.stringify(arr);
}

/** Deserialize a JSON string back to string array. */
function unpack(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Parse an integer boolean (0/1) from SQLite. */
function toBool(val: number | null | undefined): boolean {
  return val === 1;
}

/** Convert boolean to 0/1 for SQLite. */
function fromBool(val: boolean | undefined | null): number {
  return val ? 1 : 0;
}

function getRelativePhotoPath(journeyId: string, photo: JourneyPhoto): string {
  const explicitPath = (photo as DesktopJourneyPhoto)._relativePath;
  if (explicitPath) return explicitPath;
  const ext = (photo.fileName ?? "photo.jpg").split(".").pop() ?? "jpg";
  return `photos/${journeyId}/${photo.id}.${ext}`;
}

/** Map a SQLite journey row to a Journey object. */
function rowToJourney(row: any): Journey {
  return {
    id: row.id,
    title: row.title ?? undefined,
    location: row.location ?? "",
    locationCountry: (row.location_country as Journey["locationCountry"]) ?? undefined,
    locationProvince: row.location_province ?? undefined,
    locationCities: row.location_cities ? unpack(row.location_cities) : undefined,
    locationCity: row.location_city ?? undefined,
    locationAddress: row.location_address ?? undefined,
    startDate: row.start_date ?? undefined,
    endDate: row.end_date ?? undefined,
    companions: unpack(row.companions),
    notes: row.notes ?? undefined,
    status: row.status as Journey["status"],
    coverPhotoId: row.cover_photo_id ?? undefined,
    photos: [], // populated separately
    categories: [], // populated separately
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Map a SQLite photo row to a JourneyPhoto object. */
function rowToPhoto(row: any, libraryPath: string): JourneyPhoto {
  const absolutePath = `${libraryPath}/${row.relative_path}`;
  return {
    id: row.id,
    url: convertFileSrc(absolutePath),
    fileName: row.file_name ?? row.original_file_name ?? undefined,
    isCover: toBool(row.is_cover),
    isHighlight: toBool(row.is_highlight),
    categoryId: row.category_id ?? undefined,
    note: row.note ?? undefined,
    hasNote: toBool(row.has_note),
    createdAt: row.created_at,
    _relativePath: row.relative_path,
  } as DesktopJourneyPhoto;
}

/** Map a SQLite category row to a PhotoCategory object. */
function rowToCategory(row: any): PhotoCategory {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ══════════════════════════════════════════════════════════════════════
// Journey Repository — Desktop
// ══════════════════════════════════════════════════════════════════════

export const desktopJourneyRepo: JourneyRepository = {
  async getJourneys(): Promise<Journey[]> {
    const db = requireDb();
    const libPath = requireLibraryPath();

    const rows: any[] = await db.select("SELECT * FROM journeys ORDER BY created_at DESC", []);

    const journeys: Journey[] = [];
    for (const row of rows) {
      const journey = rowToJourney(row);

      // Load photos
      const photoRows: any[] = await db.select(
        "SELECT * FROM photos WHERE journey_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
        [journey.id]
      );
      journey.photos = photoRows.map((pr) => rowToPhoto(pr, libPath));

      // Load categories
      const catRows: any[] = await db.select(
        "SELECT * FROM photo_categories WHERE journey_id = ? ORDER BY created_at ASC",
        [journey.id]
      );
      journey.categories = catRows.map(rowToCategory);

      journeys.push(journey);
    }

    return journeys;
  },

  async getJourney(id: string): Promise<Journey | undefined> {
    const db = requireDb();
    const libPath = requireLibraryPath();

    const rows: any[] = await db.select("SELECT * FROM journeys WHERE id = ?", [id]);
    if (rows.length === 0) return undefined;

    const journey = rowToJourney(rows[0]);

    const photoRows: any[] = await db.select(
      "SELECT * FROM photos WHERE journey_id = ? AND deleted_at IS NULL ORDER BY created_at ASC",
      [id]
    );
    journey.photos = photoRows.map((pr) => rowToPhoto(pr, libPath));

    const catRows: any[] = await db.select(
      "SELECT * FROM photo_categories WHERE journey_id = ? ORDER BY created_at ASC",
      [id]
    );
    journey.categories = catRows.map(rowToCategory);

    return journey;
  },

  async saveJourney(journey: Journey): Promise<void> {
    const db = requireDb();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO journeys (
        id, title, location, location_country, location_province,
        location_cities, location_city, location_address,
        start_date, end_date, companions, notes, status,
        cover_photo_id, created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        journey.id,
        journey.title ?? null,
        journey.location ?? "",
        journey.locationCountry ?? null,
        journey.locationProvince ?? null,
        journey.locationCities ? pack(journey.locationCities) : null,
        journey.locationCity ?? null,
        journey.locationAddress ?? null,
        journey.startDate ?? null,
        journey.endDate ?? null,
        pack(journey.companions),
        journey.notes ?? null,
        journey.status,
        journey.coverPhotoId ?? null,
        journey.createdAt || now,
        journey.updatedAt || now,
        journey.status === "trashed" ? now : null,
      ]
    );

    // Save categories before photos so category foreign keys are valid.
    for (const cat of journey.categories) {
      await db.execute(
        `INSERT INTO photo_categories (
          id, journey_id, name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(journey_id, id) DO UPDATE SET
          name = excluded.name,
          updated_at = excluded.updated_at`,
        [cat.id, journey.id, cat.name, cat.createdAt || now, cat.updatedAt || now]
      );
    }

    // Save photos
    for (const photo of journey.photos) {
      // Compute the Library-relative path: photos/<journeyId>/<photoId>.<ext>
      const relPath = getRelativePhotoPath(journey.id, photo);

      await db.execute(
        `INSERT OR REPLACE INTO photos (
          id, journey_id, file_name, original_file_name, relative_path,
          thumbnail_relative_path, mime_type, width, height,
          category_id, is_cover, is_highlight, note, has_note,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          photo.id,
          journey.id,
          photo.fileName ?? null,
          photo.fileName ?? null,
          relPath,
          null, // thumbnail_relative_path (v2.1+)
          null, // mime_type
          null, // width
          null, // height
          photo.categoryId ?? "default-other",
          fromBool(photo.isCover),
          fromBool(photo.isHighlight),
          photo.note ?? null,
          fromBool(photo.hasNote),
          photo.createdAt || now,
          now,
          null,
        ]
      );
    }

  },

  async updateJourney(journey: Journey): Promise<void> {
    const db = requireDb();
    const libPath = requireLibraryPath();
    const now = new Date().toISOString();

    await db.execute(
      `UPDATE journeys SET
        title = ?, location = ?, location_country = ?, location_province = ?,
        location_cities = ?, location_city = ?, location_address = ?,
        start_date = ?, end_date = ?, companions = ?, notes = ?,
        status = ?, cover_photo_id = ?, updated_at = ?, deleted_at = ?
      WHERE id = ?`,
      [
        journey.title ?? null,
        journey.location ?? "",
        journey.locationCountry ?? null,
        journey.locationProvince ?? null,
        journey.locationCities ? pack(journey.locationCities) : null,
        journey.locationCity ?? null,
        journey.locationAddress ?? null,
        journey.startDate ?? null,
        journey.endDate ?? null,
        pack(journey.companions),
        journey.notes ?? null,
        journey.status,
        journey.coverPhotoId ?? null,
        now,
        journey.status === "trashed" ? now : null,
        journey.id,
      ]
    );

    // Upsert categories before photos so category foreign keys are valid.
    const existingCategories: any[] = await db.select(
      "SELECT id FROM photo_categories WHERE journey_id = ?",
      [journey.id]
    );
    const updatedCategoryIds = new Set(journey.categories.map((cat) => cat.id));
    for (const cat of journey.categories) {
      await db.execute(
        `INSERT INTO photo_categories (
          id, journey_id, name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(journey_id, id) DO UPDATE SET
          name = excluded.name,
          updated_at = excluded.updated_at`,
        [cat.id, journey.id, cat.name, cat.createdAt || now, cat.updatedAt || now]
      );
    }

    // Update photos and remove files that no longer belong to the journey.
    const existingPhotos: any[] = await db.select(
      "SELECT id, relative_path FROM photos WHERE journey_id = ?",
      [journey.id]
    );

    // Remove photos not in the updated journey
    const updatedIds = new Set(journey.photos.map((p) => p.id));
    for (const existingPhoto of existingPhotos) {
      if (!updatedIds.has(existingPhoto.id)) {
        if (existingPhoto.relative_path) {
          await delete_photo_from_library(libPath, existingPhoto.relative_path).catch(() => {});
        }
        await db.execute("DELETE FROM photos WHERE id = ?", [existingPhoto.id]);
      }
    }

    // Upsert each photo (metadata only — file operations are separate)
    for (const photo of journey.photos) {
      const relPath = getRelativePhotoPath(journey.id, photo);

      await db.execute(
        `INSERT OR REPLACE INTO photos (
          id, journey_id, file_name, original_file_name, relative_path,
          thumbnail_relative_path, mime_type, width, height,
          category_id, is_cover, is_highlight, note, has_note,
          created_at, updated_at, deleted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          photo.id,
          journey.id,
          photo.fileName ?? null,
          photo.fileName ?? null,
          relPath ?? "",
          null,
          null,
          null,
          null,
          photo.categoryId ?? "default-other",
          fromBool(photo.isCover),
          fromBool(photo.isHighlight),
          photo.note ?? null,
          fromBool(photo.hasNote),
          photo.createdAt || now,
          now,
          null,
        ]
      );
    }

    // Remove categories only after photos have been reassigned.
    for (const existingCategory of existingCategories) {
      if (!updatedCategoryIds.has(existingCategory.id)) {
        await db.execute(
          "DELETE FROM photo_categories WHERE journey_id = ? AND id = ?",
          [journey.id, existingCategory.id]
        );
      }
    }
  },

  async moveJourneyToTrash(id: string): Promise<void> {
    const db = requireDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE journeys SET status = 'trashed', deleted_at = ?, updated_at = ? WHERE id = ?",
      [now, now, id]
    );
  },

  async restoreJourney(id: string): Promise<void> {
    const db = requireDb();
    const now = new Date().toISOString();
    await db.execute(
      "UPDATE journeys SET status = 'archived', deleted_at = NULL, updated_at = ? WHERE id = ?",
      [now, id]
    );
  },

  async permanentlyDeleteJourney(id: string): Promise<void> {
    const db = requireDb();
    const libPath = requireLibraryPath();

    // Delete photo files
    await delete_journey_photos_dir(libPath, id).catch(() => {
      // Files may not exist — that's ok
    });

    // Delete from DB (cascade handles photos and categories)
    await db.execute("DELETE FROM photos WHERE journey_id = ?", [id]);
    await db.execute("DELETE FROM photo_categories WHERE journey_id = ?", [id]);
    await db.execute("DELETE FROM journeys WHERE id = ?", [id]);
  },

  async getTrashedJourneys(): Promise<Journey[]> {
    const all = await this.getJourneys();
    return all.filter((j) => j.status === "trashed");
  },

  async setJourneys(journeys: Journey[]): Promise<void> {
    for (const journey of journeys) {
      await this.saveJourney(journey);
    }
  },

  revokeObjectUrls(_journeys: Journey[]): void {
    // Desktop mode doesn't use object URLs — photos load via convertFileSrc
  },

  cleanup(): void {
    // Desktop mode cleanup is handled by closing the DB connection
  },
};

// ══════════════════════════════════════════════════════════════════════
// Photo Repository — Desktop
// ══════════════════════════════════════════════════════════════════════

export const desktopPhotoRepo: PhotoRepository = {
  async savePhotos(
    journeyId: string,
    files: { id: string; file: File }[]
  ): Promise<JourneyPhoto[]> {
    const libPath = requireLibraryPath();
    const results: JourneyPhoto[] = [];

    for (const { id, file } of files) {
      // We need to write the file to a temp location first since the
      // Rust command needs a file path, not a File object.
      // Create a temp file from the File object.
      const tempPath = await writeTempFile(file);

      try {
        const relativePath = await copy_photo_to_library(
          tempPath,
          libPath,
          journeyId,
          id
        );

        const absolutePath = `${libPath}/${relativePath}`;
        results.push({
          id,
          url: convertFileSrc(absolutePath),
          fileName: file.name,
          isCover: false,
          isHighlight: false,
          categoryId: "default-other",
          hasNote: false,
          createdAt: new Date().toISOString(),
          _relativePath: relativePath,
        } as DesktopJourneyPhoto);
      } finally {
        // Clean up temp file
        await deleteTempFile(tempPath).catch(() => {});
      }
    }

    return results;
  },

  async deletePhotos(photoIds: string[], _journeyId: string): Promise<void> {
    const libPath = requireLibraryPath();
    const db = requireDb();

    for (const photoId of photoIds) {
      const rows: any[] = await db.select(
        "SELECT relative_path FROM photos WHERE id = ?",
        [photoId]
      );
      if (rows.length > 0 && rows[0].relative_path) {
        await delete_photo_from_library(libPath, rows[0].relative_path).catch(() => {});
      }
      await db.execute("DELETE FROM photos WHERE id = ?", [photoId]);
    }
  },

  async deleteAllPhotosForJourney(journeyId: string): Promise<void> {
    const libPath = requireLibraryPath();
    await delete_journey_photos_dir(libPath, journeyId).catch(() => {});
  },

  revokeObjectUrls(_photos: JourneyPhoto[]): void {
    // Desktop doesn't use object URLs
  },
};

// ══════════════════════════════════════════════════════════════════════
// Settings Repository — Desktop
// ══════════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS: FootprintSettings = {
  homepageCard: {
    showLocation: true,
    showTime: true,
    showCompanions: true,
  },
};

let cachedDesktopSettings: FootprintSettings = DEFAULT_SETTINGS;

function copySettings(settings: FootprintSettings): FootprintSettings {
  return {
    homepageCard: { ...settings.homepageCard },
  };
}

export const desktopSettingsRepo: SettingsRepository = {
  getSettings(): FootprintSettings {
    return copySettings(cachedDesktopSettings);
  },

  saveSettings(settings: FootprintSettings): void {
    cachedDesktopSettings = copySettings(settings);
    void saveSettingsAsync(settings);
  },
};

async function saveSettingsAsync(settings: FootprintSettings): Promise<void> {
  try {
    const db = getDb();
    if (!db) return;
    const now = new Date().toISOString();
    await db.execute(
      "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)",
      ["homepage_settings", JSON.stringify(settings), now]
    );
  } catch {
    // Non-critical
  }
}

/** Load settings from SQLite (call during app initialization). */
export async function loadDesktopSettings(): Promise<FootprintSettings> {
  let loaded = copySettings(DEFAULT_SETTINGS);
  try {
    const db = getDb();
    if (!db) {
      cachedDesktopSettings = loaded;
      return copySettings(loaded);
    }
    const rows: any[] = await db.select(
      "SELECT value FROM settings WHERE key = ?",
      ["homepage_settings"]
    );
    if (rows.length > 0) {
      const parsed = JSON.parse(rows[0].value);
      loaded = {
        homepageCard: {
          showLocation: parsed?.homepageCard?.showLocation ?? true,
          showTime: parsed?.homepageCard?.showTime ?? true,
          showCompanions: parsed?.homepageCard?.showCompanions ?? true,
        },
      };
    }
  } catch {
    loaded = copySettings(DEFAULT_SETTINGS);
  }
  cachedDesktopSettings = loaded;
  return copySettings(loaded);
}

// ══════════════════════════════════════════════════════════════════════
// Temp file helpers (for photo import)
// ══════════════════════════════════════════════════════════════════════

async function writeTempFile(file: File): Promise<string> {
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const { appDataDir, join } = await import("@tauri-apps/api/path");

  const dir = await appDataDir();
  const tempPath = await join(dir, `footprint-temp-${Date.now()}-${file.name}`);
  const buffer = await file.arrayBuffer();
  await writeFile(tempPath, new Uint8Array(buffer));
  return tempPath;
}

async function deleteTempFile(path: string): Promise<void> {
  const { remove } = await import("@tauri-apps/plugin-fs");
  await remove(path).catch(() => {});
}
