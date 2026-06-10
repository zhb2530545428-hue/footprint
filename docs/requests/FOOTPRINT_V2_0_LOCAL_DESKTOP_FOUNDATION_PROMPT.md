# Footprint v2.0 Local Desktop Foundation — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V2_0_LOCAL_DESKTOP_FOUNDATION_PROMPT.md，然后按照里面的要求实现 Footprint v2.0。

这次不是做云后端，不做登录，不上传云端。
这次目标是把 Footprint 从浏览器 localStorage / IndexedDB 应用，推进成一个可长期本地使用的离线桌面应用基础版。

核心方向：
1. 本地桌面 App。
2. 用户选择一个 Footprint Library 文件夹。
3. SQLite 数据库存 Journey / Photo metadata / categories / notes / settings。
4. 照片文件复制到 Library/photos。
5. 数据库和照片都在用户自己的电脑或移动硬盘里。
6. 以后换电脑时，选择同一个 Library 文件夹即可打开同一套相册。
7. 不做云端、不做登录、不做同步服务。

完成后运行 npm run lint、npm run typecheck、npm run build，并尽可能运行桌面端 dev/build 命令。
修复所有错误，并报告哪些已完成、哪些因为当前 Next/Tauri 打包限制需要后续处理。
```

Repository:

```text
https://github.com/zhb2530545428-hue/footprint.git
```

---

## 1. Product context

Footprint is a personal travel photo memory app.

It should feel:

```text
calm
personal
memory-first
photo-first
low-density
Airbnb-inspired
private by default
not an admin dashboard
not a social album
not a marketplace
```

The user is satisfied with versions up to v1.9:

```text
v1: Basic Journey flow
v1.1: Local image persistence and editing
v1.2: Trash & Safe Delete
v1.3: Settings & Home Polish
v1.4: Custom Categories & Manual Organization
v1.4.1: Category Polish
v1.5: Photo Notes Polish, including Apple-like hover note card
v1.6: Journey Detail Memory Polish
v1.7: Edit Journey Curation Polish
v1.8: China Province + Multi-city Location Fields
v1.9: Memory Library Browse Modes
```

Now implement:

```text
v2.0 Local Desktop Foundation
```

One-sentence goal:

```text
Move Footprint from browser-private localStorage/IndexedDB storage toward a portable offline desktop app backed by a user-selected local Library folder.
```

Chinese product goal:

```text
让 Footprint 从“浏览器本地应用”升级为“自己下载自己用、数据保存在本地 Library 文件夹、可放在移动硬盘里的离线桌面相册应用基础版”。
```

---

## 2. Strategic decision

Do **not** build a cloud backend.

Do **not** use Supabase, Cloudflare, Firebase, or any other cloud service in this version.

The product direction is now:

```text
local-first
offline-first
no login
no cloud account
open-source friendly
user owns their files
AI/network features only optional in the future
```

The user wants to eventually use Footprint as a local desktop app:

```text
download app
choose a Library folder
store photos + database locally
optionally put the Library on a mobile hard drive
open the same Library from another computer
```

This version should create the foundation for that.

---

## 3. Key problem to solve

Current Footprint stores data in browser-local storage:

```text
Journey metadata -> localStorage
photos -> IndexedDB / browser storage
```

That means:

```text
Chrome has one library
Edge has another library
another computer has another library
clearing browser data may lose the app data
```

v2.0 should start solving this by introducing:

```text
Footprint Library folder
SQLite database
local photo files
desktop shell
local data adapter
migration from browser local data
```

---

## 4. High-level target architecture

Target local Library folder:

```text
Footprint Library/
  footprint.db
  photos/
    <journeyId>/
      <photoId>.<ext>
  thumbnails/
    <journeyId>/
      <photoId>.webp
  backups/
    footprint-YYYY-MM-DD-HH-mm.db
  exports/
