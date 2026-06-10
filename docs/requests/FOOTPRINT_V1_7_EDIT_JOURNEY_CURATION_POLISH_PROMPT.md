# Footprint v1.7 Edit Journey Curation Polish — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V1_7_EDIT_JOURNEY_CURATION_POLISH_PROMPT.md，然后按照里面的要求实现 Footprint v1.7。
这次只做 Edit Journey Curation Polish，不要扩大范围，不要提前实现 backlog 功能。
完成后运行 npm run lint、npm run typecheck、npm run build，并修复所有错误。
```

Repository:

```text
https://github.com/zhb2530545428-hue/footprint.git
```

---

## 1. Product context

Footprint is a personal travel photo memory app.

It is not a generic photo management backend, not a social album, and not a marketplace.

The product should feel:

```text
calm
personal
memory-first
photo-first
low-density
Airbnb-inspired
quiet
beautiful
not admin-dashboard-like
```

The user is satisfied with versions up to v1.6:

```text
v1: Basic Journey flow
v1.1: Local image persistence and editing
v1.2: Trash & Safe Delete
v1.3: Settings & Home Polish
v1.4: Custom Categories & Manual Organization
v1.4.1: Category Polish
v1.5: Photo Notes Polish, including Apple-like hover note card
v1.6: Journey Detail Memory Polish
```

Now implement:

```text
v1.7 Edit Journey Curation Polish
```

One-sentence goal:

```text
Make Edit Journey feel like a calm curation workspace for choosing cover, highlights, categories, and notes — not a dense admin editor.
```

Chinese product goal:

```text
把 Edit Journey 从“编辑表单 + 照片管理区”打磨成“安静、清楚、适合手动整理旅行记忆的工作台”。
```

---

## 2. Core product idea

The main Footprint flow should now feel like:

```text
New Journey
→ upload photos
→ Edit Journey: curate cover / highlights / categories / notes
→ Journey Detail: enjoy the memory page
→ Home: re-enter archived memories
```

v1.7 should improve the third step:

```text
Edit Journey: curate cover / highlights / categories / notes
```

This version should make manual curation clearer and more pleasant.

It should not add AI recommendation, automatic picking, or PK mode.

The product philosophy remains:

```text
The user decides.
```

Future AI or automatic selection can come later, but not in v1.7.

---

## 3. Scope of v1.7

This version focuses mainly on the Edit Journey page.

Expected structure:

```text
1. Edit page header
2. Basic Journey information
3. Cover Photo curation section
4. Highlights curation section
5. Organize Photos section
6. Category management section, if currently present
7. Danger Zone
```

This is a focused UI/UX polish pass.

Do not redesign the entire app.

Do not redesign Journey Detail again unless a tiny compatibility adjustment is required.

Do not redesign Home.

---

## 4. Must not do

Do not implement or modify roadmap/backlog features:

```text
export
share
save as work
AI recommendation
AI recap
AI captions
automatic photo selection
blur detection
duplicate detection
similar photo detection
A/B photo picking
A/B/C/D PK mode
map
timeline
countdown
real backend
login
cloud storage
public sharing
social features
batch delete
bulk selection mode
advanced search
new photo metadata systems
```

Do not make Edit Journey feel like an admin dashboard.

Do not add statistics cards such as:

```text
total photos
highlight count
note count
category count
```

Do not add new destructive workflows beyond the existing safe delete flow.

Do not move Delete Journey out of the Edit page Danger Zone.

---

## 5. Existing behavior to preserve

Preserve all completed functionality:

```text
Journey metadata can be edited.
Photos can be uploaded and persisted.
Cover photo can be selected.
Highlights can be toggled.
Custom categories can be added, renamed, deleted.
Photos can be assigned to custom categories.
Photo notes can be added, edited, and deleted.
Photos with notes show a restrained orange dot.
Desktop hover note card works.
Lightbox shows notes.
With Notes filter works where currently implemented.
Trash & Safe Delete remains safe.
```

Do not regress:

```text
localStorage Journey metadata
IndexedDB image persistence
old data migration
custom category fallback behavior
delete category safety
Trash restore
Delete Permanently
Home settings
Journey Detail v1.6 layout
```

---

## 6. Files to inspect first

Inspect the current implementation before editing.

Likely relevant files:

```text
app/journeys/[id]/edit/page.tsx
app/journeys/[id]/page.tsx
components/JourneyForm.tsx
components/PhotoGrid.tsx
components/PhotoTile.tsx
components/UploadDropzone.tsx
components/ConfirmModal.tsx
components/EmptyState.tsx
components/SegmentedTabs.tsx
components/PhotoLightbox.tsx
components/NoteTooltip.tsx
lib/types.ts
lib/storage.ts
```

The main expected work should be in:

```text
app/journeys/[id]/edit/page.tsx
components/PhotoGrid.tsx
components/PhotoTile.tsx
```

Create small focused components if it makes the page cleaner, such as:

```text
components/EditJourneyHeader.tsx
components/CoverPhotoPanel.tsx
components/HighlightsStrip.tsx
components/EditPhotoCurationPanel.tsx
```

Only create new components if they reduce complexity.

Do not perform a broad component rewrite.

---

## 7. Desired Edit Journey page structure

The Edit Journey page should feel like a calm workspace.

Suggested page hierarchy:

```text
Top nav

