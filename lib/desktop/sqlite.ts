/**
 * SQLite database initialization and connection for desktop mode.
 *
 * Uses @tauri-apps/plugin-sql for SQLite access.
 * The database file is stored at <Library>/footprint.db.
 */
import Database from "@tauri-apps/plugin-sql";
import {
  ALL_CREATE_STATEMENTS,
  CREATE_INDEXES,
  CURRENT_SCHEMA_VERSION,
} from "./schema";
import { isTauri } from "../environment";

let _db: Database | null = null;
let _libraryPath: string | null = null;

/** Get the current database connection (must call initDatabase first). */
export function getDb(): Database | null {
  return _db;
}

/** Get the current library path. */
export function getLibraryPath(): string | null {
  return _libraryPath;
}

/**
 * Initialize the SQLite database at the given Library path.
 * Creates tables if they don't exist and runs migrations.
 */
export async function initDatabase(libraryPath: string): Promise<Database> {
  if (!isTauri()) {
    throw new Error("initDatabase can only be called in Tauri desktop mode");
  }

  const dbPath = `${libraryPath}/footprint.db`;

  const db = await Database.load(`sqlite:${dbPath}`);

  // Create tables
  for (const stmt of ALL_CREATE_STATEMENTS) {
    await db.execute(stmt, []);
  }

  // Run migrations
  await migrateSchema(db);

  // Create indexes after migrations because table rebuilds remove old indexes.
  for (const stmt of CREATE_INDEXES) {
    await db.execute(stmt, []).catch(() => {
      // Index may already exist — ignore
    });
  }

  // Set schema version
  await db.execute(
    "INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)",
    ["schema_version", String(CURRENT_SCHEMA_VERSION)]
  );

  _db = db;
  _libraryPath = libraryPath;
  return db;
}

/** Run schema migrations based on current schema version. */
async function migrateSchema(db: Database): Promise<void> {
  const rows: any[] = await db.select(
    "SELECT value FROM app_meta WHERE key = ?",
    ["schema_version"]
  );

  const currentVersion = rows.length > 0 ? parseInt(rows[0].value, 10) : 0;

  if (currentVersion < 1) {
    // v1 is the initial schema — tables are already created above
  }

  if (currentVersion === 1) {
    await db.execute("PRAGMA foreign_keys = OFF", []);
    await db.execute("DROP TABLE IF EXISTS photos_v2", []);
    await db.execute("DROP TABLE IF EXISTS photo_categories_v2", []);
    await db.execute(
      `CREATE TABLE photo_categories_v2 (
        id TEXT NOT NULL,
        journey_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (journey_id, id),
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
      )`,
      []
    );
    await db.execute(
      `INSERT INTO photo_categories_v2 (id, journey_id, name, created_at, updated_at)
       SELECT id, journey_id, name, created_at, updated_at FROM photo_categories`,
      []
    );
    await db.execute(
      `CREATE TABLE photos_v2 (
        id TEXT PRIMARY KEY,
        journey_id TEXT NOT NULL,
        file_name TEXT,
        original_file_name TEXT,
        relative_path TEXT NOT NULL,
        thumbnail_relative_path TEXT,
        mime_type TEXT,
        width INTEGER,
        height INTEGER,
        category_id TEXT,
        is_cover INTEGER NOT NULL DEFAULT 0,
        is_highlight INTEGER NOT NULL DEFAULT 0,
        note TEXT,
        has_note INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE,
        FOREIGN KEY (journey_id, category_id) REFERENCES photo_categories_v2(journey_id, id)
      )`,
      []
    );
    await db.execute(
      `INSERT INTO photos_v2
       SELECT id, journey_id, file_name, original_file_name, relative_path,
              thumbnail_relative_path, mime_type, width, height, category_id,
              is_cover, is_highlight, note, has_note, created_at, updated_at, deleted_at
       FROM photos`,
      []
    );
    await db.execute("DROP TABLE photos", []);
    await db.execute("DROP TABLE photo_categories", []);
    await db.execute("ALTER TABLE photo_categories_v2 RENAME TO photo_categories", []);
    await db.execute("ALTER TABLE photos_v2 RENAME TO photos", []);
    await db.execute("PRAGMA foreign_keys = ON", []);
  }
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (_db) {
    await _db.close();
    _db = null;
    _libraryPath = null;
  }
}
