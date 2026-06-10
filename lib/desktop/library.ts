/**
 * Library folder management for desktop mode.
 *
 * A Footprint Library is a user-selected folder containing:
 *   footprint.db  — SQLite database
 *   photos/       — photo files organized by journey
 *
 * The Library path is stored in Tauri's persistent store so it
 * survives app restarts.
 */
import { isTauri } from "../environment";
import { check_library } from "./tauri-bridge";

const STORE_KEY_LIBRARY_PATH = "library_path";
const STORE_FILE = "footprint-store.json";

let _cachedLibraryPath: string | null = null;

// ── Store helpers (lazy-loaded) ─────────────────────────────────────

async function getStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return await load(STORE_FILE);
}

// ── Public API ──────────────────────────────────────────────────────

/** Get the currently active Library path (from cache or Tauri store). */
export async function getLibraryPath(): Promise<string | null> {
  if (_cachedLibraryPath) return _cachedLibraryPath;
  if (!isTauri()) return null;

  try {
    const store = await getStore();
    const path = await store.get<string>(STORE_KEY_LIBRARY_PATH);
    if (path) _cachedLibraryPath = path;
    return path ?? null;
  } catch {
    return null;
  }
}

/** Save the Library path to persistent storage. */
export async function setLibraryPath(path: string): Promise<void> {
  _cachedLibraryPath = path;
  if (!isTauri()) return;

  try {
    const store = await getStore();
    await store.set(STORE_KEY_LIBRARY_PATH, path);
    await store.save();
  } catch {
    // Non-critical — path won't persist across restarts but still works this session
  }
}

/** Clear the stored Library path (e.g., when switching Libraries). */
export async function clearLibraryPath(): Promise<void> {
  _cachedLibraryPath = null;
  if (!isTauri()) return;

  try {
    const store = await getStore();
    await store.delete(STORE_KEY_LIBRARY_PATH);
    await store.save();
  } catch {
    // Non-critical
  }
}

/** Check if a path contains a valid Footprint Library. */
export async function isLibraryValid(path: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    return await check_library(path);
  } catch {
    return false;
  }
}

/** Get the directory name for display purposes. */
export function getLibraryDisplayName(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}
