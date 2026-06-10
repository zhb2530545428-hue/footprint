# FOOTPRINT_V1_4_1_CLAUDE_PROMPT.md

## Footprint v1.4.1 — Category Polish

You are working on the Footprint web app.

Footprint is a personal travel photo memory app. It should feel calm, photo-first, low-density, and more like a travel memory gallery than a photo management dashboard.

This version is a small polish/fix release after v1.4 Custom Categories. Do not expand scope into new roadmap features.

---

## First, Read These Files

Before coding, read the current project and these documentation files if they exist in the repo:

- `PRODUCT.md`
- `DESIGN.md`
- `TASKS.md`
- `CLAUDE.md`
- `ROADMAP.md`
- `BACKLOG.md`
- Current source code

Then briefly summarize your implementation plan and proceed.

---

## Current State

The app already has:

- Homepage Journey cards
- New Journey flow
- Journey Detail page
- Edit Journey page
- localStorage Journey metadata
- IndexedDB image storage
- Trash / Restore / Delete Permanently
- Settings for homepage card metadata visibility
- Custom photo categories in v1.4

The current category model is mostly correct:

- `PhotoCategory` is an object structure rather than a fixed enum.
- `JourneyPhoto` uses `categoryId`.
- `Journey` should have `categories: PhotoCategory[]`.
- Detail page should render category tabs from `journey.categories`.
- Edit page should support category management and photo category assignment.

This release should only stabilize and polish category behavior.

---

## Goal

Implement **Footprint v1.4.1: Category Polish**.

Make sure custom categories work consistently for both newly-created Journeys and existing/migrated Journeys.

---

## Scope

### 1. Fix New Journey Category Data

Check `app/journeys/new/page.tsx` and related creation logic.

Make sure newly uploaded photos do **not** use the old field:

```ts
category: "other"
```

Instead, photos should use:

```ts
categoryId: "default-other"
```

or the correct fallback category ID from the Journey's default categories.

When creating a new Journey, initialize:

```ts
categories: createDefaultCategories(now)
```

or the equivalent existing helper in the codebase.

The new Journey should be valid immediately after creation without relying on later migration to add categories.

---

### 2. Keep Default Categories as Starter Categories Only

Default categories may include:

- People
- Landscape
- Food
- Transport
- Other

But they must be treated as editable starter categories, not hard-coded permanent categories.

Users should still be able to:

- add categories
- rename categories
- delete categories safely
- assign photos to categories

---

### 3. Verify PhotoGrid / PhotoTile Category Props

Check whether `PhotoGrid` correctly passes category-related props to `PhotoTile`.

If `PhotoTile` supports:

- `categories`
- `onSetCategory`
- current photo `categoryId`

then `PhotoGrid` should support and forward those props where needed.

Edit Journey should allow users to change each photo's category from the photo grid/tile UI.

Do not duplicate category controls in multiple confusing places. Keep the UI clean.

---

### 4. Verify Edit Journey Category Filtering

Edit Journey should support filtering photos by:

- All
- Highlights
- Each custom category in `journey.categories`

The filters should be generated from actual Journey data, not from a fixed constant list.

If a category is renamed, filters should update accordingly.

If a category is deleted, filters should not break.

---

### 5. Verify Journey Detail Category Tabs

Journey Detail should render category tabs from `journey.categories`.

Tabs should show accurate photo counts if the current UI supports counts.

Empty categories can be hidden or disabled. Choose the behavior that best matches the current UI and keep it low-density.

Do not reintroduce hard-coded fixed category tabs.

---

### 6. Keep Old Data Migration Working

Do not clear localStorage.

Do not break existing user data.

Verify old/migrated Journeys still work if they have older photo fields such as:

```ts
category: "people" | "landscape" | "food" | "transport" | "other"
```

Migration should convert these to valid `categoryId` values.

Photos with no category should safely fall back to the default Other category.

---

### 7. Safety Rules for Deleting Categories

If a category is deleted, photos in that category must not be deleted.

Existing behavior should move affected photos to a fallback category, preferably Other.

If the fallback category does not exist, create a safe fallback or choose another valid category.

Do not leave photos pointing to missing category IDs.

---

## Out of Scope

Do **not** implement any of these in v1.4.1:

- AI automatic categorization
- Smart photo selection
- Similar-photo A/B/C/D PK
- Maps
- Timeline
- Export
- Countdown
- Real backend
- Login/auth
- Cloud image storage
- Major visual redesign

This is a stabilization release, not a feature expansion.

---

## Product / UI Principles

Keep Footprint:

- calm
- personal
- memory-first
- photo-first
- low-density
- clean white background
- rounded cards
- Airbnb-inspired but quieter

Do not make the homepage feel like a photo management dashboard.

Homepage cards must remain low-density and should not show category information.

---

## Testing Requirements

After implementation, test manually:

1. Create a new Journey.
2. Upload photos.
3. Confirm the new Journey has `categories` immediately.
4. Confirm newly uploaded photos use `categoryId`, not the old `category` field.
5. Open the Edit Journey page.
6. Add a new category.
7. Rename a category.
8. Assign photos to different categories.
9. Filter photos by category.
10. Delete a category that has photos.
11. Confirm those photos move to a safe fallback category and are not lost.
12. Open Journey Detail.
13. Confirm category tabs are generated from the Journey's custom categories.
14. Confirm old seeded/mock Journeys still render correctly.
15. Confirm homepage still only shows low-density Journey cards.

Then run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

---

## Deliverable Summary

After finishing, provide a concise summary:

- Files changed
- What category issues were fixed
- How new Journey category data now works
- How old data migration was preserved
- How to test manually
- Whether lint/typecheck/build pass

