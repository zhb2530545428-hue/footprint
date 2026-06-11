# Footprint v2.1 Desktop Production Push — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V2_1_DESKTOP_PRODUCTION_PUSH_PROMPT.md，然后按照里面的要求实现下一版 Footprint。

这次跳过 v2.0.1 / v2.1 / v2.2，不做单独的稳定性小版本、备份恢复版本、迁移 Polish 版本。
本次把原计划 v2.1 作为一个大推进版本：

1. Thumbnail & Performance
2. Local Library Management
3. Desktop Packaging & Open Source Readiness

不要做云端，不要做登录，不要做 AI，不要做地图，不要做导出，不要做公开分享。
这次的核心目标是让已经建立好的桌面端更像一个可以长期使用、可以打包、可以开源交付的本地 App。

完成后运行：
npm run lint
npm run typecheck
npm run build

并尽可能运行桌面端命令：
npm run desktop:dev
npm run desktop:build

修复所有错误，并报告真实验证结果。
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
local-first
offline-first
open-source friendly
not an admin dashboard
not a SaaS
not a social album
```

Accepted versions so far:

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
v2.0: Local Desktop Foundation
```

Now implement a larger v2.1 version:

```text
v2.1 Desktop Production Push
```

One-sentence goal:

```text
Make Footprint Desktop faster with thumbnails, easier to manage with local Library controls, and ready for packaging/open-source use.
```

Chinese product goal:

```text
把 Footprint Desktop 从“本地桌面基础已建立”推进到“照片多了也更流畅、Library 更好管理、可以准备打包和开源交付”的阶段。
```

---

## 2. Version decision

The user explicitly wants to skip these separate versions for now:

```text
v2.0.1 Desktop Stability & Data Safety
Old v2.1 Local Backup & Restore plan
Old v2.2 Local Migration Polish plan
```

The version number `v2.1` is now reassigned to this Desktop Production Push.
Do not implement full backup/restore or full migration-polish workflows in this prompt.

This v2.1 version should include:

```text
v2.1 Desktop Production Push
```

Important nuance:

```text
You may add minimal safety checks needed to make thumbnails, Library management, and packaging reliable.
But do not expand into full backup/restore or full migration-polish workflows.
```

---

## 3. Must not do

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
OpenAI API settings
map
GPS
route view
photo-level EXIF timeline
export story
PDF export
Markdown export
backup/restore system
full migration-polish flow
payment
collaboration
```

Do not upload photos anywhere.

Do not add automatic network calls.

Do not change Footprint back into a browser-only app.

Do not remove the local Library / SQLite / local photos direction.

---

## 4. Existing behavior to preserve

Preserve current accepted product behavior:

### v2.0 Local Desktop Foundation

```text
Desktop app can run.
User can choose/create a local Library folder.
Library stores footprint.db and photos/.
Photos are local files.
Metadata is local.
No cloud.
No login.
```

### v1.9 Home

```text
Recent / Timeline / Places browse modes.
Journey-level search.
Low-density cards.
Settings field controls.
Structured China location grouping.
Old free-text location fallback.
```

### v1.8 Location

```text
China province single-select.
City multi-select.
Detailed address optional.
Changing province clears selected cities.
```

### v1.7 Edit Journey

```text
Curation workspace.
Cover panel.
Highlights panel.
Organize Photos.
Categories.
Danger Zone.
```

### v1.6 Journey Detail

```text
Hero memory page.
Journey notes.
Highlights.
Photo Library.
Lightbox.
Note display.
```

### v1.5 Notes

```text
Orange note dots.
Apple-like hover note card.
Lightbox notes.
With Notes filter.
```

### v1.2 Delete

```text
Delete Journey in Edit page Danger Zone.
Delete moves to Trash.
Restore from Trash.
Delete Permanently only in Trash.
```

Do not regress these.

---

# Part A — Thumbnail & Performance

## 5. Goal

Improve performance when a Journey or Library contains many photos.

Current local desktop architecture stores original photos under:

```text
Footprint Library/
  photos/
```

This version should add a thumbnail system:

```text
Footprint Library/
  photos/
  thumbnails/
```

Grid/list pages should prefer thumbnails.

Lightbox/detail view should still use original images.

---

## 6. Thumbnail requirements

### 6.1 Thumbnail folder structure

Use Library-relative paths.

Recommended structure:

```text
Footprint Library/
  thumbnails/
    <journeyId>/
      <photoId>.webp