```

### Required for v2.0

Implement the foundation for:

```text
footprint.db
photos/
Library selection / creation
basic local persistence through SQLite + local files
```

### Optional / nice-to-have in v2.0

Implement only if straightforward:

```text
thumbnails/
backups/
exports/
```

Do not let optional folders block the core version.

The most important v2.0 outcome is:

```text
A selected local Library folder becomes the source of truth instead of browser-specific storage.
```

---

## 5. Technology direction

Preferred direction:

```text
Tauri desktop shell
SQLite database
local filesystem Library folder
existing React/Next UI reused as much as possible
```

However, inspect the current project first.

This repository is currently a Next.js / TypeScript app. Next.js + Tauri production packaging can have constraints depending on routing and static export setup.

Therefore:

```text
1. Prefer Tauri if feasible.
2. Do not rewrite the entire UI framework in v2.0 unless absolutely necessary.
3. Keep the existing web app working.
4. Add desktop/local-library capability in the least risky way.
5. If production desktop packaging cannot be fully completed in one pass, still implement the local data architecture and document the remaining packaging blocker clearly.
```

Do not silently break the existing Next web app.

---

## 6. Scope of v2.0

This is a large foundation version, but it must stay focused.

### Must do

1. Add a desktop app foundation, preferably Tauri.
2. Add a user-selectable Footprint Library folder concept.
3. Add SQLite schema for Journeys, Photos, Categories, Settings, and Trash-compatible metadata.
4. Add local file storage for photos under the Library folder.
5. Add a local data adapter for desktop mode.
6. Preserve existing browser-local mode as a fallback until desktop mode is stable.
7. Add a migration/import path from existing localStorage + IndexedDB data into the selected Library.
8. Keep all current product features working as much as possible:
   - Home Memory Library modes
   - New Journey
   - Edit Journey
   - Journey Detail
   - Photo notes
   - Custom categories
   - China province + multi-city locations
   - Trash & Safe Delete
9. Keep the app offline by default.
10. Do not add login.

### Must not do

Do not implement:

```text
cloud backend
Supabase
Cloudflare backend
Firebase
login
user accounts
remote sync
public sharing
multi-user SaaS
AI photo picking
AI recap
AI captions
map
GPS
cloud storage
payment
teams
collaboration
```

Do not upload photos anywhere.

Do not add automatic network calls.

Do not add OpenAI or any other AI API in v2.0.

AI may be a future optional network feature, but not now.

---

## 7. Desktop app behavior

### 7.1 First launch

When Footprint Desktop launches and no Library is selected:

Show a calm first-run screen:

```text
Choose your Footprint Library
Keep your journeys, photos, notes, and categories in one local folder.
```

Primary actions:

```text
Create new Library
Open existing Library
```

Secondary copy:

```text
You can place this folder on your computer, an external drive, or a synced folder you control.
```

Do not mention cloud login.

Do not mention SaaS.

### 7.2 Create new Library

User chooses or creates a folder.

The app initializes:

```text
footprint.db
photos/
thumbnails/ optional
backups/ optional
exports/ optional
```

Store the chosen Library path in local app config, not in cloud.

Next time the desktop app opens, it should reopen the last Library if available.

### 7.3 Open existing Library

User selects an existing Library folder.

The app checks:

```text
footprint.db exists
required folders exist or can be created
schema version is compatible or can migrate
```

Then it loads Journeys from SQLite.

### 7.4 Switch Library

Add a small Settings entry if feasible:

```text
Current Library
/path/to/Footprint Library

Change Library
```

Changing Library should not delete anything.

It only changes which local Library the app reads.

---

## 8. Local Library portability requirement

The Library should be portable.

Important:

```text
Store photo paths relative to the Library folder.
Do not store absolute paths as the only source of truth.
```

Good:

```text
photos/<journeyId>/<photoId>.jpg
```

Bad as source of truth:

```text
C:\Users\someone\Pictures\Footprint Library\photos\...
/Users/name/Pictures/Footprint Library/photos/...
```

Absolute paths may be computed at runtime, but database records should use Library-relative paths.

This is critical for mobile hard drive usage.

---

## 9. SQLite schema

Create a local SQLite database.

Suggested database path:

```text
<Library>/footprint.db
```

Use a schema version table.

Suggested tables:

### app_meta

```sql
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### journeys

