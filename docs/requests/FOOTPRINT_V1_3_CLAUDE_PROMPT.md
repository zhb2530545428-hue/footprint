# FOOTPRINT v1.3 Claude Code Prompt

## Version

Footprint v1.3 — Settings & Home Polish

## How to use

Place this file in the root of the `footprint` project, then open Claude Code in the project root and say:

> Please read `FOOTPRINT_V1_3_CLAUDE_PROMPT.md` and implement Footprint v1.3 exactly within the scope described.

---

## Context

You are working on **Footprint**, a personal travel photo memory app.

Footprint is not a photo management dashboard. It should feel calm, personal, photo-first, and low-density. The homepage should feel like a beautiful gallery of archived travel memories.

Current implemented state:

- Homepage shows archived Journey cards.
- Journey cards are low-density.
- New Journey supports one-page creation.
- Users can upload photos, select a cover, mark highlights, and archive a Journey.
- Journey Detail is album-oriented.
- Edit Journey exists.
- Delete Journey exists at the bottom of Edit Journey.
- Delete Journey moves the Journey to Trash instead of permanently deleting it.
- Trash page supports Restore and Delete Permanently.
- IndexedDB is used for local photo persistence.
- localStorage is used for Journey metadata/settings-style local persistence.

Read the existing docs and codebase before making changes:

- `PRODUCT.md`
- `DESIGN.md`
- `TASKS.md`
- `CLAUDE.md`
- `ROADMAP.md`
- `BACKLOG.md`
- Current source code

Use `BACKLOG.md` only for long-term alignment. Do **not** implement backlog/roadmap features unless explicitly listed in the v1.3 scope below.

---

## Goal

Implement **Footprint v1.3: Settings & Home Polish**.

This version should make the current app feel more controllable and polished without adding large roadmap features.

The key product decision for this version:

> Homepage Journey cards should remain clean, but the user should be able to choose whether location, time, and companions are shown.

---

## v1.3 Scope

### 1. Add Settings Page

Add a new route:

```txt
/settings
```

The Settings page should follow the existing Footprint visual style:

- White background
- Clean spacing
- Soft rounded cards/sections
- Low-density layout
- Black primary text
- Warm orange accent only where useful
- No dashboard-like clutter

Settings page should include a section such as:

```txt
Homepage Card Display
Choose which Journey metadata appears on homepage cards.
```

Add toggles/checkboxes for:

- Show location
- Show time
- Show companions

Default values:

- Show location: enabled
- Show time: enabled
- Show companions: enabled

The settings must persist in localStorage.

Suggested data shape:

```ts
type FootprintSettings = {
  homepageCard: {
    showLocation: boolean;
    showTime: boolean;
    showCompanions: boolean;
  };
};
```

You may adjust naming if it better fits the existing codebase, but keep the idea clear.

---

### 2. Apply Settings to Homepage Cards

Update the homepage Journey cards so they respect the settings:

- If `showLocation` is false, hide location.
- If `showTime` is false, hide date/time.
- If `showCompanions` is false, hide companions.

Important:

- Do not add extra metadata.
- Do not add photo counts, statuses, badges, AI tags, or category stats.
- The homepage must remain low-density.
- The card should still look balanced even if only the cover image is shown.

If all three metadata fields are hidden, the card should still be visually clean and clickable.

---

### 3. Add Settings Navigation

Update the top navigation so users can reach Settings.

Navigation should remain light and not compete with `+ New Journey`.

Recommended nav items:

```txt
Footprint                      Trash   Settings   + New Journey
```

Rules:

- `+ New Journey` should remain the strongest visual action.
- `Trash` and `Settings` should be simple text links.
- Keep layout consistent across homepage, Trash page, Edit page, and other top-level pages.
- On mobile, keep navigation usable and avoid cramped layout.

---

### 4. Homepage Sorting

Ensure homepage archived Journeys are shown in a sensible order.

Recommended behavior:

1. Most recent `startDate` first.
2. If `startDate` is missing, fall back to `createdAt`.
3. If both are missing, preserve stable existing order.

Do not add visible sorting controls in v1.3.

This is an internal polish improvement only.

---

### 5. Homepage Empty State

Add or improve the homepage empty state.

When there are no archived Journeys, show a calm empty state:

```txt
No footprints yet.
Create your first journey and turn photos into memories.

[+ New Journey]
```

Rules:

- Keep it simple.
- Do not create a complex onboarding flow.
- Do not show feature marketing panels.
- Do not show AI-heavy language.