Edit Journey header
  - title
  - short calm subtitle
  - subtle View journey / Back to journey link

Basic Journey information
  - existing fields
  - keep stable and familiar

Cover Photo
  - current cover preview
  - short explanation
  - empty state if no cover
  - photos below still provide Set cover action

Highlights
  - current selected highlights preview
  - short explanation
  - empty state if no highlights
  - photos below still provide Highlight toggle

Organize Photos
  - category filter / note filter if existing
  - photo grid
  - each photo supports cover, highlight, note, category, remove

Category Management
  - keep existing custom category management
  - make it visually calmer if necessary

Danger Zone
  - existing safe delete flow
```

Do not necessarily force this exact component order if the current code structure makes another order cleaner, but the final user-facing page should clearly support:

```text
first understand the journey
then choose cover
then choose highlights
then organize all photos
then danger zone at the bottom
```

---

## 8. Section 1 — Edit page header

The page header should make it clear that this is a curation/editing space, not the final memory page.

Suggested title:

```text
Edit Journey
```

Suggested subtitle:

```text
Refine the memory before it becomes part of your archive.
```

or:

```text
Choose the cover, highlights, notes, and categories that shape this journey.
```

Use calm language.

Do not over-explain.

### View journey entry

Add or preserve a quiet link/button:

```text
View journey
```

or:

```text
Back to journey
```

This should take the user back to the Journey Detail page.

Styling:

```text
secondary
small
quiet
not a large primary CTA
```

Do not add Export, Share, AI, Map, Timeline, or other future entries.

---

## 9. Section 2 — Basic Journey information

Keep existing basic Journey fields:

```text
title if present
location
start date
end date
companions
journey notes
status if currently editable
```

Do not make this section the main focus of v1.7.

Improve spacing and section framing if needed.

Suggested visual treatment:

```text
white / warm surface card
large rounded corners
subtle border
comfortable vertical spacing
```

Avoid dense table-like layouts.

Avoid adding many new settings.

---

## 10. Section 3 — Cover Photo curation

Cover photo is important because it becomes the visual entrance to the memory.

Create or polish a dedicated Cover Photo section.

Suggested heading:

```text
Cover Photo
```

Suggested subtitle:

```text
This is the first image you’ll see when opening this memory.
```

### If a cover exists

Show a larger preview of the current cover.

Suggested layout:

```text
large rounded preview image
small label: Current cover
subtle hint: Choose a different cover from the photos below.
```

The preview should feel calm and beautiful.

Do not make it look like a file upload admin widget.

### If no cover exists

Show a calm empty state:

```text
Choose a cover from your photos below.
```

Do not use warning colors.

Do not make this a required blocking step unless the app already does.

### Cover action in photo grid

Each photo can still have a `Set cover` action.

If a photo is currently the cover:

```text
show a quiet Cover state
```

Visual direction:

```text
small warm label
or subtle orange ring
not a loud badge
```

Only one cover should be active.

Preserve current data behavior.

---

## 11. Section 4 — Highlights curation

Highlights are the moments that best represent this journey.

Create or polish a dedicated Highlights section.

Suggested heading:

```text
Highlights
```

Suggested subtitle:

```text
Pick the moments that best represent this journey.
```

### If highlights exist

Show a compact preview strip or small grid of selected highlights.

Suggested layout:

```text
horizontal strip on desktop if simple
or small 3-6 item grid
rounded thumbnails
quiet spacing
```

Do not create a heavy carousel dependency.

Do not create a complex masonry engine.

The selected highlights preview should help the user understand what will appear prominently on the memory page.

### If no highlights exist

Show a quiet empty state:

```text
No highlights yet. Mark a few photos below.
```

Do not show a big error state.

Do not force a minimum highlight count.

### Highlight action in photo grid

Each photo can still have a highlight toggle.

If a photo is highlighted:

```text
show a clear but gentle Highlight state
```

Suggested visual treatment:

```text
small Highlight label
subtle warm orange ring
or soft selected state
```

Avoid loud badges and dense controls.

---

## 12. Section 5 — Organize Photos

This is the main curation workspace.

Suggested heading:

```text
Organize Photos
```

Suggested subtitle:

```text
Set a cover, choose highlights, add notes, and organize photos by category.
```

Keep this section photo-first.

Do not turn it into a data management table.

### Photo grid behavior

Preserve existing photo grid functionality:

```text
image display
set cover
toggle highlight
add/edit/delete note
assign category
remove photo
click/lightbox behavior if currently available
hover note card if applicable
```

The grid should feel cleaner than an admin tool.

### Photo card visual hierarchy

Each photo card may need multiple actions, but they should be visually grouped.

Recommended hierarchy:

```text
Primary curation actions:
- Cover
- Highlight