```

or:

```text
Footprint Library/
  thumbnails/
    <journeyId>/
      <photoId>.jpg
```

Prefer `.webp` if straightforward and reliable.

If WebP generation is not convenient in the current environment, use JPEG.

Do not block the version on WebP.

### 6.2 Database fields

If not already present, use the existing `thumbnail_relative_path` column from v2.0 schema or add it if missing:

```sql
thumbnail_relative_path TEXT
```

Do not store image binary data in SQLite.

Store only the Library-relative thumbnail path.

### 6.3 Thumbnail generation timing

Generate thumbnails when photos are imported/uploaded into the Library.

Recommended behavior:

```text
1. User uploads/imports photo.
2. Original photo is copied into Library/photos/<journeyId>/.
3. Thumbnail is generated into Library/thumbnails/<journeyId>/.
4. DB photo record stores both relative_path and thumbnail_relative_path.
```

If thumbnail generation fails:

```text
keep original photo
save photo record
leave thumbnail_relative_path empty
show original image as fallback
show a calm non-blocking warning only if necessary
```

Thumbnail failure must not destroy the original import.

### 6.4 Thumbnail size

Recommended thumbnail size:

```text
long edge: 800px to 1200px
quality: visually good, not huge
```

This should be enough for grids and Home cards.

Do not create tiny low-quality thumbnails.

Do not generate huge thumbnails close to original size.

### 6.5 Use thumbnails in UI

Use thumbnails where appropriate:

```text
Home Journey cards if cover thumbnail exists
Photo grids
Highlights grid
Edit Journey photo grid
Photo Library grid
```

Use original image for:

```text
Lightbox
full photo preview
export in future versions
```

If thumbnail is missing, fallback to original.

### 6.6 Rebuild thumbnails

Add a small Settings / Local Library action:

```text
Rebuild thumbnails
```

Behavior:

```text
Scan photo records.
For each photo with missing or invalid thumbnail, generate thumbnail.
Optionally allow rebuilding all thumbnails.
Show progress or simple result.
```

Keep it simple.

Do not build a complex job queue.

### 6.7 Missing file behavior

If original photo file is missing:

```text
do not crash
show a calm missing-file placeholder
do not delete metadata automatically
skip thumbnail generation for that photo
```

If thumbnail file is missing but original exists:

```text
fallback to original
allow Rebuild thumbnails to fix it
```

---

## 7. Performance requirements

Make photo-heavy pages more responsive.

Recommended improvements:

```text
Use thumbnail URLs for grids.
Avoid repeatedly loading full-size originals in grid views.
Avoid regenerating thumbnails on every render.
Cache or memoize computed local file URLs where appropriate.
Avoid unnecessary DB reads inside per-photo render loops.
```

Do not add heavy dependencies unless truly necessary.

Do not implement virtualized grids unless the current app becomes unusable and the implementation is simple.

---

# Part B — Local Library Management

## 8. Goal

Make the user-controlled local Library easier to understand and manage.

The user should feel:

```text
My Footprint data lives in this folder.
I can open it.
I can switch it.
I can put it on a mobile hard drive.
I can create another Library if I want.
```

This is not a backup/restore version.

This is Library management.

---

## 9. Settings: Local Library section

Add or polish a Settings section:

```text
Local Library
Footprint stores your journeys and photos in a folder you control.
```

Show:

```text
Current Library
/path/to/Footprint Library
```

Actions:

```text
Open Library Folder
Change Library
Create New Library
Open Existing Library
Rebuild Thumbnails
```

Optional action if already easy:

```text
Reveal Database File
```

Do not add:

```text
Cloud sync
Login
Backup restore
AI settings
```

### 9.1 Browser mode behavior

If not running in desktop/Tauri mode:

Show a quiet message:

```text
Local Library management is available in the desktop app.
```

Do not show broken desktop-only buttons in browser mode.

---

## 10. Recent Libraries

Add a small recent Libraries list if feasible.

Recommended:

```text
Recent Libraries
- D:/Footprint Library
- E:/Travel Memories
```

Behavior:

```text
Click a recent Library to open it.
If path no longer exists, show a calm error and allow removing it from recent list.
```

Store recent Library paths in local app config / Tauri store.

Do not store recent Libraries in the Library database itself.

Keep list small:

```text
max 5
```

Do not over-engineer.

---

## 11. Library validation

When opening/changing Library, validate:

```text
folder exists
can read folder
can write folder
footprint.db exists or can be created
photos/ exists or can be created
thumbnails/ exists or can be created
schema version is compatible
```

If the Library is invalid, show a calm message.

Do not delete anything automatically.

### 11.1 Valid Library states

Support:

```text
New empty folder
Existing valid Footprint Library
Existing folder missing thumbnails/ but has footprint.db/photos/
```

If optional folders are missing, create them.

### 11.2 Invalid Library states

Handle calmly:

```text
permission denied
folder missing
selected file instead of folder
database cannot open
schema too new
photos folder cannot be created
```

Show human-readable messages.

---

## 12. Switch Library behavior

Changing Library should:

```text
close current Library connection if needed
open selected Library
load Journeys from selected Library
update current Library path
add to recent Libraries
refresh Home
```

Changing Library must not:

```text
delete current Library
merge Libraries automatically
migrate data automatically
upload data
```

This is just switching active source.

---

## 13. Create New Library behavior

Create New Library should:

```text
let user select or create a folder
initialize footprint.db
create photos/
create thumbnails/
optionally create exports/
optionally create backups/ but do not build backup system
set as current Library
add to recent Libraries
load empty Home
```

If the folder already contains a Footprint Library, treat it as opening existing Library or ask gently.

---

## 14. Open Library Folder

`Open Library Folder` should open the current Library in the OS file explorer.

Use Tauri opener / shell plugin if already available.

Make sure required permissions are configured.

If it fails, show a calm error.

---

# Part C — Desktop Packaging & Open Source Readiness

## 15. Goal

Prepare the project to be built, installed, and open-sourced.

This does not need signed production releases yet.

It should make the repo clearer and the app more shippable.

---

## 16. Desktop app identity

Check and polish desktop app metadata:

```text
App name: Footprint
Window title: Footprint
Bundle identifier: suitable stable id
Icon placeholder or actual icon if one already exists
```

Do not spend too much time designing icon art.

If there is no icon, use a simple placeholder and document that final icon is TODO.

---

## 17. Package scripts

Ensure useful scripts exist in `package.json`:

```json
{
  "scripts": {
    "desktop:dev": "...",
    "desktop:build": "..."
  }
}
```

Use the correct Tauri command for the current setup.

Existing web commands must still work:

```text
npm run dev
npm run lint
npm run typecheck
npm run build
```

---

## 18. Desktop build

Run and fix:

```bash
npm run desktop:build
```

If the environment cannot fully package for the current OS, report clearly.

The goal is:

```text
At least desktop dev works.
Desktop build is attempted and documented.
Build blockers are explicit.
```

Do not fake success.

---

## 19. README update

Update README or create one if missing.

README should include:

```text
What Footprint is
Local-first/offline-first philosophy
No cloud, no login
What a Footprint Library is
How to run web dev
How to run desktop dev
How to build desktop app
Where data is stored
How photos are stored
Privacy note
Current status / known limitations
```

Keep it clear and beginner-friendly.

Suggested README copy direction:

```text
Footprint is a calm, local-first travel photo memory app.
Your journeys, notes, categories, and photos live in a Library folder you control.
You can keep that Library on your computer, external drive, or a synced folder you trust.
Footprint does not require login and does not upload your photos to a cloud service.
```

---

## 20. Local Library documentation

Add a docs file if there is a `docs/` folder.

Suggested file:

```text
docs/LOCAL_LIBRARY.md
```

Include:

```text
Library folder structure
footprint.db purpose
photos/ purpose
thumbnails/ purpose
relative paths
moving Library to external drive
what not to delete manually
what to do if thumbnails are missing
```

---

## 21. Privacy documentation

Add or update a privacy/local-first note.

Possible file:

```text
docs/PRIVACY.md
```

Include:

```text
No login
No cloud upload
Photos stay local
AI features are not part of this version
Future AI/network features should be explicit and optional
```

Do not over-promise security features that do not exist.

Be honest.

---

## 22. Developer setup documentation

README should include:

```bash
npm install
npm run dev
npm run desktop:dev
npm run lint
npm run typecheck
npm run build
npm run desktop:build
```

Also mention any required desktop prerequisites if known:

```text
Rust
Tauri prerequisites
platform-specific dependencies
```

Keep it concise.

---

## 23. Open-source readiness

Add or verify:

```text
.gitignore covers build artifacts and local Library data
README does not include private paths
No API keys or secrets
No sample personal photos committed
No generated desktop build artifacts committed unless intentionally tracked
```

If there is no license, do not invent one without user confirmation.

Instead add a README note:

```text
License: TBD
```

or leave it unchanged.

Do not choose MIT/Apache/GPL automatically.

---

# Part D — Integration Requirements

## 24. Keep the UX calm

Even though this version is large, it should not make the app feel technical.

For user-facing UI:

```text
avoid scary database wording unless in docs
avoid admin-dashboard panels
avoid too many buttons on Home
keep Library management mostly in Settings
keep Home focused on memories
```

Settings can be more technical, but still calm.

---

## 25. Suggested implementation order

Implement in this order:

```text
1. Inspect current Tauri/desktop/Library implementation.
2. Add or verify thumbnail_relative_path support.
3. Implement thumbnail generation for new photo imports.
4. Update UI to use thumbnails in grids and original in Lightbox.
5. Add Rebuild Thumbnails action.
6. Add Local Library Settings section.
7. Add Open / Change / Create Library actions.
8. Add Recent Libraries if feasible.
9. Add Library validation.
10. Polish package scripts and Tauri metadata.
11. Update README and docs.
12. Run all checks.
13. Manually verify desktop flows.
```

Do not start with docs and skip functionality.

Functionality first, docs after.

---

## 26. Manual testing checklist

Use real desktop UI interaction.

### Thumbnail/performance

```text
Open desktop app.
Open or create a Library.
Create a Journey.
Upload multiple photos.
Confirm original photos are copied to photos/.
Confirm thumbnails are generated under thumbnails/.
Confirm photo grid uses thumbnails.
Open Lightbox and confirm original/full image still opens.
Delete or rename a thumbnail manually, then use Rebuild Thumbnails.
Confirm thumbnail is recreated.
```

### Library management

```text
Open Settings.
Confirm current Library path is visible.
Click Open Library Folder.
Confirm OS file explorer opens.
Create a new Library.
Confirm Home becomes empty or shows the new Library data.
Switch back to previous Library.
Confirm previous Journeys return.
Open a recent Library if implemented.
Try selecting an invalid folder if practical and confirm calm error.
```

### Packaging/readiness

```text
Run desktop dev.
Run desktop build.
Open README and confirm instructions are accurate.
Confirm docs describe local Library and privacy.
```

### Regression

```text
Home Recent / Timeline / Places still work.
Search still works.
New Journey still works.
Edit Journey still works.
Journey Detail still works.
Notes still work.
Categories still work.
China province + multi-city still works.
Trash still works.
No cloud/login/AI feature appears.
```

---

## 27. Required commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Run desktop commands:

```bash
npm run desktop:dev
npm run desktop:build
```

If command names differ, inspect `package.json` and use the correct commands.

If any command cannot run in the current environment, report:

```text
command
exact error
whether it is an environment limitation or code issue
what remains to fix
```

Do not claim build success without running commands.

---

## 28. Acceptance criteria

This version is complete only if:

```text
1. New imported photos get thumbnails or safe fallback.
2. Thumbnail paths are saved and used in grid views.
3. Missing thumbnails can be rebuilt.
4. Settings shows current Library.
5. User can open/change/create Library from UI.
6. Library paths remain local and user-controlled.
7. Desktop scripts are available and documented.
8. README explains local-first desktop usage.
9. Local Library docs exist or README clearly covers it.
10. Privacy/local-first note exists.
11. No cloud/login/AI feature was added.
12. Existing core Journey flows still work.
```

---

## 29. Final report format

After implementation, report:

```text
## Summary
...

## Files changed
...

## Thumbnail system
...

## Library management
...

## Desktop packaging/readiness
...

## Documentation updates
...

## Manual verification
...

## Commands run
- npm run lint: ...
- npm run typecheck: ...
- npm run build: ...
- npm run desktop:dev: ...
- npm run desktop:build: ...

## Remaining issues / follow-ups
...
```

Be honest about anything incomplete.

---

## 30. Final reminder

This is a v2.1 push.

Implement:

```text
Thumbnail & Performance
Local Library Management
Desktop Packaging & Open Source Readiness
```

Do not implement:

```text
backup/restore
full migration polish
cloud
login
AI
map
export/share
timeline expansion
```

Keep Footprint local-first, private, calm, photo-first, and suitable for long-term personal desktop use.