# FOOTPRINT v2.1.2 Import Progress & UI Responsiveness Hotfix Prompt

## 0. Context

Project: Footprint  
Repository: https://github.com/zhb2530545428-hue/footprint.git

Current product direction:

- Local-first / offline-first desktop app
- No cloud backend
- No login
- No photo upload to cloud
- Source of truth is the local Footprint Library
- Photos live in `Library/photos`
- Thumbnails live in `Library/thumbnails`
- SQLite stores Journey / Photo metadata and relative paths

v2.1 Desktop Production Push has already been completed and accepted.

A v2.1.1 photo import performance hotfix was attempted. It improved the first visible response: after selecting photos, the upload/import appears to start quickly. However, the app then becomes extremely laggy or nearly unusable while it continues processing.

This means the current import pipeline still monopolizes the UI/runtime after selection. We now need a focused v2.1.2 hotfix.

---

## 1. Version Name

Implement:

```text
v2.1.2 Import Progress & UI Responsiveness Hotfix
```

This is a hotfix, not a feature expansion.

---

## 2. User-Reported Problem

When creating a new Journey and uploading photos:

```text
The photos now appear to start uploading quickly after selecting them,
but right after that, the app becomes very laggy / almost frozen.
The user cannot comfortably interact with the app.
The user also has no clear idea how much work is still happening.
```

This is unacceptable for Footprint because uploading photos is a core flow.

---

## 3. Goal

The goal is not only to show a progress bar.

The goal is:

```text
When importing photos, the app must remain responsive,
and the user must clearly see what stage the import is in,
how many photos are done,
how many are still pending,
and whether thumbnails are still being processed.
```

Target behavior:

```text
1. User selects photos.
2. UI responds immediately.
3. A calm import progress panel appears.
4. The user sees progress like "Saving originals 3 / 10".
5. If thumbnails are still being generated, the UI says that clearly.
6. The app must not freeze while import/thumbnail work continues.
7. Archive / Save behavior must be safe and understandable.
```

---

## 4. Strict Scope

Only fix import progress, perceived responsiveness, and import status clarity.

### Allowed

- Add import progress state.
- Add progress bar / progress panel UI.
- Add per-file import status if useful.
- Add progress callbacks to photo repository APIs.
- Slow down / throttle / queue heavy import work so the UI stays responsive.
- Split original-photo saving progress from thumbnail-generation progress.
- Improve user-facing copy during import.
- Disable Archive / Save only when required for data safety.
- Allow editing once originals are safely saved, even if thumbnails are still being generated.
- Add small helper utilities/hooks/components if needed.
- Update README or docs only if useful for explaining local import behavior.

### Not Allowed

Do **not** implement:

- v2.2 backup/restore
- cloud backup
- remote sync
- login
- Supabase / Firebase / Cloudflare
- AI photo picking
- AI captions
- map / GPS / route
- export / share
- full migration polish
- multi-device merge
- collaboration
- large UI redesign
- unrelated refactors

---

## 5. First Required Step: Inspect Current Import Pipeline

Before editing, inspect the current code and identify the real bottleneck.

Focus on these files first:

```text
app/journeys/new/page.tsx
app/journeys/[id]/edit/page.tsx
lib/data/desktopLibraryRepository.ts
lib/data/browserRepository.ts or equivalent browser repo files
lib/data/types.ts
lib/desktop/tauri-bridge.ts
src-tauri/src/lib.rs
components/PhotoTile.tsx
components/PhotoGrid.tsx
```

Look for:

```text
- Where File objects are received.
- Where object URLs / immediate previews are created.
- Where desktopPhotoRepo.savePhotos is called.
- Whether savePhotos waits for thumbnail generation.
- Whether thumbnails are generated sequentially or concurrently.
- Whether any Promise.all is launching too much heavy work at once.
- Whether progress state exists already.
- Whether state updates are causing excessive re-renders.
- Whether large file.arrayBuffer() calls happen on the renderer thread.
- Whether thumbnail generation blocks Archive / Save.
```

