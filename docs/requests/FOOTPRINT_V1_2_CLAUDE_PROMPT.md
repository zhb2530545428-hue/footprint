# Footprint v1.2 Claude Code Prompt

## Version

Footprint v1.2: Trash & Safe Delete

## What to paste into Claude Code

```text
You are working on Footprint v1.2: Trash & Safe Delete.

First read:
- PRODUCT.md
- DESIGN.md
- TASKS.md
- CLAUDE.md
- ROADMAP.md
- BACKLOG.md
- the current codebase

Current state:
Footprint already has homepage Journey cards, New Journey, Journey Detail, Edit Journey, localStorage metadata, and IndexedDB image storage.

Goal:
Implement safe Journey deletion using a Recycle Bin / Trash flow.

Scope:
1. Add a Delete Journey section at the bottom of /journeys/[id]/edit only.
2. Do not add the Delete Journey button to the homepage or Journey Detail page.
3. Clicking Delete Journey must open a confirmation modal.
4. The confirmation modal should clearly explain:
   - this will move the Journey to Trash
   - it will not permanently delete photos yet
   - it can be restored later
5. After confirmation, move the Journey to Trash instead of permanently deleting it.
6. Add soft-delete support:
   - add status "trashed" to JourneyStatus, or add deletedAt to Journey
   - homepage must not show trashed journeys
7. Add /trash page:
   - show all trashed journeys
   - support Restore
   - support Delete Permanently
8. Restore:
   - move Journey back to archived
   - it should appear on homepage again
9. Delete Permanently:
   - require a second confirmation
   - remove Journey metadata from localStorage
   - delete all related photo blobs from IndexedDB
10. Add storage helpers:
   - moveJourneyToTrash(id)
   - restoreJourney(id)
   - permanentlyDeleteJourney(id)
   - getTrashedJourneys()
11. Do not implement broken-image fallback in this version.
12. Do not implement AI selection, maps, export, countdown, settings, or A/B/C/D PK.

Testing requirements:
1. Create a Journey with local uploaded photos.
2. Archive it.
3. Open its Edit page.
4. Click Delete Journey at the bottom.
5. Confirm deletion.
6. Confirm it disappears from homepage.
7. Open /trash.
8. Restore it.
9. Confirm it appears on homepage again.
10. Delete it again from Edit page.
11. Permanently delete it from Trash.
12. Confirm metadata is gone and IndexedDB blobs are removed.
13. Run:
   - npm run lint
   - npm run typecheck
   - npm run build
14. Fix all errors.

After implementation:
Give me a concise summary of changed files, behavior added, and how to test.
```

## Notes for Claude Code

- Keep v1.2 focused on safe deletion and Trash.
- The Delete Journey entry point must be at the bottom of the Edit Journey page.
- Do not add deletion actions to homepage Journey cards.
- Do not add deletion actions to the Journey Detail page.
- Do not solve old broken-image data in this version.
- Do not build roadmap features yet.

## Expected result

After v1.2:

- A user can move a Journey to Trash from the Edit page.
- A trashed Journey disappears from the homepage.
- A user can visit `/trash`.
- A user can restore a trashed Journey.
- A user can permanently delete a trashed Journey after confirmation.
- Permanent deletion removes both Journey metadata and related IndexedDB photo blobs.
