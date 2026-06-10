/**
 * SQLite schema definitions for Footprint desktop Library.
 *
 * Tables:
 *   app_meta    — key-value store for schema_version, library config
 *   journeys    — journey metadata
 *   photo_categories — per-journey photo categories
 *   photos      — photo metadata (paths relative to Library root)
 *   settings    — app settings key-value store
 */

// ── Schema version ──────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 2;

// ── DDL Statements ──────────────────────────────────────────────────

export const CREATE_APP_META = `
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const CREATE_JOURNEYS = `
CREATE TABLE IF NOT EXISTS journeys (
  id                TEXT PRIMARY KEY,
  title             TEXT,
  location          TEXT,
  location_country  TEXT,
  location_province TEXT,
  location_cities   TEXT,
  location_city     TEXT,
  location_address  TEXT,
  start_date        TEXT,
  end_date          TEXT,
  companions        TEXT,
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'archived',
  cover_photo_id    TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  deleted_at        TEXT
);
`;

export const CREATE_PHOTO_CATEGORIES = `
CREATE TABLE IF NOT EXISTS photo_categories (
  id         TEXT NOT NULL,
  journey_id TEXT NOT NULL,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (journey_id, id),
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);
`;

export const CREATE_PHOTOS = `
CREATE TABLE IF NOT EXISTS photos (
  id                     TEXT PRIMARY KEY,
  journey_id             TEXT NOT NULL,
  file_name              TEXT,
  original_file_name     TEXT,
  relative_path          TEXT NOT NULL,
  thumbnail_relative_path TEXT,
  mime_type              TEXT,
  width                  INTEGER,
  height                 INTEGER,
  category_id            TEXT,
  is_cover               INTEGER NOT NULL DEFAULT 0,
  is_highlight           INTEGER NOT NULL DEFAULT 0,
  note                   TEXT,
  has_note               INTEGER NOT NULL DEFAULT 0,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL,
  deleted_at             TEXT,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
  FOREIGN KEY (journey_id, category_id) REFERENCES photo_categories(journey_id, id)
);
`;

export const CREATE_SETTINGS = `
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const ALL_CREATE_STATEMENTS = [
  CREATE_APP_META,
  CREATE_JOURNEYS,
  CREATE_PHOTO_CATEGORIES,
  CREATE_PHOTOS,
  CREATE_SETTINGS,
];

// ── Indexes ─────────────────────────────────────────────────────────

export const CREATE_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_photos_journey_id ON photos(journey_id);",
  "CREATE INDEX IF NOT EXISTS idx_photos_category_id ON photos(category_id);",
  "CREATE INDEX IF NOT EXISTS idx_categories_journey_id ON photo_categories(journey_id);",
  "CREATE INDEX IF NOT EXISTS idx_journeys_status ON journeys(status);",
];