```sql
CREATE TABLE IF NOT EXISTS journeys (
  id TEXT PRIMARY KEY,
  title TEXT,
  location TEXT,
  location_country TEXT,
  location_province TEXT,
  location_cities TEXT,
  location_city TEXT,
  location_address TEXT,
  start_date TEXT,
  end_date TEXT,
  companions TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'archived',
  cover_photo_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
```

### photo_categories

```sql
CREATE TABLE IF NOT EXISTS photo_categories (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);
```

### photos

```sql
CREATE TABLE IF NOT EXISTS photos (
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
  FOREIGN KEY (category_id) REFERENCES photo_categories(id)
);
```

### settings

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

If existing app settings remain in localStorage for now, that is acceptable, but the long-term direction should be SQLite.

---

## 10. Data adapter architecture

Avoid scattering Tauri/SQLite calls throughout UI components.

Add a local data layer.

Suggested structure:

```text
lib/data/
  types.ts
  journeyRepository.ts
  photoRepository.ts
  settingsRepository.ts
  localBrowserRepository.ts
  desktopLibraryRepository.ts
  repositoryFactory.ts

lib/desktop/
  library.ts
  photos.ts
  sqlite.ts
```

Exact file names can follow project conventions.

Goal:

```text
UI components call repository functions.
Repository decides whether to use current browser local storage or desktop Library mode.
```

Suggested behavior:

```text
if running in desktop/Tauri and Library is selected:
  use desktopLibraryRepository
else:
  use existing localStorage/IndexedDB behavior
```

Do not break browser mode.

---

## 11. Photo import behavior

When user uploads/imports photos in desktop mode:

```text
1. User selects image files.
2. App copies files into:
   <Library>/photos/<journeyId>/<photoId>.<ext>
3. Database stores relative_path.
4. UI displays the photo from local file path / Tauri asset URL.
```

Important:

```text
Copy files, do not move them.
```

The user's original photo files should remain where they were.

Do not store full image binary data in SQLite.

SQLite should store metadata and relative file paths only.

---

## 12. Local image display

In desktop mode, photos should load from local Library paths.

Use the correct Tauri-safe method for converting local file paths into image URLs.

Do not use browser blob URLs as permanent data.

Do not store temporary object URLs in SQLite.

If a file is missing, show a calm broken-file state and keep the metadata.

Do not crash.

---

## 13. Thumbnails

Thumbnails are useful but not mandatory for v2.0.

If thumbnail generation is simple:

```text
create thumbnails under thumbnails/<journeyId>/<photoId>.webp
store thumbnail_relative_path
use thumbnail in grids
use original in lightbox
```

If thumbnail generation is too large for this version:

```text
use original images for display for now
leave thumbnail_relative_path nullable
document thumbnails as v2.1/v2.2 follow-up
```

Do not block v2.0 on thumbnail perfection.

---

## 14. Migration from current browser data

This is very important.

The user may already have local Footprint data in:

```text
localStorage
IndexedDB
```

Add a migration/import path in desktop mode.

Suggested UX:

```text
Settings or first-run after selecting Library:

Import existing browser data
We found local Footprint data in this browser. Import it into your selected Library so it can travel with the app.
```

Migration should:

```text
1. Read existing localStorage Journeys.
2. Read existing IndexedDB image blobs.
3. Insert Journey metadata into SQLite.
4. Create categories in SQLite.
5. Copy image blobs into Library/photos/<journeyId>/.
6. Insert photo metadata with relative paths.
7. Preserve cover / highlight / note / category / location fields.
8. Preserve Trash/deleted state if possible.
9. Report success and failures.
```

Important:

```text
Do not delete old localStorage/IndexedDB data after migration.
```

At most, mark migration as completed in local app config.

This makes migration safe.

### Duplicate handling

If migration is run twice:

