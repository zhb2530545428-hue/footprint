# Privacy & Data Handling

Footprint is designed to be **private by default**. Your travel memories stay on your device.

## What Footprint Does NOT Do

- **No login or user accounts** — there is no authentication system. The app works without any account.
- **No cloud upload** — your photos and journey data never leave your device through the app.
- **No analytics or telemetry** — we do not collect usage data, crash reports, or analytics.
- **No tracking** — there are no cookies, tracking pixels, or third-party scripts.
- **No AI processing** — the current version does not send your photos to any AI service for analysis, tagging, or captioning.
- **No social features** — there is no public sharing, collaboration, or social feed.

## Where Your Data Lives

| Data | Location |
|------|----------|
| Journeys, categories, notes | `footprint.db` (SQLite) in your Library folder |
| Photos | `Library/photos/` — your original files |
| Thumbnails | `Library/thumbnails/` — auto-generated smaller versions |
| App preferences | Tauri app data directory (`footprint-store.json`) |

All data is stored as regular files on your computer. You can back it up, move it, or delete it using your file manager.

## Network Requests

The Footprint desktop app does not make any automatic network requests. It runs fully offline.

The web development version (`npm run dev`) loads only the Next.js development server on `localhost`. No external network calls are made.

## Future AI & Network Features

If AI features are added in the future:
- They will be **explicit and optional** — never automatic
- You will be asked before any photo or data is sent to an external service
- Local-only operation will always remain the default

## External Dependencies

The desktop app bundles:
- **Tauri** — the desktop framework (runs locally)
- **SQLite** — embedded database (runs locally)
- **image crate** — Rust image processing library for thumbnail generation (runs locally)

None of these dependencies make network requests on behalf of the app.

## Your Responsibility

- Your Library folder is not encrypted by Footprint. If you store it on a shared computer or an unencrypted drive, others may be able to access it.
- If you place your Library folder in a cloud-synced folder (Dropbox, iCloud, OneDrive, etc.), the sync provider's privacy policy applies to the files in that folder.

## Questions?

This document describes the current state of the app. If you have questions about specific data handling, check the source code or open an issue on the repository.
