# Footprint Local Library

A Footprint **Library** is a folder on your computer that contains all your journey data, photos, and metadata. It is designed to be self-contained, portable, and fully under your control.

## Folder Structure

```
Footprint Library/
├── footprint.db       # SQLite database
├── photos/            # Original photo files
│   └── <journeyId>/
│       └── <photoId>.jpg
├── thumbnails/        # Auto-generated thumbnails (v2.1+)
│   └── <journeyId>/
│       └── <photoId>.jpg
```

## What Each Part Does

### `footprint.db`

An SQLite database containing all metadata:
- Journeys (title, location, dates, companions, notes, status)
- Photos (file paths, categories, cover/highlight flags, notes)
- Categories (per-journey photo categories)
- App settings
- Schema version (for future migrations)

**Do not delete this file** unless you want to lose all your journey metadata.

### `photos/`

Your original photo files, organized by journey. Each journey gets its own folder named with the journey's ID. Photos are stored with their original file extension.

- You can manually copy this folder to back up your photos
- The app only references photos by relative paths — so the entire Library folder can be moved
- **Do not rename or delete individual photo files** unless you also update the database

### `thumbnails/`

Auto-generated smaller versions of your photos for faster browsing. Thumbnails are regenerated when:
- New photos are imported
- You click **Rebuild Thumbnails** in Settings

If thumbnails are missing, the app will fall back to showing original photos. You can rebuild them anytime from Settings.

## Relative Paths

All file references in the database use **paths relative to the Library root**:

```
photos/<journeyId>/<photoId>.jpg
thumbnails/<journeyId>/<photoId>.jpg
```

This means you can move the entire Library folder to a different location (or a different drive) and the app will still work — as long as you point it to the new location.

## Moving Your Library to an External Drive

1. Copy the entire Library folder to your external drive
2. Open Footprint Desktop
3. Go to Settings → Local Library → **Change Library**
4. Select the Library folder on your external drive

All your journeys and photos will be available immediately.

## What NOT to Delete Manually

- `footprint.db` — contains all your journey metadata
- Any file inside `photos/` while keeping the database entry (will show missing-file placeholders)
- Files that belong to journeys you want to keep

## What to Do If Thumbnails Are Missing

1. Go to Settings → Local Library
2. Click **Rebuild Thumbnails**
3. The app will scan all photos and regenerate any missing thumbnails

## What to Do If You Change a Photo File

If you manually replace a photo file with a different image (keeping the same filename), the thumbnail will be out of date. Use **Rebuild Thumbnails** to regenerate it.

## Compatibility

Footprint Libraries are forward-compatible within the v2.x series. The app automatically runs schema migrations when opening an older Library.
