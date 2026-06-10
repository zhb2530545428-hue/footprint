/**
 * Typed wrappers around Tauri invoke commands.
 *
 * These call the Rust commands defined in src-tauri/src/lib.rs.
 * In browser mode (non-Tauri), these should never be called —
 * the repository factory will route to browser implementations instead.
 */
import { invoke } from "@tauri-apps/api/core";

// ── Library ─────────────────────────────────────────────────────────

/** Create a new Library folder structure at the given path. */
export async function create_library(basePath: string): Promise<string> {
  return invoke<string>("create_library", { basePath });
}

/** Check if a path contains a valid Footprint Library. */
export async function check_library(path: string): Promise<boolean> {
  return invoke<boolean>("check_library", { path });
}

/** Allow filesystem and asset access to the selected Library path. */
export async function allow_library_path(libraryPath: string): Promise<void> {
  return invoke<void>("allow_library_path", { libraryPath });
}

// ── Photo File Operations ───────────────────────────────────────────

/** Copy a photo file into the Library and return its relative path. */
export async function copy_photo_to_library(
  source: string,
  libraryPath: string,
  journeyId: string,
  photoId: string
): Promise<string> {
  return invoke<string>("copy_photo_to_library", {
    source,
    libraryPath,
    journeyId,
    photoId,
  });
}

/** Delete a photo file from the Library. */
export async function delete_photo_from_library(
  libraryPath: string,
  relativePath: string
): Promise<void> {
  return invoke<void>("delete_photo_from_library", { libraryPath, relativePath });
}

/** Delete an entire journey's photo directory. */
export async function delete_journey_photos_dir(
  libraryPath: string,
  journeyId: string
): Promise<void> {
  return invoke<void>("delete_journey_photos_dir", { libraryPath, journeyId });
}

/** Resolve a Library-relative path to an absolute path. */
export async function resolve_library_path(
  libraryPath: string,
  relativePath: string
): Promise<string> {
  return invoke<string>("resolve_library_path", { libraryPath, relativePath });
}
