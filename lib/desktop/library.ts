/**
 * Library folder management for desktop mode.
 *
 * A Footprint Library is a user-selected folder containing:
 *   footprint.db  — SQLite database
 *   photos/       — photo files organized by journey
 *   thumbnails/   — generated thumbnails (v2.1+)
 *
 * The Library path is stored in Tauri's persistent store so it
 * survives app restarts.
 */
import { isTauri } from "../environment";
import { check_library, open_in_explorer } from "./tauri-bridge";

const STORE_KEY_LIBRARY_PATH = "library_path";
const STORE_KEY_RECENT_LIBRARIES = "recent_libraries";
const STORE_FILE = "footprint-store.json";

const MAX_RECENT_LIBRARIES = 5;

let _cachedLibraryPath: string | null = null;

// ── Store helpers (lazy-loaded) ─────────────────────────────────────

async function getStore() {
  const { load } = await import("@tauri-apps/plugin-store");
  return await load(STORE_FILE);
}

// ── Public API: Library Path ────────────────────────────────────────

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
    const result = await check_library(path);
    return result.valid;
  } catch {
    return false;
  }
}

// ── Public API: Open Library Folder ─────────────────────────────────

/** Open the current Library folder in the OS file explorer. */
export async function openLibraryFolder(): Promise<void> {
  if (!isTauri()) return;

  const path = await getLibraryPath();
  if (!path) return;

  try {
    await open_in_explorer(path);
  } catch {
    // Non-critical
  }
}

// ── Public API: Recent Libraries ────────────────────────────────────

/** Get the list of recent Library paths (max 5, newest first). */
export async function getRecentLibraries(): Promise<string[]> {
  if (!isTauri()) return [];

  try {
    const store = await getStore();
    const raw = await store.get<string>(STORE_KEY_RECENT_LIBRARIES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Add a Library path to the recent list. Moves to front if already present. */
export async function addRecentLibrary(path: string): Promise<void> {
  if (!isTauri()) return;

  try {
    const store = await getStore();
    const recent = await getRecentLibraries();

    // Remove if already present, then prepend
    const filtered = recent.filter((p) => p !== path);
    filtered.unshift(path);

    // Keep max 5
    const trimmed = filtered.slice(0, MAX_RECENT_LIBRARIES);

    await store.set(STORE_KEY_RECENT_LIBRARIES, JSON.stringify(trimmed));
    await store.save();
  } catch {
    // Non-critical
  }
}

/** Remove a path from the recent Libraries list. */
export async function removeRecentLibrary(path: string): Promise<void> {
  if (!isTauri()) return;

  try {
    const store = await getStore();
    const recent = await getRecentLibraries();
    const filtered = recent.filter((p) => p !== path);
    await store.set(STORE_KEY_RECENT_LIBRARIES, JSON.stringify(filtered));
    await store.save();
  } catch {
    // Non-critical
  }
}

/** Get the directory name for display purposes. */
export function getLibraryDisplayName(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}
