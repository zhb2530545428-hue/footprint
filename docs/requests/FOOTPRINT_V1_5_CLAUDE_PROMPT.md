# FOOTPRINT v1.5 Claude Code Prompt

## Version

Footprint v1.5 — Photo Notes Polish

## Context

Footprint is a personal travel photo memory app.

The current app already supports:

- Homepage with archived Journey cards
- New Journey creation
- Local photo persistence
- Cover selection
- Highlight selection
- Journey Detail page
- Edit Journey page
- Trash / Restore / Delete Permanently
- Settings for homepage card metadata visibility
- Custom Journey-specific photo categories

The user is satisfied with the current version and wants the next iteration to focus on photo notes, not export/share yet.

Export/share/save-as-a-work features should stay in the backlog for a later version.

## Goal

Implement Footprint v1.5: **Photo Notes Polish**.

The goal is to make photo notes feel like quiet memories attached to photos, without cluttering the gallery.

Annotated photos should be subtly marked with an orange dot. Notes should not be burned onto photos or always displayed on top of image cards.

## Product Principles

Follow these Footprint principles:

1. Calm, personal, memory-first UI.
2. Photo-first and low-density.
3. Notes should enrich photos without making the gallery feel like a dashboard.
4. Do not show note text directly on photo cards by default.
5. Annotated photos should use a subtle orange dot indicator.
6. Desktop users can preview notes through delayed hover.
7. Mobile users should view notes by opening the photo in the lightbox.

## Scope

### 1. Photo note editing

Ensure users can add, edit, and remove notes for individual photos.

If note editing already exists, polish and stabilize it instead of rebuilding unnecessarily.

Expected behavior:

- Add note to a photo
- Edit existing note
- Clear/delete note
- Persist note in existing Journey metadata storage
- Keep `hasNote` or equivalent derived state accurate

### 2. Orange dot indicator

Show a subtle orange dot on photos that have notes.

Rules:

- The orange dot should be small and tasteful.
- It should not cover important parts of the image.
- It should be visible in Journey Detail photo grids.
- It should be visible in Edit Journey photo grids if useful.
- It should not display note text directly on the card by default.

Suggested styling:

- Small circular dot
- Warm orange color matching Footprint accent
- Positioned near a top corner or just inside the photo card
- Minimal shadow or border only if needed for contrast

### 3. Lightbox note display

When the user opens a photo in the lightbox:

- If the photo has a note, show it below or beside the image in a clean note area.
- If the photo has no note, do not show an empty note block.
- Keep the lightbox clean and photo-first.

If the lightbox already displays notes, polish spacing, typography, and empty states.

### 4. Desktop hover-delayed note preview

On desktop, allow users to reveal note text by hovering over a photo for a short delay.

Rules:

- Do not show note immediately on hover.
- Use a short delay, roughly 800ms–1500ms.
- Only show the preview if the photo has a note.
- Preview should disappear when hover ends.
- Do not implement hover preview for mobile/touch-only behavior.
- Keep the preview small and non-intrusive.

Implementation can be simple:

- CSS/React state with timer
- No heavy dependency required

### 5. With Notes filter

Add a lightweight filter to Journey Detail and/or Edit Journey to view photos with notes.

Suggested filter options:

- All
- With Notes

If existing category filters are present, integrate this carefully without making the UI dense.

Possible approaches:

- Add `With Notes` as a separate small filter chip
- Or add it alongside existing tabs if it fits the current UI

Important:

- Do not clutter the homepage.
- Do not add note-related stats to Journey cards.

### 6. Mobile behavior

Mobile should not rely on hover.

Expected behavior:

- Orange dot still appears for annotated photos.
- Tapping a photo opens the lightbox.
- Lightbox shows the note if present.

### 7. Data compatibility

Do not clear existing localStorage or IndexedDB data.

Existing journeys and photos should continue to work.

If older photos do not have `note` or `hasNote`, handle them gracefully.

## Out of Scope

Do not implement these in v1.5:

- Export / share / PDF / Markdown export
- AI-generated notes or captions
- Automatic photo selection
- Similar photo grouping
- Full-screen A/B/C/D PK mode
- Map view
- Timeline
- Countdown / upcoming Journey
- Real backend
- Login/authentication
- Cloud storage
- Public sharing

## UI Requirements

Keep the existing Footprint style:

- White background
- Rounded image cards
- Warm orange accent
- Low-density layout
- Airbnb-inspired cleanliness
- No heavy borders or dashboard-like controls

The note system should feel subtle:

> “This photo has a memory attached.”

Not:

> “This is a note management dashboard.”

## Suggested Implementation Checklist

1. Inspect current note-related fields in types and storage.
2. Inspect current PhotoTile, PhotoGrid, PhotoLightbox, Journey Detail, and Edit Journey implementations.
3. Reuse existing note logic where possible.
4. Add or polish orange dot indicator.
5. Add or polish Lightbox note display.
6. Add delayed hover preview for desktop.
7. Add `With Notes` filtering in a minimal way.
8. Ensure note add/edit/delete persists correctly.
9. Ensure old data is compatible.
10. Keep homepage unchanged except for any shared component bug fixes that do not change its low-density design.

## Testing Requirements

Manually test:

1. Create or open a Journey with photos.
2. Add a note to a photo.
3. Confirm the photo shows an orange dot.
4. Open the photo in lightbox and confirm the note appears.
5. Edit the note and confirm the updated note appears.
6. Delete/clear the note and confirm the orange dot disappears.
7. Refresh the browser and confirm notes persist correctly.
8. Test `With Notes` filter.
9. Test desktop hover preview.
10. Test mobile-width layout behavior.
11. Confirm homepage Journey cards remain low-density and unchanged.

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

## Final Response Required from Claude Code

After implementation, summarize:

1. Files changed
2. What behavior was added or polished
3. How to test manually
4. Results of lint/typecheck/build
5. Any remaining limitations or follow-up suggestions
