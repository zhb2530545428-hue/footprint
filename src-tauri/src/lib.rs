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

    let thumbnails_dir = lib_path.join("thumbnails");
    fs::create_dir_all(&thumbnails_dir).map_err(|e| format!("Failed to create thumbnails folder: {}", e))?;

    Ok(base_path)
}

/// Check if a path contains a valid Footprint Library.
/// Returns a JSON string with validation details.
#[tauri::command]
fn check_library(path: String) -> Result<String, String> {
    let lib_path = Path::new(&path);

    let folder_exists = lib_path.exists();
    let db_exists = lib_path.join("footprint.db").exists();
    let photos_exists = lib_path.join("photos").exists();
    let thumbnails_exists = lib_path.join("thumbnails").exists();

    // Test write permission by attempting to create dirs
    let can_write = (|| {
        if folder_exists {
            let test_photos = lib_path.join("photos");
            fs::create_dir_all(&test_photos).ok()?;
            let test_thumbs = lib_path.join("thumbnails");
            fs::create_dir_all(&test_thumbs).ok()?;
            Some(())
        } else {
            None
        }
    })().is_some();

    let result = serde_json::json!({
        "valid": folder_exists && (db_exists || can_write) && can_write,
        "folder_exists": folder_exists,
        "db_exists": db_exists,
        "photos_exists": photos_exists,
        "thumbnails_exists": thumbnails_exists,
        "can_write": can_write,
    });

    Ok(result.to_string())
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

/// Generate a thumbnail for a photo.
/// Reads source_path, resizes to max 640px long edge, saves as JPEG (quality ~80) to dest_path.
#[tauri::command]
fn generate_thumbnail(source_path: String, dest_path: String) -> Result<bool, String> {
    let img = image::open(&source_path)
        .map_err(|e| format!("Failed to open image: {}", e))?;

    let (w, h) = (img.width(), img.height());
    let long_edge = w.max(h);
    let max_dim: u32 = 640;

    let resized = if long_edge > max_dim {
        let new_w = (w * max_dim) / long_edge;
        let new_h = (h * max_dim) / long_edge;
        img.resize(new_w, new_h, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };

    // Ensure parent directory exists
    if let Some(parent) = Path::new(&dest_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create thumbnail directory: {}", e))?;
    }

    // Save as JPEG with quality 80
    let mut output = std::fs::File::create(&dest_path)
        .map_err(|e| format!("Failed to create thumbnail file: {}", e))?;
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut output, 80);
    resized
        .write_with_encoder(encoder)
        .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

    Ok(true)
}

/// Open a path in the OS file explorer.
#[tauri::command]
fn open_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("Failed to open folder: {}", e))?;
    }

    Ok(())
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
    // Also clean up thumbnail directory
    let thumb_dir = Path::new(&library_path).join("thumbnails").join(&journey_id);
    if thumb_dir.exists() {
        fs::remove_dir_all(&thumb_dir).ok();
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
            generate_thumbnail,
            open_in_explorer,
            delete_photo_from_library,
            delete_journey_photos_dir,
            resolve_library_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