```text
do not create duplicate Journeys if IDs already exist
do not duplicate photos if photo IDs already exist
```

Use stable IDs from existing data when possible.

---

## 15. Preserve current product features

v2.0 should not be a UX redesign.

Preserve existing accepted product behavior:

### Home v1.9

```text
Recent / Timeline / Places browse modes
Journey-level search
low-density cards
settings field controls
structured China location grouping
old free-text location fallback
```

### Journey Detail v1.6

```text
Hero memory page
Journey notes
Highlights
Photo Library
Lightbox
note display
```

### Edit Journey v1.7

```text
curation workspace
cover panel
highlights panel
organize photos
categories
Danger Zone
```

### Location v1.8

```text
China province single-select
city multi-select
optional detailed address
changing province clears selected cities
```

### Notes v1.5

```text
orange note dots
Apple-like hover note card
Lightbox notes
With Notes filter
```

### Delete v1.2

```text
Delete Journey in Edit page Danger Zone
Delete moves to Trash
Restore from Trash
Delete Permanently only in Trash
```

Do not regress these.

---

## 16. Browser mode compatibility

For now, keep the browser version usable.

If the app is opened in a normal browser:

```text
it may continue using localStorage/IndexedDB as before
or show a message that Desktop mode is recommended for portable local Library
```

Do not remove the existing browser path unless the desktop path is fully working.

The long-term direction is desktop-first, but v2.0 should not unnecessarily destroy web functionality.

---

## 17. Settings page additions

Add a small Local Library section if feasible.

Suggested copy:

```text
Local Library

Footprint stores your journeys and photos in a folder you control.
Current Library:
/path/to/Footprint Library

Change Library
Import browser data
Open Library Folder
```

Buttons:

```text
Change Library
Import browser data
Open Library Folder
```

Only show desktop-specific controls when running in desktop mode.

If not desktop mode:

```text
Local Library is available in the desktop app.
```

Do not make this noisy.

---

## 18. Privacy principles

v2.0 must reinforce privacy:

```text
No login.
No cloud upload.
No background network sync.
No analytics unless already present.
No AI calls.
Photos stay on the user's device or selected external drive.
```

Future AI features must be explicit and optional.

Do not add any AI provider settings in v2.0 unless already present.

---

## 19. Error handling

Handle these cases calmly:

```text
No Library selected
Library folder missing
Database missing
Database schema too old/new
Photo file missing
Permission denied when writing Library
Disk full or copy failed
Migration partially failed
```

Use calm user-facing messages.

Do not crash.

Do not delete user data automatically.

---

## 20. Implementation strategy

This is a big version. Implement in safe phases.

### Phase 1 — Desktop shell

```text
Add Tauri desktop foundation if feasible.
Add npm scripts for desktop dev/build.
Make existing UI load in desktop mode.
Keep web mode working.
```

If Tauri production packaging is blocked by current Next routing/static-export constraints:

```text
make dev mode work
document the blocker
do not rewrite the full app unless necessary
```

### Phase 2 — Library selection

```text
Create/Open Library
Store last selected Library path
Initialize folder structure
Initialize footprint.db
```

### Phase 3 — SQLite schema and repositories

```text
Create schema
Implement CRUD repository methods for Journeys / Photos / Categories / Settings
Add repositoryFactory
```

### Phase 4 — Photo import to Library

```text
Copy uploaded photos into photos/<journeyId>/
Store relative paths
Render local photos
```

### Phase 5 — Migration

```text
Import existing localStorage + IndexedDB data into Library
Preserve current IDs and metadata
Do not delete old browser data
```

### Phase 6 — Regression pass

```text
Verify Home / New / Edit / Detail / Trash flows
Verify location fields
Verify notes
Verify categories
```

---

## 21. Suggested desktop commands

Add package scripts if appropriate:

```json
{
  "scripts": {
    "desktop:dev": "tauri dev",
    "desktop:build": "tauri build"
  }
}
```

Use the actual command shape required by the selected Tauri setup.

