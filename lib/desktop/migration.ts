/**
 * Migration: import existing browser-local data (localStorage + IndexedDB)
 * into a user-selected Footprint Library folder.
 *
 * Rules:
 *   - Never delete original browser data
 *   - Skip duplicate IDs (idempotent migration)
 *   - Preserve all metadata (cover, highlight, notes, categories, location, trash state)
 *   - Copy photo blobs to Library/photos/<journeyId>/<photoId>.<ext>
 *   - Store relative paths in SQLite
 */
import type { Journey, JourneyPhoto } from "../types";
import type { MigrationReport } from "../data/types";
import { getJourneys } from "../storage";
import { getPhotoBlob } from "../image-storage";
import { desktopJourneyRepo } from "../data/desktopLibraryRepository";
import { copy_photo_to_library } from "./tauri-bridge";
import { generateId } from "../utils";
import { getLibraryPath } from "./sqlite";

/** Check if browser data exists and return counts. */
export async function checkBrowserData(): Promise<{
  journeyCount: number;
  photoCount: number;
}> {
  try {
    const journeys = await getJourneys();
    const photoCount = journeys.reduce((sum, j) => sum + j.photos.length, 0);
    return { journeyCount: journeys.length, photoCount };
  } catch {
    return { journeyCount: 0, photoCount: 0 };
  }
}

/** Migrate all browser localStorage + IndexedDB data into the Library. */
export async function migrateBrowserToLibrary(
  libraryPath: string
): Promise<MigrationReport> {
  const report: MigrationReport = {
    journeysImported: 0,
    photosImported: 0,
    duplicatesSkipped: 0,
    errors: [],
  };

  try {
    const browserJourneys = await getJourneys();
    if (browserJourneys.length === 0) {
      return report;
    }

    // Load existing desktop journeys to detect duplicates
    const existingJourneys = await desktopJourneyRepo.getJourneys();
    const existingIds = new Set(existingJourneys.map((j) => j.id));
    const existingPhotoIds = new Set(
      existingJourneys.flatMap((j) => j.photos.map((p) => p.id))
    );

    for (const journey of browserJourneys) {
      try {
        // Skip if already imported
        if (existingIds.has(journey.id)) {
          report.duplicatesSkipped++;
          continue;
        }

        // Process photos: copy blobs to Library
        const migratedPhotos: JourneyPhoto[] = [];

        for (const photo of journey.photos) {
          try {
            if (existingPhotoIds.has(photo.id)) {
              report.duplicatesSkipped++;
              // Still add the photo reference if it belongs to this journey
              // (can't happen in practice since journey ID is already checked)
              continue;
            }

            // Try to get the blob from IndexedDB
            const storageKey = photo.storageKey ?? photo.id;
            const blob = await getPhotoBlob(storageKey);

            if (blob) {
              // Write blob to a temp file, then copy to Library
              const tempPath = await writeBlobToTemp(blob, photo.fileName ?? photo.id);
              try {
                const photoId = photo.id || generateId();
                const relativePath = await copy_photo_to_library(
                  tempPath,
                  libraryPath,
                  journey.id,
                  photoId
                );

                migratedPhotos.push({
                  ...photo,
                  id: photoId,
                  url: relativePath, // will be resolved to absolute at display time
                  storageKey: undefined, // no longer needed
                });

                report.photosImported++;
              } finally {
                await deleteTempFile(tempPath).catch(() => {});
              }
            } else {
              // No blob available — create a placeholder with empty URL
              migratedPhotos.push({
                ...photo,
                url: "",
                storageKey: undefined,
              });
              report.errors.push(
                `Photo blob not found: ${photo.fileName ?? photo.id} (${journey.title ?? journey.id})`
              );
            }
          } catch (err) {
            report.errors.push(
              `Failed to migrate photo ${photo.fileName ?? photo.id}: ${err}`
            );
          }
        }

        // Create the journey with migrated data
        const migratedJourney: Journey = {
          ...journey,
          photos: migratedPhotos,
          // Preserve all existing fields
        };

        await desktopJourneyRepo.saveJourney(migratedJourney);
        report.journeysImported++;
      } catch (err) {
        report.errors.push(
          `Failed to migrate journey "${journey.title ?? journey.id}": ${err}`
        );
      }
    }
  } catch (err) {
    report.errors.push(`Migration failed: ${err}`);
  }

  return report;
}

// ── Temp file helpers ───────────────────────────────────────────────

async function writeBlobToTemp(blob: Blob, filename: string): Promise<string> {
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const { appDataDir, join } = await import("@tauri-apps/api/path");

  const dir = await appDataDir();
  const tempPath = await join(dir, `footprint-migrate-${Date.now()}-${filename}`);
  const buffer = await blob.arrayBuffer();
  await writeFile(tempPath, new Uint8Array(buffer));
  return tempPath;
}

async function deleteTempFile(path: string): Promise<void> {
  const { remove } = await import("@tauri-apps/plugin-fs");
  await remove(path).catch(() => {});
}
