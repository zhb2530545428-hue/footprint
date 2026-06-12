# FOOTPRINT v2.1.1 Photo Import Performance Hotfix Prompt

> For Claude Code / Codex
>
> Repository: `https://github.com/zhb2530545428-hue/footprint.git`
>
> Version target: `v2.1.1 Photo Import Performance Hotfix`
>
> Product direction: local-first / offline-first desktop app. No cloud, no login, no remote sync.

---

## 0. Context

Footprint v2.1 Desktop Production Push is already implemented and the user is satisfied with it.

However, there is now a serious performance problem:

```text
When creating a new Journey and uploading only around 10 photos, the import/save process can take several minutes.
```

This is not acceptable for the core product experience. Before moving to v2.2, implement a focused v2.1.1 hotfix for photo import performance.

This version is not a feature expansion. It is a targeted performance and UX hotfix.

---

## 1. Current product principles that must remain unchanged

Footprint is:

```text
calm
personal
memory-first
photo-first
low-density
private by default
local-first
offline-first
open-source friendly
```

Do not turn it into:

```text
a cloud photo app
a SaaS product
a social album
a dashboard-heavy admin tool
an AI-first product
```

The current direction is:

```text
Footprint Desktop
Local Library folder
SQLite database
Local photos folder
Local thumbnails folder
No login
No cloud backend
No photo upload to cloud
```

---

## 2. Scope of v2.1.1

Only fix photo import performance and the related user feedback loop.

### Must do

```text
1. Make selecting / dropping 10 photos show previews immediately.
2. Make Archive Journey / Save Changes stop waiting for thumbnail generation.
3. Split original photo copy from thumbnail generation.
4. Copy original photos first, save Journey metadata, then generate thumbnails in the background.
5. Add a small bounded queue for expensive file / thumbnail operations.
6. Make thumbnail generation non-blocking and failure-tolerant.
7. Reduce thumbnail size / quality to something appropriate for grids.
8. Add minimal calm UI feedback for import/save status and errors.
9. Keep browser mode working.
10. Preserve existing v2.1 Desktop Library behavior.
11. Run real lint/typecheck/build/desktop validation.
```

### Must not do

```text
backup/restore
full migration polish
AI photo picking
AI caption
AI recap
OpenAI API settings
map
GPS
route view
photo-level EXIF timeline
export/share
PDF/Markdown export
cloud backend
Supabase
Firebase
Cloudflare backend
login
user account
remote sync
multi-device merge
payment
collaboration
large UI redesign
```

---

## 3. Important current-code observations

Before changing code, inspect the current repository.

Pay special attention to these files:

```text
app/journeys/new/page.tsx
app/journeys/[id]/edit/EditJourneyClient.tsx
lib/data/types.ts
lib/data/repositoryFactory.ts
lib/data/desktopLibraryRepository.ts
lib/data/localBrowserRepository.ts
lib/desktop/tauri-bridge.ts
src-tauri/src/lib.rs
components/UploadDropzone.tsx
components/PhotoGrid.tsx
components/PhotoTile.tsx
components/PhotoLightbox.tsx
components/Settings or Settings-related Local Library files
```

Current known shape:

```text
- New Journey and Edit Journey already create temporary URL.createObjectURL previews.
- New Journey and Edit Journey already use getJourneyRepo() / getPhotoRepo().
- Desktop photo saving currently copies photos into the Library.
- Desktop photo saving currently also generates thumbnails inside savePhotos.
- In desktop mode, savePhotos appears to process files sequentially.
- The current savePhotos call only returns after original copy + thumbnail generation are done.
```

The main hotfix is therefore not to re-introduce old storage, and not to rewrite everything.

The main hotfix is:

```text
Do not block Archive / Save on thumbnail generation.
```

---

## 4. Target user experience

### 4.1 New Journey upload

When the user selects or drops photos:

```text
- Photo tiles should appear immediately using temporary object URLs.
- The user should be able to set cover, highlights, notes, and categories without waiting for disk writes.
- The page should not freeze.
- The UI should remain calm and low-density.
```

When the user clicks `Archive Journey`:

```text
- Original photos are copied into the Library/photos folder.
- Journey metadata is saved to SQLite.
- The user can navigate to the Journey detail page after original files and Journey metadata are safely saved.
- Thumbnail generation must not block navigation.
- Thumbnails are generated in the background and recorded in SQLite when ready.
- If thumbnails are not ready yet, grids fall back to original image URLs.
```