If Tauri setup uses another script pattern, follow it.

---

## 22. Acceptance checklist

### Desktop foundation

- Desktop app can be launched in development mode.
- Existing UI loads inside the desktop shell.
- Web mode still works or has a clear fallback.
- No cloud service is introduced.

### Library selection

- First launch can create a new Library.
- First launch can open an existing Library.
- Library folder contains footprint.db and photos/.
- Last selected Library can be reopened.
- User can change Library without deleting data.

### SQLite

- SQLite database is created in the Library folder.
- Journeys can be stored and loaded from SQLite in desktop mode.
- Photos metadata can be stored and loaded from SQLite in desktop mode.
- Categories can be stored and loaded from SQLite in desktop mode.
- Settings can be stored or preserved safely.
- Schema version is tracked.

### Photo storage

- Uploaded/imported photos are copied into Library/photos.
- Photo paths in DB are relative to Library.
- Photos render from local Library files.
- Photos are not stored as permanent blob URLs.
- Photos are not stored as base64 in SQLite.
- Original imported files are copied, not moved.

### Migration

- Existing localStorage Journeys can be imported.
- Existing IndexedDB image blobs can be imported.
- Cover/highlight/note/category/location data is preserved.
- Migration does not delete old browser data.
- Running migration twice does not duplicate data.

### Product regression

- Home Recent / Timeline / Places modes still work.
- Journey search still works.
- New Journey still works.
- Edit Journey still works.
- Journey Detail still works.
- Lightbox still works.
- Notes still work.
- Categories still work.
- China province/multi-city fields still work.
- Trash / Restore / Delete Permanently still works.

### Privacy/scope

- No login system exists.
- No cloud backend exists.
- No photo upload to cloud.
- No AI call.
- No map/GPS.
- No public sharing.

---

## 23. Testing commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Also run the desktop dev/build commands if available:

```bash
npm run desktop:dev
npm run desktop:build
```

or the equivalent actual Tauri commands.

If one command is unavailable or blocked, report clearly:

```text
command
result
error
reason
what remains to fix
```

Do not pretend desktop packaging works if it does not.

---

## 24. Manual testing

Manually test:

```text
Open desktop app.
Create a new Library.
Create a new Journey.
Upload photos.
Confirm photos are copied into Library/photos.
Confirm footprint.db exists.
Restart desktop app.
Confirm Journey still appears.
Open Journey Detail.
Edit Journey.
Set cover.
Toggle highlights.
Add note.
Assign category.
Use China province + multi-city fields.
Use Home Recent / Timeline / Places.
Switch Library.
Open previous Library again.
Import old browser data if local data exists.
Confirm migrated Journeys and photos appear.
Confirm original browser data was not deleted.
```

Also test failure cases:

```text
Select invalid folder if possible.
Remove a photo file manually and reopen app.
Try opening Library from external drive path if available.
```

---

## 25. Report back

After implementation, report:

1. Which files changed.
2. Which desktop framework/setup was added.
3. Whether Tauri dev works.
4. Whether desktop production build works.
5. Where Library path is stored.
6. What Library folder structure is created.
7. Where SQLite database lives.
8. What schema was created.
9. How photos are copied and referenced.
10. Whether paths are Library-relative.
11. How migration from localStorage/IndexedDB works.
12. What product features were regression-tested.
13. Results of:

```bash
npm run lint
npm run typecheck
npm run build
npm run desktop:dev
npm run desktop:build
```

If something is incomplete, say so clearly.

---

## 26. Final reminder

This is v2.0 Local Desktop Foundation.

Do not build cloud.

Do not build login.

Do not upload photos anywhere.

Do not build AI.

Do not build map/timeline/export/share.

The purpose of this version is:

```text
Footprint becomes a local-first, offline-first desktop app foundation.
Data lives in a user-controlled Library folder.
The Library can live on a computer, mobile hard drive, or user-controlled synced folder.
```

Keep Footprint calm, private, personal, memory-first, photo-first, and low-density.
