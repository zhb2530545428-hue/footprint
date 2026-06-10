# FOOTPRINT v1.4 Claude Code Prompt — Custom Categories & Manual Organization

You are working on **Footprint v1.4: Custom Categories & Manual Organization**.

Footprint is a personal travel photo memory app. It should remain calm, photo-first, low-density, and memory-oriented. Do not make it feel like a photo management dashboard.

## Before You Start

First read the current project files and documentation:

- `PRODUCT.md`
- `DESIGN.md`
- `TASKS.md`
- `CLAUDE.md`
- `ROADMAP.md`
- `BACKLOG.md`
- the current codebase

Also inspect the current implementation for:

- Journey data model
- Photo data model
- localStorage persistence
- IndexedDB image storage
- homepage Journey cards
- New Journey page
- Journey Detail page
- Edit Journey page
- Trash page
- Settings page

## Current State

Footprint already has:

- Homepage with archived Journey cards only
- Low-density Journey cards
- New Journey one-page creation flow
- Local uploaded image persistence
- Journey Detail page
- Edit Journey page
- Trash & Safe Delete flow
- Settings page for homepage card metadata visibility
- Photo notes / orange dot basics may already exist depending on current code

## Goal

Implement **custom photo categories** for each Journey.

The earlier fixed category list:

- People
- Landscape
- Food
- Transport
- Other

should become **default starter categories only**, not hard-coded permanent categories.

Users should be able to:

1. Add categories
2. Rename categories
3. Delete categories
4. Assign each photo to a category
5. Filter photos by category in Edit Journey
6. View photos by category in Journey Detail

## Product Principle

Categories are for organizing memories, not for creating a complicated admin interface.

Keep the UI:

- clean
- white background
- rounded
- low-density
- photo-first
- consistent with the existing Footprint style

Do not add dense tables, heavy metadata panels, or dashboard-like controls.

## Scope

### 1. Data Model

Refactor categories so they are not a fixed TypeScript enum/union.

Recommended structure:

```ts
export type PhotoCategory = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
};

export type JourneyPhoto = {
  // existing fields
  categoryId?: string;
};

export type Journey = {
  // existing fields
  categories: PhotoCategory[];
};
```

If the existing code already has a compatible structure, keep it and extend it cleanly.

Default categories for newly created Journeys should be:

- People
- Landscape
- Food
- Transport
- Other

But they must be editable per Journey.

### 2. Backward Compatibility / Migration

Existing localStorage Journey data may still use older fixed category values such as:

- `people`
- `landscape`
- `food`
- `transport`
- `other`

Add a safe migration path so old data still works.

Migration should:

1. Add default `categories` to Journeys that do not have them.
2. Convert old photo `category` values to `categoryId` if needed.
3. Preserve existing photos, highlights, cover, notes, and image storage references.
4. Avoid data loss.

Do not wipe localStorage automatically.

### 3. Edit Journey — Category Management

On `/journeys/[id]/edit`, add a clean category management area.

It should support:

- View current categories
- Add a category
- Rename a category
- Delete a category

Keep this area visually lightweight.

Possible placement:

- below Journey metadata and above photo grid
- or near the photo organization section

Do not place it in the Danger Zone.

### 4. Delete Category Behavior

Deleting a category must be safe.

If the category has photos assigned to it:

- show a confirmation modal
- explain how many photos are using this category
- require the user to choose a safe outcome

Recommended behavior:

- Move those photos to `Other` if `Other` exists
- If `Other` does not exist, create `Other` automatically or ask the user to choose another category
- Then delete the category

Do not leave photos pointing to a missing category.

Do not permanently delete photos when deleting a category.

### 5. Edit Journey — Assign Photo Category

Each photo in the Edit Journey photo grid should allow assigning/changing category.

UI options:

- small pill/dropdown on each photo tile
- compact select menu below/near the photo
- lightweight hover action if consistent with current UI