### 4.2 Edit Journey upload

When the user adds more photos in Edit Journey:

```text
- New photos should appear immediately as local previews.
- Save Changes should copy original files and update Journey metadata.
- Save Changes must not wait for thumbnail generation.
- Thumbnail generation continues in the background.
- Existing notes/categories/cover/highlight behavior must not regress.
```

### 4.3 Error behavior

```text
- If one photo fails to copy, show a clear but calm error.
- One failed photo should not silently corrupt the entire Journey.
- Do not leave broken DB rows pointing to files that were never copied.
- Thumbnail failure should never fail the whole import.
- Missing thumbnail should simply fall back to the original photo.
- Missing original photo should still use the existing calm missing-file placeholder behavior.
```

---

## 5. Performance target

Use these targets as practical goals, not fake hardcoded numbers:

```text
Selecting/dropping 10 photos:
- previews should appear almost immediately, ideally under 1 second on a normal machine.

Archiving/saving 10 normal phone photos:
- should only wait for original file copy + DB save.
- should not wait for thumbnails.
- should feel like seconds, not minutes.

Thumbnail generation:
- may continue after navigation.
- must not freeze the UI.
```

Add lightweight timing logs during development if helpful, but do not leave noisy debug logs in production UI.

Recommended development logging format:

```text
[photo-import] copied 10 originals in XXXXms
[photo-import] queued 10 thumbnails
[thumbnail-queue] generated 10 thumbnails in XXXXms
```

Keep logs minimal and remove or guard them before final delivery.

---

## 6. Required implementation details

### 6.1 Do not block `savePhotos` on thumbnails

In `lib/data/desktopLibraryRepository.ts`, change desktop `photoRepo.savePhotos` so that it only performs the minimum required synchronous work:

```text
1. Copy original image file into Library/photos/<journeyId>/.
2. Return a hydrated JourneyPhoto with:
   - id
   - url using convertFileSrc(original absolute path)
   - fileName
   - categoryId fallback
   - createdAt
   - _relativePath
3. Do not await thumbnail generation before returning.
```

Current bad shape to avoid:

```ts
for each file:
  copy original
  await generate_thumbnail(...)
  push result
return results
```

New target shape:

```ts
const savedPhotos = await copyOriginalsWithBoundedConcurrency(...)
queueThumbnailGeneration(journeyId, savedPhotos)
return savedPhotos
```

Or:

```ts
const savedPhotos = await copyOriginalsWithBoundedConcurrency(...)
return savedPhotos
```

and call thumbnail queue after `saveJourney` / `updateJourney` has written the DB rows.

Prefer the second approach if it makes DB updates cleaner:

```text
1. savePhotos copies originals and returns photo metadata.
2. saveJourney/updateJourney writes DB rows with no thumbnail path yet.
3. A background thumbnail queue generates thumbnails and updates thumbnail_relative_path for those rows.
```

Do not create DB rows for thumbnails before the Journey/photos have been saved.

---

### 6.2 Add a background thumbnail queue

Create a small, focused utility. Suggested file names:

```text
lib/desktop/thumbnailQueue.ts
```

or, if the repository structure makes that awkward:

```text
lib/data/desktopThumbnailQueue.ts
```

The queue should:

```text
- Be desktop-only.
- Be safe to call multiple times.
- Avoid duplicate work for the same photo ID while already queued/running.
- Use bounded concurrency, preferably 1 for thumbnail generation.
- Catch individual thumbnail errors.
- Never throw thumbnail errors into the main Archive/Save flow.
- Update SQLite with thumbnail_relative_path only after the file is successfully generated.
```

Suggested API:

```ts
export function queueThumbnailGeneration(args: {
  journeyId: string;
  photos: JourneyPhoto[];
}): void;
```

or:

```ts
export function queueThumbnailGeneration(
  journeyId: string,
  photos: JourneyPhoto[]
): void;
```

Implementation guidance:

```ts
const queuedPhotoIds = new Set<string>();
const runningPhotoIds = new Set<string>();

export function queueThumbnailGeneration(journeyId, photos) {
  for (const photo of photos) {
    if already has thumbnail -> skip
    if already queued/running -> skip
    enqueue task
  }
  drainQueueWithoutBlockingCaller();
}
```

Each task should:

```text
1. Resolve library path.
2. Read photo._relativePath.
3. Build source absolute path:
   <libraryPath>/<relativePath>
4. Build thumbnail relative path:
   thumbnails/<journeyId>/<photoId>.jpg
5. Build destination absolute path:
   <libraryPath>/<thumbnailRelativePath>
6. Call generate_thumbnail(sourceAbs, destAbs).
7. On success, update SQLite:
   UPDATE photos
   SET thumbnail_relative_path = ?, updated_at = ?
   WHERE id = ? AND journey_id = ?
8. On failure, log quietly and continue.
9. Remove photoId from queued/running sets in finally.
```

Do not update React state from this queue unless there is already a clean global event mechanism. It is acceptable for thumbnails to appear after reload/navigation, because original image fallback already works.

If adding a lightweight event is easy and safe, it may be used, but do not overbuild.

---

### 6.3 Add bounded concurrency for original copy

Original file copy should not be fully sequential if that is causing slowness, but it should also not launch 30 huge files at once.

Add or reuse a small concurrency helper. Suggested file:

```text
lib/utils/asyncQueue.ts
```

Suggested helper:

```ts
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  // preserve result order
}
```

Use it in desktop `savePhotos`:

```text
- Original copy concurrency: 2 or 3.
- Thumbnail concurrency: 1, maybe 2 at most.
```

Do not use unbounded `Promise.all` for decoding/resizing large images.

Do not keep the old fully sequential thumbnail-generating loop.

---

### 6.4 Reduce thumbnail size and quality

In `src-tauri/src/lib.rs`, inspect the `generate_thumbnail` command.

If it currently generates a very large thumbnail, reduce it.

Recommended target:

```text
long edge: 640px
quality: around 78-82 for JPEG
format: keep current jpg unless WebP support is already stable
```

Rules:

```text
- Lightbox must still use original images.
- Grid/Home/Highlights/Edit can use thumbnails when available.
- Thumbnail generation should create parent directories if needed.
- Thumbnail generation failure should return an error to the queue, but the queue must swallow it and continue.
```

Do not increase thumbnail size above the existing value.

Do not store thumbnail binary data in SQLite.

---

### 6.5 Keep browser mode working

Browser mode must not break.

If the thumbnail queue is desktop-only, make sure browser mode either:

```text
- never imports/calls it, or
- has a safe no-op fallback.
```

`localBrowserRepository` can keep existing behavior unless it is clearly involved in the slowdown.

Do not remove browser fallback just because desktop is the long-term direction.

---

### 6.6 Preserve temporary preview behavior

New Journey and Edit Journey already create local preview photos using `URL.createObjectURL(file)`.

Do not remove this behavior.

Check both files:

```text
app/journeys/new/page.tsx
app/journeys/[id]/edit/EditJourneyClient.tsx
```

Required behavior:

```text
- Selected files appear immediately.
- Pending files stay in pendingFilesRef until Archive/Save.
- User-edited metadata from preview photos is merged into saved photos.
- Cover/highlight/note/category choices survive the save process.
- Blob URLs are revoked when safe.
```

Be careful:

```text
- Do not revoke object URLs before the save flow has merged metadata.
- Do not accidentally lose cover/highlight/note/category data when replacing preview photos with saved photos.
```

---

### 6.7 Add minimal import status UI only where helpful

The user needs feedback, but Footprint should stay calm.

Acceptable UI:

```text
- Button text: “Saving originals…” instead of generic “Archiving…” if helpful.
- Small helper text under upload area:
  “Photos appear immediately. Originals are saved locally when you archive.”
- If background thumbnails are still being generated, no loud progress dashboard is needed.
```

Optional internal/transient photo fields:

```ts
_importStatus?: "preview" | "saving" | "saved" | "failed";
_importError?: string;
```

Rules:

```text
- Prefix transient UI-only fields with _ if added to JourneyPhoto objects.
- Do not persist transient import status into SQLite.
- Do not add a complex upload manager.
- Do not redesign PhotoGrid.
```

---

### 6.8 Avoid fake fixes

Do not solve this by:

```text
- hiding the spinner
- disabling thumbnail generation entirely without replacement
- skipping original file copy
- pretending save succeeded before originals are safely copied
- swallowing original-copy errors
- storing photos as base64
- storing photo binary in SQLite
- moving back to localStorage/IndexedDB for desktop
- uploading photos to cloud
```

The correct behavior is:

```text
Originals must be safely copied before the Journey is considered archived/saved.
Thumbnails can be generated later.
```

---

## 7. Suggested code-level plan

Follow this order.

### Step 1 — Baseline inspection

Run:

```bash
npm install
npm run lint
npm run typecheck
npm run build
```

