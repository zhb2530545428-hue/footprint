# Footprint v1.6 Journey Detail Memory Polish — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V1_6_JOURNEY_DETAIL_MEMORY_POLISH_PROMPT.md，然后按照里面的要求实现 Footprint v1.6。
这次只做 Journey Detail Memory Polish，不要扩大范围，不要提前实现 backlog 功能。
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

The user is satisfied with the completed versions up to v1.5:

```text
v1: Basic Journey flow
v1.1: Local image persistence and editing
v1.2: Trash & Safe Delete
v1.3: Settings & Home Polish
v1.4: Custom Categories & Manual Organization
v1.4.1: Category Polish
v1.5: Photo Notes Polish, including Apple-like hover note card
```

Now implement:

```text
v1.6 Journey Detail Memory Polish
```

One-sentence goal:

```text
Turn Journey Detail from a functional photo page into a calm, beautiful memory page.
```

Chinese product goal:

```text
把 Journey Detail 从“照片功能页”打磨成“安静漂亮的旅行回忆页”。
```

---

## 2. Scope of v1.6

This version only polishes the Journey Detail page structure and visual hierarchy.

The page should guide the user through a memory:

```text
Hero cover memory entrance
→ Journey notes
→ Highlights
→ Photo Library
```

This is a focused UI/UX polish pass. Do not redesign the entire app.

---

## 3. Must not do

Do not implement or modify roadmap/backlog features:

```text
export
share
save as work
AI recap
AI captions
map
timeline
countdown
A/B/C/D photo picking
real backend
login
cloud storage
public sharing
social features
complex statistics
advanced search
new photo metadata systems
```

Do not make the homepage denser.

Do not add admin-dashboard style panels.

Do not add photo count / category count / note count statistics to the Journey Detail page.

Do not change the custom category model completed in v1.4/v1.4.1.

Do not remove v1.5 note behavior.

---

## 4. Existing behavior to preserve

Preserve all existing completed functionality:

```text
Journey Detail can display photos.
Clicking photos opens Lightbox.
Photo notes are visible in Lightbox.
Photos with notes show a restrained orange dot.
Desktop hover note preview remains available.
Mobile/touch does not rely on hover.
With Notes filtering remains available.
Custom categories come from journey.categories.
Category filtering works with custom categories.
```

Do not regress:

```text
localStorage Journey metadata
IndexedDB image persistence
cover photo selection
highlight selection
custom category assignment
trash/safe delete flow
settings/home card display preferences
```

---

## 5. Files to inspect first

Inspect the current implementation before editing.

Likely relevant files:

```text
app/journeys/[id]/page.tsx
app/journeys/[id]/edit/page.tsx
components/PhotoGrid.tsx
components/PhotoTile.tsx
components/PhotoLightbox.tsx
components/NoteTooltip.tsx
components/SegmentedTabs.tsx
components/TopNav.tsx
lib/types.ts
lib/storage.ts
```

The main expected work should be around the Journey Detail page and supporting display components.

Do not rewrite storage or data migration unless absolutely necessary.

---

## 6. Desired Journey Detail page structure

Implement the Journey Detail page using this hierarchy:

```text
1. Top navigation
2. Hero Memory Header
3. Optional Journey Notes card
4. Highlights section
5. Photo Library section
6. Lightbox
```

Detailed structure:

```text
Top nav
  ↓
Hero section
  - large cover photo or calm fallback
  - overlapping / floating memory info card
  - title or location
  - date range
  - companions
  - subtle Edit journey entry
  ↓
Journey notes section
  - only if journey.notes exists
  ↓
Highlights section
  - only if highlighted photos exist
  ↓
Photo Library section
  - custom category tabs
  - lightweight With Notes filter
  - full photo grid
  ↓
Lightbox
  - unchanged behavior
```

---

## 7. Section 1 — Top navigation

Keep the existing navigation style.

Do not add new heavy navigation items.

Do not introduce Export, Share, AI, Map, or Timeline entries.

The top navigation should remain calm and simple.

---

## 8. Section 2 — Hero Memory Header

The Hero section is the emotional entry into the Journey.

It should make the page feel like opening a travel memory, not managing an album.

### 8.1 Cover photo

If the Journey has a cover photo, display it as a large visual hero.

Recommended size:

```text
Desktop height: 420px to 560px
Mobile height: 300px to 380px
```

The cover image should be:

```text
large
rounded
photo-first
soft
premium
not cluttered
```

Suggested Tailwind direction:

```tsx
rounded-[2rem]
overflow-hidden
object-cover
```

Use existing image URLs and existing storage behavior.

Do not add new storage logic.

### 8.2 Hero information card

Do not place too much text directly over the photo.

Use a floating or overlapping memory info card near the bottom of the cover photo or just below it.

The card can slightly overlap the cover.

Suggested visual style:

```text
white or translucent white
soft backdrop blur if useful
large rounded corners
subtle border/ring
soft shadow
comfortable spacing
```

Suggested content:

```text
Journey title or location
date range
companions
```

Show only fields that exist.

