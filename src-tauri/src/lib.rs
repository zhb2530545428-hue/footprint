use std::fs;
use std::path::Path;
use tauri::Manager;
use tauri_plugin_fs::FsExt;

// ── Custom Tauri Commands ──────────────────────────────────────────

/// Create the Library folder structure at the given path.
/// Returns the full path to the created Library.
#[tauri::command]
fn create_library(base_path: String) -> Result<String, String> {
    let lib_path = Path::new(&base_path);
    fs::create_dir_all(lib_path).map_err(|e| format!("Failed to create Library folder: {}", e))?;

    let photos_dir = lib_path.join("photos");
    fs::create_dir_all(&photos_dir).map_err(|e| format!("Failed to create photos folder: {}", e))?;

    Ok(base_path)
}

/// Check if a path contains a valid Footprint Library.
/// Returns true if footprint.db exists (or the folder is ready for initialization).
#[tauri::command]
fn check_library(path: String) -> Result<bool, String> {
    let lib_path = Path::new(&path);
    if !lib_path.exists() {
        return Ok(false);
    }
    let db_path = lib_path.join("footprint.db");
    Ok(db_path.exists())
}

/// Allow the selected Library path for filesystem and local asset access.
#[tauri::command]
fn allow_library_path(app: tauri::AppHandle, library_path: String) -> Result<(), String> {
    app.fs_scope()
        .allow_directory(&library_path, true)
        .map_err(|e| format!("Failed to allow Library filesystem access: {}", e))?;
    app.asset_protocol_scope()
        .allow_directory(&library_path, true)
        .map_err(|e| format!("Failed to allow Library photo access: {}", e))?;
    Ok(())
}

/// Copy a file from source to destination, creating parent directories as needed.
/// Returns the relative path within the Library.
#[tauri::command]
fn copy_photo_to_library(
    source: String,
    library_path: String,
    journey_id: String,
    photo_id: String,
) -> Result<String, String> {
    let source_path = Path::new(&source);
    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let dest_dir = Path::new(&library_path).join("photos").join(&journey_id);
    fs::create_dir_all(&dest_dir)
        .map_err(|e| format!("Failed to create photo directory: {}", e))?;

    let dest_path = dest_dir.join(format!("{}.{}", photo_id, ext));
    fs::copy(&source_path, &dest_path)
        .map_err(|e| format!("Failed to copy photo: {}", e))?;

    // Return Library-relative path
    Ok(format!("photos/{}/{}.{}", journey_id, photo_id, ext))
}

/// Delete a photo file from the Library.
#[tauri::command]
fn delete_photo_from_library(library_path: String, relative_path: String) -> Result<(), String> {
    let full_path = Path::new(&library_path).join(&relative_path);
    if full_path.exists() {
        fs::remove_file(&full_path)
            .map_err(|e| format!("Failed to delete photo file: {}", e))?;
    }
    Ok(())
}

/// Delete an entire journey's photo directory.
#[tauri::command]
fn delete_journey_photos_dir(library_path: String, journey_id: String) -> Result<(), String> {
    let dir_path = Path::new(&library_path).join("photos").join(&journey_id);
    if dir_path.exists() {
        fs::remove_dir_all(&dir_path)
            .map_err(|e| format!("Failed to delete journey photos: {}", e))?;
    }
    Ok(())
}

/// Get the absolute path for a Library-relative path.
#[tauri::command]
fn resolve_library_path(library_path: String, relative_path: String) -> Result<String, String> {
    let full = Path::new(&library_path).join(&relative_path);
    Ok(full.to_string_lossy().to_string())
}

// ── App Entry Point ────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_library,
            check_library,
            allow_library_path,
            copy_photo_to_library,
            delete_photo_from_library,
            delete_journey_photos_dir,
            resolve_library_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