Memory actions:
- Note
- Category

Destructive action:
- Remove
```

Do not place `Remove` visually next to the most common actions with equal weight if it feels dangerous.

Use quiet styling for normal actions and more careful styling for destructive action.

### Photo state indicators

A photo state should be visible but not noisy.

Possible states:

```text
Cover
Highlight
has note orange dot
category selected in selector
```

Avoid showing too many badges at once.

If a photo is both cover and highlight, use a tidy layout.

Do not cover important parts of the image with large overlays.

### Notes

Preserve v1.5 notes behavior.

The note action should make it clear whether the photo already has a note.

Suggested labels:

```text
Note
Edit note
```

or keep the current label if better.

If deleting a note is done by clearing text, preserve that behavior.

Do not create a separate notes dashboard.

### Categories

Preserve v1.4 custom category behavior.

Category assignment should remain clear.

Do not revert to fixed categories.

If a category selector already exists on photo cards, polish it rather than replacing the model.

### Remove photo

Preserve existing behavior.

If the current app removes photos directly from a Journey, keep the current safety pattern.

Do not implement bulk delete.

Do not add permanent delete logic here beyond existing behavior.

---

## 13. Section 6 — Category management

If the Edit page currently has category management, keep it.

Category management should remain available but not dominate the page.

Suggested heading:

```text
Categories
```

Suggested subtitle:

```text
Customize how this journey’s photos are organized.
```

Preserve:

```text
add category
rename category
delete category
fallback behavior when deleting a category
```

Important rule:

```text
Deleting a category must never delete photos.
```

If a category is deleted, existing photos should safely move to `Other` or the existing fallback behavior.

Do not change the data model unless necessary.

Do not add global categories.

Categories remain per-Journey.

---

## 14. Section 7 — Danger Zone

Keep the v1.2 safe delete pattern.

Delete Journey should remain:

```text
only in Edit Journey
at the bottom
inside Danger Zone
requires confirmation
moves to Trash first
Delete Permanently only happens in Trash
```

Do not add delete entry to:

```text
Home
Journey Detail
photo hover preview
top navigation
```

Danger Zone can be visually aligned with the polished page, but it should remain clearly separated.

---

## 15. Visual design principles

The Edit Journey page should feel:

```text
calm
structured
photo-first
curation-focused
low-density
premium but simple
```

Use:

```text
white background
warm off-white surfaces
large rounded cards
soft section spacing
subtle borders
muted helper text
warm orange accent for selected states
```

Avoid:

```text
admin dashboards
dense control bars
too many badges
large statistics panels
heavy shadows
loud destructive buttons near common actions
too many primary buttons
text-heavy overlays on photos
```

The page should feel like:

```text
a quiet workspace for shaping a memory
```

not:

```text
a media library backend
```

---

## 16. Responsive behavior

Desktop:

```text
sections have generous spacing
cover preview can be larger
highlights preview can be a strip or small grid
photo grid uses existing responsive layout
```

Tablet:

```text
sections stack cleanly
controls wrap without horizontal overflow
```

Mobile:

```text
single-column section layout
cover preview remains readable
highlights preview can scroll or stack
photo actions remain tappable
category controls do not overflow
Danger Zone remains at bottom
```

Do not rely on hover for essential actions.

All editing actions must remain accessible on touch devices.

---

## 17. Accessibility and semantics

Use semantic section structure where practical:

```tsx
<section>
  <h1>Edit Journey</h1>
</section>

<section>
  <h2>Cover Photo</h2>
</section>

<section>
  <h2>Highlights</h2>
</section>

<section>
  <h2>Organize Photos</h2>