If both title and location exist, use the title as the main line and location as a smaller meta line, or use whichever pattern fits the current data model best.

Do not invent a title if one does not exist.

### 8.3 Date formatting

Use the existing date formatting style if the app already has one.

If there is no helper, keep it simple and readable:

```text
Apr 12 – Apr 18, 2026
```

If only one date exists, show only that date.

Do not add complicated date logic.

### 8.4 Companions

Display companions gently.

Example:

```text
With Mom, Jason
```

If there are no companions, omit the row.

Do not show an empty label.

### 8.5 Edit entry

Journey Detail is primarily a viewing page.

The edit entry should exist but be quiet.

Recommended label:

```text
Edit journey
```

Recommended placement:

```text
top-right of hero card
or top-right of the detail page header
```

Recommended styling:

```text
small secondary button
not a giant primary CTA
not visually louder than the memory content
```

Do not add delete controls here. Delete remains in the Edit page Danger Zone from v1.2.

---

## 9. Hero fallback when there is no cover

If there is no cover photo, do not show a broken or empty image area.

Use a calm fallback hero.

Suggested fallback:

```text
warm off-white / surface background
large rounded container
Journey title / location
date range
companions
subtle hint: Add a cover photo in Edit
```

The hint should be quiet and optional.

Do not make it a warning.

Do not use red or alert styling.

---

## 10. Section 3 — Optional Journey Notes card

If `journey.notes` exists and is non-empty, show it below the Hero section.

This is the user's own Journey-level note.

It is not AI generated.

Suggested section title:

```text
Notes from this journey
```

Visual direction:

```text
white card
large radius
subtle border
generous whitespace
readable line height
calm typography
```

Text behavior:

```text
preserve line breaks
allow wrapping
do not clamp
do not show if empty
```

Suggested Tailwind direction:

```tsx
whitespace-pre-wrap
leading-7
text-foreground
```

Do not create an AI recap.

Do not summarize the notes.

Do not add generated text.

---

## 11. Section 4 — Highlights

Highlights should be the first photo section on the Journey Detail page.

The idea:

```text
Before showing the full library, show the moments worth keeping close.
```

### 11.1 Visibility

If highlighted photos exist, show the Highlights section.

If no highlighted photos exist, omit the entire Highlights section.

Do not show a large empty state for missing highlights.

### 11.2 Section copy

Suggested heading:

```text
Highlights
```

Suggested subtitle:

```text
A few moments worth keeping close.
```

Keep the copy quiet and short.

### 11.3 Layout

The Highlights section should feel more editorial than the full Photo Library.

Choose a stable implementation that fits the existing component structure.

Preferred desktop direction:

```text
A slightly editorial grid:
- first photo can be larger
- remaining photos can sit in a simple 2/3-column rounded grid
```

Acceptable simpler direction:

```text
A clean 2-column or 3-column rounded photo grid with generous spacing
```

Mobile direction:

```text
single column
or a simple horizontal/stacked responsive layout
```

Do not implement a complex masonry engine unless the project already has one.

Do not add a heavy dependency.

### 11.4 Interaction

Photos in Highlights should behave like normal Journey Detail photos:

```text
click opens Lightbox
orange note dot appears on noted photos
desktop hover note card still works
mobile uses Lightbox for notes
```

Do not place note text directly on top of images.

Do not add large text overlays on photos.

---

## 12. Section 5 — Photo Library

After Highlights, show the complete browsing area.

Recommended heading:

```text
Photo Library
```

This sounds softer and less administrative than `All Photos`.

### 12.1 Layout

Structure:

```text
Photo Library heading
optional short subtitle
category tabs from journey.categories
With Notes lightweight filter
photo grid
```

Suggested subtitle:

```text
Browse the full set of moments from this journey.
```

Keep it optional and quiet.

### 12.2 Category tabs

Use the existing custom categories from `journey.categories`.

Do not revert to fixed hard-coded categories.

Default starter categories like People / Landscape / Food / Transport / Other should remain only starter data, not a permanent enum.

Category tabs should remain low-density and not look like an admin filter bar.

### 12.3 With Notes filter

Keep the With Notes filter.

It should be visually lightweight and should not compete with category tabs.

Recommended behavior:

```text
current category + optional with-notes filter
```

Examples:

```text
All + With Notes = all noted photos
Food + With Notes = noted Food photos
Landscape without With Notes = all Landscape photos
```

Do not add note counts.

Do not add complex search.

Do not add advanced filters.

### 12.4 Empty states

Use quiet empty states.

If selected category has no photos:

```text
No photos here yet.
```

If With Notes is active and there are no noted photos in the current view:

```text
No noted photos in this view yet.
```

Do not use loud warning UI.

---

## 13. Lightbox

Keep the current Lightbox behavior.

The Lightbox should remain the canonical way to read full notes on mobile.

Make sure after the page structure refactor:

```text
clicking photos still opens Lightbox
notes still display in Lightbox
navigation between photos still works if currently supported
closing Lightbox still works
```

Do not redesign the Lightbox heavily in v1.6.