Also check available scripts:

```bash
cat package.json
```

If scripts differ, use the actual script names.

Then inspect:

```text
lib/data/desktopLibraryRepository.ts
src-tauri/src/lib.rs
app/journeys/new/page.tsx
app/journeys/[id]/edit/EditJourneyClient.tsx
```

Document in your final report:

```text
- where the slow path was
- whether thumbnail generation was blocking savePhotos
- whether savePhotos was sequential
```

---

### Step 2 — Add concurrency helper

Create a small helper such as:

```text
lib/utils/asyncQueue.ts
```

Requirements:

```text
- typed TypeScript
- no external dependency
- preserves result order
- handles empty arrays
- propagates worker errors for original-copy tasks
```

Use it only where useful.

---

### Step 3 — Change desktop original photo saving

In `desktopPhotoRepo.savePhotos`:

```text
- Copy originals with bounded concurrency.
- Return saved JourneyPhoto objects as soon as originals are copied.
- Do not generate thumbnails inline.
- Make sure temp files are cleaned up even on error.
- Make sure relative paths and convertFileSrc URLs remain correct.
```

Expected rough shape:

```ts
async savePhotos(journeyId, files) {
  const libPath = requireLibraryPath();

  return mapWithConcurrency(files, 2, async ({ id, file }) => {
    const tempPath = await writeTempFile(file);
    try {
      const relativePath = await copy_photo_to_library(
        tempPath,
        libPath,
        journeyId,
        id
      );
      const absolutePath = `${libPath}/${relativePath}`;

      return {
        id,
        url: convertFileSrc(absolutePath),
        fileName: file.name,
        isCover: false,
        isHighlight: false,
        categoryId: "default-other",
        hasNote: false,
        createdAt: new Date().toISOString(),
        _relativePath: relativePath,
      };
    } finally {
      await deleteTempFile(tempPath).catch(() => {});
    }
  });
}
```

Adjust names/types to match the actual code.

---

### Step 4 — Add thumbnail queue

Create a desktop thumbnail queue.

Requirements:

```text
- queueThumbnailGeneration(journeyId, photos)
- desktop-only or safe no-op outside desktop
- concurrency 1 for thumbnail generation
- skip photos without _relativePath
- skip photos already having _thumbnailRelativePath
- update SQLite after thumbnail generation succeeds
- do not throw to UI
- catch per-photo errors
- avoid duplicate tasks
```

Important:

```text
The queue should run after the photo DB rows exist.
```

Therefore call it after:

```text
- getJourneyRepo().saveJourney(journey)
- getJourneyRepo().updateJourney(updated)
```

Do not await it in the main Archive/Save path.

Suggested call pattern:

```ts
await getJourneyRepo().saveJourney(journey);
queueThumbnailGeneration(journey.id, savedPhotos);
router.push(`/journeys/${journey.id}`);
```

or:

```ts
await getJourneyRepo().updateJourney(updated);
queueThumbnailGeneration(journey.id, savedPhotos);
router.push(`/journeys/${journey.id}`);
```

Use `void queue...` if the function returns a promise, but prefer a non-async public function that starts the queue internally.

---

### Step 5 — New Journey integration

In:

```text
app/journeys/new/page.tsx
```

Ensure:

```text
- preview still appears immediately on file selection
- Archive Journey only waits for original copy + DB save
- after saveJourney, start thumbnail queue without awaiting it
- router.push happens after originals and DB are safe, not after thumbnails
- if original copy fails, show Archive failed message and clean up copied originals
- if thumbnail generation fails, do not show Archive failed
```

Keep current user metadata merge logic:

```text
cover
highlight
note
hasNote
categoryId
```

Do not lose it.

---

### Step 6 — Edit Journey integration

In:

```text
app/journeys/[id]/edit/EditJourneyClient.tsx
```

Ensure:

```text
- added photos preview immediately
- Save Changes only waits for original copy + DB update
- after updateJourney, start thumbnail queue for newly saved photos only
- router.push happens after originals and DB are safe, not after thumbnails
- existing photos are not re-imported
- existing thumbnails are not regenerated on every save
```

Only queue thumbnails for newly saved photos that lack thumbnails.

---

### Step 7 — Rust thumbnail generation tuning

In:

```text
src-tauri/src/lib.rs
```

Find `generate_thumbnail`.

Tune it:

```text
- long edge around 640px
- JPEG quality around 80 if quality is configurable
- create parent directories before saving
- preserve aspect ratio
- avoid unnecessary work if destination thumbnail already exists and is valid, if easy
```