---

### 6. Demo / Seed Data Behavior

Review the current mock/seed data behavior.

Goal:

- Avoid repeatedly injecting demo journeys after the user has already started using the app.
- Avoid mixing demo data into real user-created data in an annoying way.
- Do not accidentally wipe user data.

Acceptable approaches:

Option A:
- Only seed demo data once on first load if no data exists.
- Store a localStorage flag like `footprint:seeded`.

Option B:
- Do not auto-seed demo data if user data already exists.
- Keep demo data in code for development only.

Option C:
- Add a very small development-only helper if the codebase already has a pattern for it.

Do **not** build a full data management page in v1.3.

Do **not** implement import/export.

---

### 7. Small UI Polish

Make small UI refinements if needed:

- Align top nav consistently.
- Keep card spacing Airbnb-inspired and clean.
- Ensure Trash and Settings links are visually lighter than `+ New Journey`.
- Ensure the Settings page matches the rest of the app.
- Ensure mobile layout is acceptable:
  - homepage cards should stack or wrap cleanly
  - nav should not break badly
  - Settings controls should remain usable

Do not redesign the entire app.

---

## Out of Scope

Do **not** implement any of these in v1.3:

- Automatic photo selection
- Smart curation
- AI recommendations
- AI-generated captions or summaries
- Full-screen A/B/C/D PK mode
- Map view
- Timeline
- Countdown / upcoming journeys
- Export selected photos
- PDF export
- Nine-grid generation
- Xiaohongshu copy generation
- Travel recap long image
- Real backend
- Supabase / S3 / R2
- Authentication/login
- Public sharing
- Complex filters/search on homepage
- Photo category editing
- Major redesign
- Broken-image fallback unless already needed for an existing component and extremely small

Stay focused on **Settings & Home Polish**.

---

## Implementation Suggestions

You can choose the exact file structure based on the current codebase.

Possible additions:

```txt
app/settings/page.tsx
lib/settings.ts
components/settings/SettingsForm.tsx
```

Possible helpers:

```ts
getSettings()
saveSettings(settings)
resetSettings()
```

Use localStorage safely:

- Guard against server-side rendering issues.
- Only access `window.localStorage` on the client.
- Provide default settings when localStorage is missing or malformed.

If existing app storage helpers already exist, integrate settings there rather than duplicating patterns unnecessarily.

---

## Acceptance Criteria

The version is complete when all of these are true:

### Settings

- `/settings` exists.
- User can toggle homepage location/time/companions visibility.
- Settings persist after refresh.
- Settings survive navigation away and back.

### Homepage

- Homepage cards respect settings.
- Homepage still only shows archived Journeys.
- Trashed Journeys do not appear.
- Homepage remains low-density.
- Journey cards still link to the correct Journey Detail pages.
- Empty state appears when no archived Journeys exist.

### Navigation

- Settings link exists in top navigation.
- Trash link still exists.
- `+ New Journey` remains the primary action.
- Layout is usable on desktop and acceptable on mobile.

### Sorting

- Archived Journeys appear newest-first by `startDate` where possible.

### Data

- Demo/seed data does not repeatedly re-inject in a way that pollutes user data.
- Existing user data is not wiped.

### Scope Control

- No roadmap features are implemented.
- No AI, map, export, backend, login, or PK mode is added.

---

## Required Testing

After implementation, run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

Manual test checklist:

1. Start the app.
2. Confirm homepage displays archived Journey cards.
3. Open `/settings`.
4. Turn off `show companions`.
5. Return to homepage.
6. Confirm companions are hidden on cards.
7. Refresh the browser.
8. Confirm companions remain hidden.
9. Turn off location and time as well.
10. Confirm homepage cards still look clean.
11. Turn all fields back on.
12. Confirm homepage cards return to normal.
13. Move a Journey to Trash.
14. Confirm it disappears from homepage.
15. Open `/trash`.
16. Confirm the Journey is listed there.
17. Restore the Journey.
18. Confirm it appears on homepage again.
19. Confirm New Journey flow still works.
20. Confirm Journey Detail and Edit pages still work.
21. Test narrow/mobile viewport enough to confirm layout does not break badly.

---

## Final Response Required from Claude Code

After completing the implementation, respond with:

1. Summary of what was implemented.
2. Files changed.
3. Any important implementation decisions.
4. How to test manually.
5. Results of:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
6. Any remaining known issues.

Keep the summary concise.