Do not guess. Confirm the actual current state from the code.

---

## 6. Required UX Behavior

### 6.1 New Journey Upload UX

When the user uploads photos on the New Journey page:

1. The selected photos should appear in the UI quickly.
2. Immediately show an import progress panel near the upload area or photo grid.
3. The panel should show:
   - Current stage
   - Progress bar
   - `completed / total`
   - Current file name, if available
   - Failed count, if any
4. The user should not stare at a frozen app.
5. Archive button behavior:
   - Disable Archive only while original files are still being copied/saved.
   - The disabled state must explain why:
     ```text
     Saving photos… 4 / 10
     ```
   - Once original files are safely stored and metadata is ready, Archive can be enabled.
   - Thumbnail generation should not block Archive unless the current architecture absolutely requires it.
6. If thumbnails continue in the background, show:
   ```text
   Optimizing previews… you can continue editing.
   ```

### 6.2 Edit Journey Upload UX

When the user uploads photos on the Edit Journey page:

1. Existing photos should remain usable.
2. Newly selected photos should appear quickly with a local preview or placeholder.
3. Show an import progress panel in the Organize Photos / upload area.
4. Save button behavior:
   - Disable Save only while original files are still being copied/saved.
   - Do not block Save just because thumbnails are still generating, unless technically unavoidable.
5. If import fails for one photo, existing Journey data must remain safe.

### 6.3 Progress Panel Copy

Use calm, simple wording consistent with Footprint.

Recommended stages:

```text
Preparing photos…
Saving originals…
Optimizing previews…
Finishing up…
Import complete
Some photos could not be imported
```

Examples:

```text
Saving originals… 3 / 10
Optimizing previews… 6 / 10
Import complete — 10 photos added
8 photos added, 2 failed
```

Avoid noisy technical copy like:

```text
Invoking Rust command...
SQLite transaction pending...
Blob arrayBuffer processing...
```

---

## 7. Required Technical Design

### 7.1 Add a Shared Import Progress Model

Create or extend a shared type, for example:

```ts
export type PhotoImportPhase =
  | "idle"
  | "preparing"
  | "saving-originals"
  | "generating-thumbnails"
  | "finalizing"
  | "complete"
  | "error";

export type PhotoImportFileStatus =
  | "queued"
  | "saving-original"
  | "original-saved"
  | "generating-thumbnail"
  | "ready"
  | "error";

export interface PhotoImportProgress {
  phase: PhotoImportPhase;
  total: number;
  completedOriginals: number;
  completedThumbnails: number;
  failed: number;
  currentFileName?: string;
  percent: number;
  canSafelySaveJourney: boolean;
  message: string;
}
```

The exact shape can differ, but the implementation must support:

```text
- Original-save progress
- Thumbnail progress
- Failed count
- Current file
- A boolean that tells New/Edit pages whether Archive/Save is safe
```

### 7.2 Add Progress Callback Support to Photo Repository

Extend the photo repository interface in a backward-compatible way.

Example:

```ts
export interface SavePhotosOptions {
  onProgress?: (progress: PhotoImportProgress) => void;
  deferThumbnails?: boolean;
}

savePhotos(
  journeyId: string,
  files: { id: string; file: File }[],
  options?: SavePhotosOptions
): Promise<JourneyPhoto[]>;
```

Requirements:

```text
- Browser repo must still work.
- Desktop repo must report meaningful progress.
- Existing call sites must not break.
- TypeScript must pass.
```

### 7.3 Original Saving and Thumbnail Generation Must Be Separate Stages

The import flow should distinguish:

```text
Stage A: save/copy original photo files
Stage B: generate thumbnails
```

The UI should reflect both.

Important rule:

```text
Original file saving is required before Archive / Save.
Thumbnail generation is an optimization and should not freeze the app or block the user longer than necessary.
```

If the current architecture makes true background thumbnail generation difficult, implement the safest incremental version:

```text
- Generate thumbnails in a small queue.
- Yield to the UI between each thumbnail.
- Show thumbnail progress.
- Keep buttons/clicks responsive.
```

But do not leave the app frozen.

### 7.4 Use a Small Queue, Not Unlimited Promise.all

Do not import/process 10+ large photos with unbounded `Promise.all`.

Required:

```text
- Original file saving concurrency: 1 or 2
- Thumbnail generation concurrency: 1
```

Reason:

```text
Large photos can consume a lot of CPU, memory, and disk IO.
Footprint should feel calm and stable, not aggressive.
```

A simple queue utility is acceptable.

### 7.5 Yield to the UI Between Heavy Steps

After each file or each heavy stage, yield control back to the UI.

Acceptable approaches:

```ts
await new Promise((resolve) => setTimeout(resolve, 0));
```

or:

```ts
await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
```

Use this after:

```text
- Each original file copy/save completes
- Each thumbnail completes
- Any large state update
```

This is required because the current problem is not only total time; it is UI responsiveness.

### 7.6 Throttle Progress Updates

Do not call React `setState` hundreds of times during import.

Required:

```text
- Progress updates should be per file or throttled.
- Avoid progress update storms.
- Avoid re-rendering the entire photo grid repeatedly.
```

A simple throttle interval is enough:

```text
100–250ms
```

or per file completion.

### 7.7 Avoid Freezing the Renderer With Huge file.arrayBuffer() Bursts

Inspect whether the current desktop import path does:

```ts
const buffer = await file.arrayBuffer();
```

for each selected file.

If this is still necessary, ensure:

```text
- It runs one file at a time or with very low concurrency.
- Progress updates happen before and after it.
- The UI yields between files.
```

If Tauri file picker paths are available and safer, prefer direct Rust-side copy from source path to Library path. But do not do a large architecture rewrite unless it is straightforward.

### 7.8 Thumbnail Generation Must Not Monopolize the App

If thumbnails are generated through Rust commands, still treat them as heavy work.

Required:

```text
- Generate one thumbnail at a time.
- Show "Optimizing previews… x / y".
- Yield after each thumbnail.
- If a thumbnail fails, keep the original photo and continue.
- Do not fail the whole import because of one thumbnail.
```

### 7.9 Failure Handling

If one photo fails:

```text
- Mark that photo as failed.
- Continue importing the rest.
- Show failed count.
- Do not crash the app.
- Do not lose already imported photos.
- Do not create fake successful records for missing files.
```

User-facing copy:

```text
8 photos added, 2 failed.
```

Optional per-file failed state is allowed but not required.

---

## 8. Required UI Components

Create a reusable component if useful:

```text
components/ImportProgress.tsx
```

or:

```text
components/PhotoImportProgress.tsx
```

The component should be visually consistent with Footprint:

```text
calm
low-density
rounded corners
subtle border
soft background
small progress bar
clear text
not dashboard-like
not noisy
```

Suggested layout:

```text
[Saving originals… 4 / 10]
[████████░░░░░░░░] 40%
Currently: IMG_2031.jpg
```

When thumbnails are in progress:

```text
Optimizing previews… 6 / 10
You can continue editing while Footprint prepares faster previews.
```

When done:

```text
Import complete — 10 photos added.
```

The completed state may fade away after a short delay, but do not make it disappear instantly.

---

## 9. Required Page Integration

### 9.1 New Journey Page

Integrate progress UI into:

```text
app/journeys/new/page.tsx
```

Requirements:

```text
- Show progress immediately after file selection.
- Keep selected photos visible.
- Disable Archive while original saving is incomplete.
- Use progress.canSafelySaveJourney or equivalent.
- Show clear button text while disabled.
- Do not block Archive on thumbnail generation if originals are ready.
- Make sure category assignment, cover selection, highlights, notes still work.
```

### 9.2 Edit Journey Page

Integrate progress UI into:

```text
app/journeys/[id]/edit/page.tsx
```

Requirements:

```text
- Show import progress when adding more photos.
- Existing photos remain visible and usable.
- Disable Save only while original saving is incomplete.
- Do not break delete / cover / highlight / category / note behavior.
```

---

## 10. Data Safety Requirements

Do not create inconsistent Journey records.

Required:

```text
- If a photo appears as successfully imported, its original file must exist in Library/photos.
- If thumbnail generation fails, original file must still work.
- If import is interrupted, already saved originals should not corrupt existing Journey data.
- Saving a Journey must not reference files that were never copied.
```

For New Journey:

```text
- If photos are preview-only and original saving is not done, Archive must stay disabled.
- Once originals are saved, Archive can proceed even if thumbnails are pending.
```

For Edit Journey:

```text
- Do not overwrite the existing Journey with broken photo records.
- If new photo import fails, existing Journey remains intact.
```

---

## 11. Browser Mode Compatibility

Do not break browser mode.

If browser mode still uses localStorage / IndexedDB:

```text
- It should still show progress.
- It can use the same progress component.
- Original saving maps to IndexedDB blob saving.
- Thumbnail stage can be skipped or reported as complete if not applicable.
```

If browser mode does not support desktop Library features, it should still not crash.

---

## 12. Acceptance Criteria

The implementation is not complete unless all of the following are true.

### 12.1 Manual UX Test

Run the desktop app and test with at least:

```text
10 normal phone photos
```

Preferably also test with:

```text
20 photos if available
```

Test flow:

```text
1. Start desktop app.
2. Create New Journey.
3. Select at least 10 photos.
4. Confirm progress panel appears immediately.
5. Confirm progress advances through original saving.
6. Confirm app remains clickable/responsive during import.
7. Confirm Archive is disabled only while originals are not safely saved.
8. Confirm Archive becomes available when originals are ready.
9. Confirm thumbnail generation either finishes or continues with clear status.
10. Confirm Journey opens after Archive.
11. Confirm photos persist after app refresh/restart.
12. Confirm Library/photos contains originals.
13. Confirm Library/thumbnails contains generated thumbnails when successful.
```

### 12.2 Responsiveness Requirement

During import:

```text
- The user should still be able to scroll.
- Buttons should hover/click normally unless intentionally disabled.
- Text fields should not freeze for seconds at a time.
- The progress bar should update.
```

If the app still freezes, the task is not done.

### 12.3 Failure Test

Test with one problematic file if possible.

Expected:

```text
- One failed photo does not fail the entire batch.
- Progress panel shows failed count.
- Successfully imported photos remain usable.
```

### 12.4 Regression Test

Confirm no regressions in:

```text
- New Journey creation
- Edit Journey
- Cover photo selection
- Highlights
- Custom categories
- Photo notes
- Lightbox
- Home Recent / Timeline / Places
- Settings Local Library section
```

---

## 13. Required Commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
npm run desktop:dev
npm run desktop:build
```

If a command does not exist, inspect `package.json` and run the closest equivalent.

Do not claim success unless commands were actually run.

If any command fails, report:

```text
- Which command failed
- Exact error summary
- Whether the failure is related to this hotfix
- What remains to be fixed
```

---

## 14. Required Final Report

After implementation, report clearly:

```text
1. What was causing the lag/freeze.
2. What files were changed.
3. How import progress is modeled.
4. How original saving progress differs from thumbnail progress.
5. Whether Archive/Save blocks on originals only or thumbnails too.
6. How UI responsiveness was protected.
7. Manual test results with 10 photos.
8. lint/typecheck/build/desktop build results.
9. Any remaining known limitations.
```

---

## 15. Important Principle

Do not only add a cosmetic progress bar.

The user specifically reported:

```text
The app becomes extremely stuck after upload starts.
```

So this hotfix must address both:

```text
1. Visibility: progress bar and clear status.
2. Responsiveness: queueing, throttling, yielding, and not overloading the renderer/runtime.
```

A progress bar on top of a frozen app is not acceptable.