Do not make Rust generate thumbnails synchronously during the original copy command unless it returns immediately after copy.

---

### Step 8 — UI polish and error handling

Keep UI calm.

Possible copy changes:

```text
UploadDropzone helper:
“Photos appear immediately. Originals are saved locally when you archive.”
```

Archive/Save button text while saving:

```text
Saving originals…
```

or keep existing text if changing it causes noisy UI.

Do not add a dashboard/progress manager.

---

### Step 9 — Documentation and version cleanup

Update version references minimally:

```text
package.json version -> 2.1.1 if appropriate
README current status -> v2.1.1 Photo Import Performance Hotfix
CHANGELOG or docs if such file exists
```

If there is no changelog, do not create a huge one unless it fits the project style.

Add a short note in README or docs only if useful:

```text
Photo thumbnails are generated locally in the background after originals are saved.
```

Do not over-document internal implementation.

---

## 8. Manual verification requirements

You must actually test the user flow, not only compile.

### Required automated checks

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run desktop:dev
npm run desktop:build
```

If a command does not exist, report it clearly and use the closest available command.

If `desktop:build` fails due to environment-specific signing/bundling limitations, report the exact reason and confirm whether the app still compiles otherwise.

### Required manual desktop validation

In desktop mode:

```text
1. Open the app with npm run desktop:dev.
2. Choose or create a Footprint Library.
3. Create a new Journey.
4. Select 10 normal photos.
5. Confirm photo tiles appear immediately.
6. Set a cover photo.
7. Select a few highlights.
8. Add one note.
9. Archive the Journey.
10. Confirm Archive does not wait for all thumbnails.
11. Confirm the Journey detail page opens.
12. Confirm original photos are visible even before thumbnails finish.
13. Quit/restart the app.
14. Confirm the Journey and photos persist.
15. Inspect the Library folder:
    - footprint.db exists
    - photos/<journeyId>/ contains originals
    - thumbnails/<journeyId>/ eventually contains generated thumbnails
16. Add 3 more photos from Edit Journey.
17. Save Changes.
18. Confirm Save Changes is not blocked by thumbnail generation.
19. Confirm newly added photos persist after restart.
```

### Required regression validation

Check:

```text
- Existing Journey Detail still works.
- Existing Edit Journey still works.
- Cover photo behavior still works.
- Highlights still work.
- Photo notes still work.
- Category assignment still works.
- Lightbox still uses original images.
- Grid uses thumbnails when available and original fallback when not available.
- Missing thumbnail does not crash.
- Missing original still uses calm placeholder / existing fallback behavior.
- Browser mode still builds and does not import desktop-only code in a way that crashes.
```

---

## 9. Acceptance criteria

This hotfix is complete only if all are true:

```text
1. 10 selected photos appear immediately as previews.
2. Archive/Save waits for original copy + DB write only.
3. Archive/Save does not wait for thumbnail generation.
4. Thumbnail generation continues in the background.
5. Thumbnail success updates SQLite thumbnail_relative_path.
6. Thumbnail failure does not fail the Journey save.
7. Original copy failure still fails the save clearly.
8. Existing metadata merge behavior does not regress.
9. Browser mode still works.
10. lint/typecheck/build pass, or failures are clearly explained.
11. desktop:dev is manually verified.
12. desktop:build is attempted and result is reported.
13. Final report includes changed files and exact tests run.
```

---

## 10. Final report format

When finished, report in this format:

```text
## Summary
- ...

## Root cause
- ...

## Changed files
- path/to/file: what changed
- path/to/file: what changed

## Performance behavior after fix
- Selecting photos: ...
- Archive/Save: ...
- Thumbnail generation: ...

## Validation
- npm run lint: pass/fail
- npm run typecheck: pass/fail
- npm run build: pass/fail
- npm run desktop:dev: pass/fail/manual result
- npm run desktop:build: pass/fail/manual result

## Manual test result
- Created Journey with 10 photos: pass/fail
- Immediate preview: pass/fail
- Originals persisted in Library/photos: pass/fail
- Thumbnails generated in Library/thumbnails: pass/fail
- Restart persistence: pass/fail

## Remaining issues
- None
```

If something cannot be completed, explain exactly why and do not pretend it passed.

---

## 11. Priority reminder

The user reported that importing only about 10 photos can take several minutes.

Treat this as a core UX bug.

Do not proceed to v2.2 until this is fixed.

Do not expand scope.

