/**
 * Repository factory — returns the appropriate data access implementation
 * based on the current runtime environment.
 *
 * - Browser mode (no Tauri): localStorage + IndexedDB
 * - Desktop mode (Tauri + Library selected): SQLite + local filesystem
 */
import type {
  JourneyRepository,
  PhotoRepository,
  SettingsRepository,
} from "./types";
import { browserJourneyRepo, browserPhotoRepo, browserSettingsRepo } from "./localBrowserRepository";
import {
  desktopJourneyRepo,
  desktopPhotoRepo,
  desktopSettingsRepo,
} from "./desktopLibraryRepository";
import { isDesktopMode, isTauri } from "../environment";
import { getDb } from "../desktop/sqlite";

// ── State ───────────────────────────────────────────────────────────

let _mode: "browser" | "desktop" = "browser";
let _initialized = false;

// ── Public API ──────────────────────────────────────────────────────

/** Initialize the data layer. Call once at app startup. */
export async function initializeDataLayer(): Promise<"browser" | "desktop"> {
  if (_initialized) return _mode;

  if (isTauri() && getDb() !== null) {
    _mode = "desktop";
  } else {
    _mode = "browser";
  }

  _initialized = true;
  return _mode;
}

/** Get the current data mode. */
export function getDataMode(): "browser" | "desktop" {
  return _mode;
}

/** Set the data mode explicitly (used when Library is selected/deselected). */
export function setDataMode(mode: "browser" | "desktop"): void {
  _mode = mode;
  _initialized = true;
}

/** Get the journey repository for the current mode. */
export function getJourneyRepo(): JourneyRepository {
  return _mode === "desktop" ? desktopJourneyRepo : browserJourneyRepo;
}

/** Get the photo repository for the current mode. */
export function getPhotoRepo(): PhotoRepository {
  return _mode === "desktop" ? desktopPhotoRepo : browserPhotoRepo;
}

/** Get the settings repository for the current mode. */
export function getSettingsRepo(): SettingsRepository {
  return _mode === "desktop" ? desktopSettingsRepo : browserSettingsRepo;
}