Requirements:

- It must be easy to assign a photo to any Journey category.
- It must not make the photo grid feel cluttered.
- It must preserve existing cover/highlight/note interactions.

### 6. Edit Journey — Filter by Category

Add category filters to Edit Journey photo organization area.

Filters should include:

- All
- Highlights
- one tab/filter per custom category

Optional:

- show counts beside category names

Filtering should work with the user-defined categories.

### 7. Journey Detail — Category Tabs

Update Journey Detail category tabs to use the Journey's custom categories.

Tabs should include:

- All
- Highlights
- custom categories

Requirements:

- Display accurate photo counts if the current UI supports counts cleanly.
- Hide or visually de-emphasize empty categories if that feels better.
- Keep the detail page album-oriented and low-density.

### 8. New Journey

New Journey should create default starter categories automatically.

Default starter categories:

- People
- Landscape
- Food
- Transport
- Other

Do not add a full category management UI to New Journey unless it is simple and clearly beneficial. The main category management should live in Edit Journey.

### 9. Storage Helpers

Update storage helpers as needed.

Possible helpers:

- `createDefaultCategories()`
- `addJourneyCategory(journeyId, name)`
- `renameJourneyCategory(journeyId, categoryId, name)`
- `deleteJourneyCategory(journeyId, categoryId, fallbackCategoryId)`
- `updatePhotoCategory(journeyId, photoId, categoryId)`
- `migrateJourneyCategories(journey)`

Use the existing project style and do not over-engineer.

### 10. UI Copy

Use clear English UI copy consistent with current Footprint UI.

Examples:

- `Categories`
- `Add Category`
- `Rename`
- `Delete`
- `Move photos to Other`
- `This category contains 12 photos.`
- `Deleting a category will not delete photos.`

### 11. Do Not Implement Roadmap Features

Do not implement:

- AI automatic categorization
- automatic photo selection
- A/B/C/D PK
- map view
- timeline
- export
- countdown
- real backend
- login/auth
- cloud storage
- sharing

This version is only about **custom categories and manual organization**.

## Expected Routes / Areas Changed

Likely areas:

- `lib/types.ts`
- `lib/storage.ts`
- `app/journeys/new/page.tsx`
- `app/journeys/[id]/page.tsx`
- `app/journeys/[id]/edit/page.tsx`
- relevant photo tile / photo grid components
- possible new components for category management

Use the current project structure. Do not rewrite unrelated parts.

## Testing Requirements

Manually test these flows:

### New Journey

1. Create a new Journey.
2. Upload photos.
3. Archive it.
4. Confirm default categories exist.

### Edit Categories

1. Open the Journey Edit page.
2. Add a new category, for example `Museum`.
3. Rename it to `Exhibition`.
4. Assign several photos to it.
5. Save changes.
6. Refresh the browser.
7. Confirm the category and assignments persist.

### Filter Photos

1. Filter by `All`.
2. Filter by `Highlights`.
3. Filter by a custom category.
4. Confirm the correct photos appear.

### Delete Category

1. Delete an empty category.
2. Delete a category that has photos assigned.
3. Confirm the modal appears.
4. Confirm photos are moved safely to `Other` or another valid fallback category.
5. Confirm no photos are deleted.
6. Confirm no photo points to a missing category.

### Journey Detail

1. Open Journey Detail.
2. Confirm custom category tabs appear.
3. Confirm category tabs filter photos correctly.
4. Confirm homepage Journey cards remain unchanged and low-density.

### Backward Compatibility

1. Existing seeded/mock journeys should still render.
2. Existing user-created journeys should still render.
3. Old fixed category data should migrate safely.

## Required Commands

After implementation, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors before finishing.

## Final Response

When done, provide a concise summary:

1. What changed
2. Files changed
3. How to test
4. Any known limitations

Remember: keep v1.4 focused. Do not implement backlog/roadmap features yet.