Only make small adjustments if required by the new page structure.

---

## 14. Photo note behavior

Do not regress v1.5.

Photos with notes should still show a restrained orange dot.

The orange dot should remain:

```text
small
warm
quiet
not badge-like
not text-heavy
```

Desktop hover note card should remain Apple-like and should not be clipped.

Mobile should not show hover cards.

---

## 15. Visual design principles

The whole Journey Detail page should feel:

```text
beautiful
calm
memory-first
photo-first
low-density
premium but simple
Airbnb-inspired
```

Use:

```text
white background
warm off-white surfaces
black / near-black text
muted secondary text
warm orange accent
large rounded photo cards
generous whitespace
soft shadows only where useful
```

Avoid:

```text
admin cards
dense metadata tables
many badges
photo statistics
category statistics
note statistics
loud controls
heavy borders
too many buttons
text overlays on photos
```

---

## 16. Responsive behavior

Desktop:

```text
large hero
overlapping info card
spacious sections
Highlights can use 2/3-column editorial layout
Photo Library can use existing responsive grid
```

Tablet:

```text
hero remains large but not overwhelming
info card stacks naturally
tabs can wrap
```

Mobile:

```text
hero height around 300px-380px
info card stacks below or overlaps less aggressively
sections use single column
category tabs can horizontally scroll or wrap
With Notes chip remains reachable
Lightbox remains the primary note-reading behavior
```

Make sure horizontal overflow does not break the page.

---

## 17. Accessibility and semantics

Use semantic section structure where practical:

```tsx
<section>
  <h1>...</h1>
</section>

<section>
  <h2>Highlights</h2>
</section>

<section>
  <h2>Photo Library</h2>
</section>
```

Images should retain useful alt text from existing data, such as file name or a fallback.

Buttons should remain keyboard accessible.

Do not remove focus states.

Do not make important actions only available on hover.

---

## 18. Implementation guidance

### 18.1 Prefer composition over rewrite

If current components are reusable, reuse them.

For example:

```text
PhotoGrid
PhotoTile
PhotoLightbox
NoteTooltip
SegmentedTabs
```

If `PhotoGrid` is too rigid for Highlights, create a small presentational wrapper or a focused `HighlightsGrid` component.

Avoid a large app-wide refactor.

### 18.2 Avoid new dependencies

Do not add a new layout or animation library for this.

Use React, Next.js, TypeScript, and existing Tailwind/CSS patterns.

### 18.3 Keep data derived

Use existing Journey and Photo data.

Examples:

```ts
const highlightedPhotos = photos.filter((photo) => photo.isHighlight);
const notedPhotos = photos.filter((photo) => photo.note?.trim());
```

Do not add new persisted fields unless the current code already requires them.

If `hasNote` exists, keep it consistent with trimmed `note`.

### 18.4 Be careful with archived Journey behavior

Home currently shows archived Journey cards.

Do not change Journey status behavior in v1.6.

---

## 19. Suggested acceptance checklist

### Hero

- Journey Detail opens with a large, beautiful Hero section.
- If cover photo exists, it displays as the Hero image.
- If no cover photo exists, a calm fallback is shown.
- Journey title/location/date/companions are shown with low-density styling.
- Missing fields are omitted cleanly.
- Edit journey entry exists but is subtle.
- Delete controls are not added to Detail.

### Journey notes

- Journey-level notes show only when present.
- Notes preserve line breaks.
- Empty notes do not create an empty section.
- No AI summary is generated.

### Highlights

- Highlights section appears only when highlighted photos exist.
- Highlights appears before Photo Library.
- Highlights layout feels more editorial than the normal full grid.
- Clicking highlight photos opens Lightbox.
- Note dots and hover note card still work in Highlights.

### Photo Library

- Section is titled `Photo Library`.
- Category tabs still use custom journey categories.
- With Notes filter still exists and remains lightweight.
- Category + With Notes combined filtering works.
- Empty states are quiet and simple.

### Regression

- Existing photo grid still works.
- Existing Lightbox still works.
- Existing note display still works.
- Existing desktop hover note card still works.
- Existing mobile note behavior still works.
- Existing custom categories still work.
- Homepage remains low-density and unchanged.
- Edit Journey page still works.
- Trash/Safe Delete flow remains untouched.

### Visual quality

- The page feels calm and memory-first.
- The page does not feel like an admin dashboard.
- There are no loud statistics cards.
- There are no unnecessary badges.
- Controls do not dominate the memory content.
- The design remains consistent with Footprint's white/black/warm-orange visual language.

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

---

## 21. Report back

After implementation, report:

1. Which files changed.
2. What changed in the Journey Detail structure.
3. How the Hero section works with and without a cover.
4. How Highlights are displayed.
5. How Photo Library filtering works.
6. Whether v1.5 notes behavior was preserved.
7. Results of:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## 22. Final reminder

This is v1.6 Journey Detail Memory Polish.

Do not expand scope.

Do not implement backlog.

Keep Footprint calm, personal, beautiful, photo-first, and low-density.
