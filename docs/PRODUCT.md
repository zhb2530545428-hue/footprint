# PRODUCT.md — Footprint Product Spec

## 1. Product Name

**Footprint**

## 2. Product Positioning

Footprint is a personal travel photo memory web app.

It helps users turn each trip into a clean, archived Journey page. A Journey can be created before a trip, during a trip, or after a trip. Photos can be added later. The product should feel like a beautiful travel memory space, not a photo-management dashboard.

Core idea:

> Where I went → who I went with → when it happened → the photos and memories worth keeping.

## 3. Product Principles

1. **Homepage is quiet and low-density.**
   - The homepage should only show organized/archived Journey cards in v1.
   - Do not expose complex tools such as AI curation, upload status, photo scoring, or classification on the homepage.

2. **New Journey carries the creation complexity.**
   - Upload, metadata, manual selection, cover selection, and archive actions live inside the New Journey flow.

3. **Photo curation is optional.**
   - Some users upload raw trip photos and need future smart curation.
   - Some users already selected their photos and only want to archive them.
   - v1 should support direct archive without forcing curation.

4. **AI recommends, users decide.**
   - Future smart curation should recommend, group, and explain.
   - It should not permanently delete photos or force a single answer.

5. **Footprint should preserve memory, not damage photos.**
   - Notes and annotations should never be burned onto the photo itself.
   - Notes can be indicated by a subtle orange dot and revealed on hover or inside a lightbox.

## 4. MVP v1 Scope

### Pages

- `/` — Homepage
- `/journeys/new` — One-page New Journey creation flow
- `/journeys/[id]` — Journey detail page
- Photo Lightbox component

### v1 Features

- Archived Journey card grid on homepage
- New Journey creation
- Journey metadata input:
  - Title
  - Location
  - Start Date
  - End Date
  - Companions
  - Notes
- Local image upload preview
- Manual highlight selection
- Cover photo selection
- Archive Journey
- Album-oriented Journey detail page
- Mock data + localStorage persistence
- Responsive layout for desktop and mobile

### v1 Non-goals

- Real AI photo selection
- Real cloud storage
- Real database
- Login/account system
- Map view
- Timeline
- Countdown
- Full-screen A/B/C/D photo comparison
- Export features
- Settings page
- Public sharing

## 5. Core User Flows

### Flow A — User already selected photos

1. Open homepage
2. Click **New Journey**
3. Fill in Journey metadata
4. Upload selected photos
5. Choose cover photo
6. Mark optional highlights
7. Click **Archive Journey**
8. Journey appears on homepage

### Flow B — User creates a Journey before travel

1. Open homepage
2. Click **New Journey**
3. Fill in location, date, companions, notes
4. Save as draft/planned Journey
5. Add photos after the trip in a future version

In v1, the homepage only shows archived Journeys. Planned/upcoming Journeys are a roadmap item.

### Flow C — Future smart curation

1. Upload many raw trip photos
2. Footprint performs automatic pre-selection or grouping
3. User enters a focused curation flow
4. User accepts/rejects photos or compares similar photos
5. Selected photos become Highlights / Keep / Cover
6. Journey is archived

This is not v1, but must remain a core product direction.

## 6. Journey States

Data should reserve status fields even if v1 UI is simple.

Recommended statuses:

- `planned` — Created before trip, may have no photos
- `draft` — Being edited or not archived yet
- `curation` — Photos uploaded and being reviewed
- `archived` — Finished and shown on homepage

v1 UI can mainly use:

- `draft`
- `archived`

## 7. Homepage Rules

Homepage v1 shows only archived Journey cards.

Each card should display only:

- Cover image
- Location
- Time
- Companions

Do not show:

- Photo count
- Highlight count
- AI score
- Complex tags
- Export buttons
- Management actions

Future Settings can control whether location/time/companions are visible.

## 8. New Journey Rules

v1 New Journey is one page.

Recommended layout:

- Left: Journey Info form
- Right: Photo upload panel
- Below: Uploaded photo grid with cover/highlight controls
- Bottom/right action: Archive Journey

Photo upload is optional because Journey may be created before the trip.

## 9. Photo Model

Photo statuses:

- `cover` — Used as Journey cover
- `highlight` — Featured in Highlights section
- `keep` — Kept in All Photos
- `hidden` — Not shown by default
- `rejected` — Future curation state

v1 can implement:

- cover
- highlight
- keep

## 10. Photo Notes

Each final photo can have optional notes.

Rules:

- Notes should not appear directly on top of the photo by default.
- Photos with notes should show a subtle orange dot.
- On desktop, notes can be revealed on hover after a short delay in a future version.
- On mobile, notes can be revealed by opening the photo.
- v1 should at least reserve note fields in data.

Suggested fields:

```ts
note?: string;
hasNote: boolean;
```

## 11. Privacy Principles

- Default private.
- No public sharing by default.
- Do not automatically delete original photos.
- AI, when added, should only recommend.
- User has the final decision.
