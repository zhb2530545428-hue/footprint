/**
 * Desktop-only background thumbnail generation queue.
 *
 * After original photos have been copied into the Library and the Journey
 * has been saved to SQLite, call `queueThumbnailGeneration()` to generate
 * thumbnails in the background without blocking the Archive/Save flow.
 *
 * Design:
 * - Single-worker queue (concurrency = 1) to avoid I/O thrashing.
 * - Deduplicates by photo ID — a photo already in the queue or running
 *   will not be enqueued again.
 * - Each task generates the thumbnail, then updates the matching SQLite
 *   row with `thumbnail_relative_path`.
 * - Errors are caught per-photo and logged quietly; they never propagate
 *   to the caller.
 * - Safe no-op when called outside Tauri desktop.
 */

import { isTauri } from "../environment";
import { getDb, getLibraryPath as getDbLibraryPath } from "../desktop/sqlite";
import { generate_thumbnail } from "../desktop/tauri-bridge";
import type { JourneyPhoto } from "../types";

// ── State ───────────────────────────────────────────────────────────

const queued = new Set<string>();
const running = new Set<string>();
let drainScheduled = false;

// ── Public API ──────────────────────────────────────────────────────

/**
 * Schedule background thumbnail generation for the given photos.
 *
 * Safe to call multiple times — duplicate photo IDs are ignored.
 * Safe to call outside Tauri desktop — silently no-ops.
 */
export function queueThumbnailGeneration(
  journeyId: string,
  photos: JourneyPhoto[]
): void {
  if (!isTauri()) return;
  if (!photos || photos.length === 0) return;

  for (const photo of photos) {
    // Skip photos already having a thumbnail
    const dp = photo as JourneyPhoto & { _thumbnailRelativePath?: string };
    if (dp._thumbnailRelativePath) continue;

    // Skip photos missing a relative path (shouldn't happen, but guard)
    const rp = photo as JourneyPhoto & { _relativePath?: string };
    if (!rp._relativePath) continue;

    // Skip already queued / running
    if (queued.has(photo.id) || running.has(photo.id)) continue;

    queued.add(photo.id);
  }

  if (queued.size > 0 && !drainScheduled) {
    drainScheduled = true;
    // Defer drain so the caller's synchronous work completes first
    setTimeout(() => {
      drainScheduled = false;
      void drainQueue(journeyId);
    }, 0);
  }
}

// ── Internal ────────────────────────────────────────────────────────

async function drainQueue(journeyId: string): Promise<void> {
  // Pick one photo at a time (concurrency = 1).
  // Yield via requestAnimationFrame so the browser renders a full frame
  // before the next thumbnail starts. Deliberately slow — responsiveness > speed.
  while (queued.size > 0) {
    const photoId = queued.values().next().value as string;
    queued.delete(photoId);
    running.add(photoId);

    try {
      await generateOneThumbnail(journeyId, photoId);
    } catch {
      // Swallow — individual thumbnail errors must not affect other photos
    } finally {
      running.delete(photoId);
    }

    // Wait for the browser to paint before processing the next thumbnail
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

async function generateOneThumbnail(
  journeyId: string,
  photoId: string
): Promise<void> {
  const db = getDb();
  const libPath = getDbLibraryPath();
  if (!db || !libPath) return;

  // Look up the photo row to get its relative_path
  const rows: any[] = await db.select(
    "SELECT relative_path FROM photos WHERE id = ? AND journey_id = ?",
    [photoId, journeyId]
  );
  if (rows.length === 0) return;

  const relativePath: string = rows[0].relative_path;
  if (!relativePath) return;

  const sourceAbs = `${libPath}/${relativePath}`;
  const thumbRelPath = `thumbnails/${journeyId}/${photoId}.jpg`;
  const destAbs = `${libPath}/${thumbRelPath}`;

  // Generate the thumbnail via Rust
  await generate_thumbnail(sourceAbs, destAbs);

  // Update SQLite with the thumbnail path
  await db.execute(
    "UPDATE photos SET thumbnail_relative_path = ?, updated_at = ? WHERE id = ? AND journey_id = ?",
    [thumbRelPath, new Date().toISOString(), photoId, journeyId]
  );
}