</section>
```

Buttons must remain keyboard accessible.

Inputs and textareas should have accessible labels or clear associated text.

Do not remove focus states.

Do not make important controls only visible on hover.

Image alt text should use existing file names or a reasonable fallback.

---

## 18. Implementation guidance

### 18.1 Prefer small, focused components

If `app/journeys/[id]/edit/page.tsx` becomes too large, extract small presentational components.

Possible components:

```text
EditJourneyHeader
CoverPhotoPanel
HighlightsPreview
OrganizePhotosSection
CategoryManagementSection
```

Do not over-componentize.

Do not create a new design system.

### 18.2 Reuse current data and handlers

Prefer using existing state and functions:

```text
set cover
toggle highlight
set note
set category
remove photo
save journey
```

Do not rewrite storage.

Do not add new persistence layers.

### 18.3 Keep derived state derived

Examples:

```ts
const coverPhoto = photos.find((photo) => photo.id === journey.coverPhotoId || photo.isCover);
const highlightedPhotos = photos.filter((photo) => photo.isHighlight);
const hasNote = Boolean(photo.note?.trim());
```

If `hasNote` exists in the model, keep it consistent with trimmed `note`.

### 18.4 Do not add heavy dependencies

Do not add a new UI library, drag-and-drop library, animation library, carousel library, or masonry dependency.

Use React, Next.js, TypeScript, and the existing Tailwind/CSS setup.

### 18.5 Do not introduce drag-and-drop

Do not implement highlight ordering or drag sorting in v1.7.

That can be a future polish item.

---

## 19. Suggested acceptance checklist

### Page structure

- Edit Journey has a clearer, calmer header.
- There is a quiet `View journey` or `Back to journey` entry.
- Basic Journey info still works.
- Cover Photo has a dedicated section.
- Highlights has a dedicated section.
- Organize Photos is clearly the main photo curation area.
- Category management remains available if already present.
- Danger Zone remains at the bottom.

### Cover Photo

- Current cover preview is visible when cover exists.
- Empty cover state is calm when no cover exists.
- User can still set cover from the photo grid.
- Only one cover is active.
- Cover state is visible but not loud.

### Highlights

- Current highlights are previewed when they exist.
- Empty highlights state is calm when none exist.
- User can still toggle highlights from the photo grid.
- Highlight state is clear but gentle.
- No minimum highlight count is enforced.

### Organize Photos

- Photos can still be categorized.
- Notes can still be added/edited/deleted.
- Cover can still be set.
- Highlights can still be toggled.
- Photos can still be removed.
- Photo controls feel cleaner and less admin-like.
- Essential actions work on mobile/touch.

### Categories

- Custom per-Journey categories still work.
- Add category still works.
- Rename category still works.
- Delete category still works safely.
- Deleting a category does not delete photos.
- Photos move to fallback category according to existing behavior.

### Notes

- Orange note dots still show for photos with notes.
- Desktop hover note card still works.
- Lightbox notes still work.
- Mobile note viewing still works through Lightbox or existing note editing controls.

### Danger Zone

- Delete Journey remains in Edit page bottom Danger Zone.
- Delete Journey still requires confirmation.
- Delete still moves to Trash.
- Permanent delete remains in Trash.
- No delete action is added to Home or Journey Detail.

### Regression

- Home remains low-density.
- Journey Detail v1.6 remains intact.
- Photo image persistence remains intact.
- Existing journeys still load.
- Existing photos still load.
- Old category data migration still works.
- No roadmap features are accidentally added.

### Visual quality

- Edit page feels calmer and more structured.
- The page does not feel like an admin dashboard.
- There are no loud statistics cards.
- There are no unnecessary badges.
- Curation actions are easy to understand.
- Destructive actions are visually separated.

---

## 20. Testing commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

If one of these scripts does not exist in `package.json`, say so clearly and run the closest available command.

Also manually test:

```text
create or open a Journey
edit basic info
set cover
change cover
toggle highlights
add note
edit note
delete note by clearing
assign category
add category
rename category
delete category
remove a photo
view Journey Detail
confirm Home is unchanged
confirm Trash flow is unchanged
```

---

## 21. Report back

After implementation, report:

1. Which files changed.
2. What changed in the Edit Journey structure.
3. How Cover Photo curation works.
4. How Highlights curation works.
5. How Organize Photos changed.
6. Whether custom categories were preserved.
7. Whether v1.5/v1.6 behavior was preserved.
8. Results of:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## 22. Final reminder

This is v1.7 Edit Journey Curation Polish.

Do not expand scope.

Do not implement backlog.

Do not add AI, export, map, timeline, PK mode, backend, login, or cloud storage.

Keep Footprint calm, personal, beautiful, photo-first, and low-density.
