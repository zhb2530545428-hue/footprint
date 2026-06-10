/**
 * Environment detection for Footprint.
 *
 * Determines whether we are running inside Tauri desktop,
 * whether a Library has been selected, and provides
 * the correct data source for the current environment.
 */

/** Check if the app is running inside a Tauri desktop shell. */
export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return "__TAURI_INTERNALS__" in window;
}

/** Check if we are in desktop mode with a Library selected.
 *  This is determined lazily from the Tauri store. */
let _desktopMode: boolean | null = null;

export function setDesktopMode(active: boolean): void {
  _desktopMode = active;
}

export function isDesktopMode(): boolean {
  if (_desktopMode !== null) return _desktopMode;
  return isTauri();
}

/**
 * Get the appropriate asset URL for a photo.
 * In Tauri/desktop mode, converts a local file path.
 * In browser mode, returns the URL as-is (blob or remote URL).
 */
export function getPhotoDisplayUrl(
  source: string,
  libraryPath?: string | null
): string {
  if (isTauri() && libraryPath && !source.startsWith("blob:") && !source.startsWith("http")) {
    // In Tauri, convert local file path to asset URL
    // The file path could be absolute or Library-relative
    if (source.includes("://")) return source;
    // Use Tauri's convertFileSrc for local files
    try {
      const { convertFileSrc } = require("@tauri-apps/api/core");
      return convertFileSrc(source);
    } catch {
      return source;
    }
  }
  return source;
}
