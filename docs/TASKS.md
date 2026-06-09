# TASKS.md — Footprint MVP Implementation Plan

## 0. Recommended Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui optional
- localStorage for v1 persistence
- Browser object URLs for local photo preview

No backend, database, authentication, cloud storage, or AI in v1.

## 1. Project Setup

- [ ] Create Next.js app with TypeScript
- [ ] Configure Tailwind CSS
- [ ] Set up basic app layout
- [ ] Add global CSS variables for Footprint design tokens
- [ ] Create mock data model files
- [ ] Add localStorage helper functions

## 2. Data Types

Create TypeScript types:

```ts
export type JourneyStatus = "planned" | "draft" | "curation" | "archived";

export type PhotoCategory =
  | "all"
  | "people"
  | "landscape"
  | "food"
  | "transport"
  | "other";

export interface JourneyPhoto {
  id: string;
  url: string;
  fileName?: string;
  isCover: boolean;
  isHighlight: boolean;
  category?: PhotoCategory;
  note?: string;
  hasNote: boolean;
  createdAt: string;
}

export interface Journey {
  id: string;
  title?: string;
  location: string;
  startDate?: string;
  endDate?: string;
  companions: string[];
  notes?: string;
  status: JourneyStatus;
  coverPhotoId?: string;
  photos: JourneyPhoto[];
  createdAt: string;
  updatedAt: string;
}
```

## 3. Shared Components

- [ ] `TopNav`
- [ ] `JourneyCard`
- [ ] `JourneyGrid`
- [ ] `EmptyState`
- [ ] `PhotoGrid`
- [ ] `PhotoTile`
- [ ] `PhotoLightbox`
- [ ] `UploadDropzone`
- [ ] `JourneyForm`
- [ ] `SegmentedTabs`

## 4. Homepage `/`

- [ ] Display top navigation
- [ ] Show page title `Your Footprints`
- [ ] Load journeys from localStorage or mock data
- [ ] Filter to only `status === "archived"`
- [ ] Display Journey card grid
- [ ] Each card shows cover image, location, time, companions
- [ ] Clicking card routes to `/journeys/[id]`
- [ ] New Journey button routes to `/journeys/new`
- [ ] Add empty state if no archived journeys

## 5. New Journey `/journeys/new`

- [ ] Create one-page layout
- [ ] Add Journey info form:
  - Title
  - Location
  - Start Date
  - End Date
  - Companions
  - Notes
- [ ] Add photo upload panel
- [ ] Use local file previews via `URL.createObjectURL`
- [ ] Display uploaded photos in grid
- [ ] Allow selecting one cover photo
- [ ] Allow toggling highlight status
- [ ] Allow removing photos from the upload list
- [ ] Archive button creates journey with status `archived`
- [ ] Save to localStorage
- [ ] Navigate to detail page after archive

## 6. Journey Detail `/journeys/[id]`

- [ ] Load journey by id
- [ ] Show large hero cover
- [ ] Show location/date/companions
- [ ] Show Highlights section
- [ ] Show All Photos section
- [ ] Add simple tabs:
  - All
  - People
  - Landscape
  - Food
  - Other
- [ ] In v1, categories can default to `other` or simple mock categories
- [ ] Show orange note dot for photos with `hasNote`
- [ ] Open Photo Lightbox when clicking a photo
- [ ] In lightbox, show note if present

## 7. Local Persistence

- [ ] Store journeys in localStorage under key `footprint.journeys`
- [ ] Create helpers:
  - `getJourneys()`
  - `getJourney(id)`
  - `saveJourney(journey)`
  - `updateJourney(journey)`
  - `deleteJourney(id)`
- [ ] Add demo/mock journeys if storage is empty

## 8. Responsive Behavior

- [ ] Homepage grid:
  - Desktop: 3–5 columns depending on width
  - Tablet: 2 columns
  - Mobile: 1 column
- [ ] New Journey:
  - Desktop: two-column form/upload
  - Mobile: single-column stacked
- [ ] Detail page:
  - Hero scales properly
  - Photo grid adapts to screen width

## 9. Acceptance Criteria

- [ ] User can open homepage and see archived Journey cards
- [ ] User can create a New Journey
- [ ] User can upload local photos and see previews
- [ ] User can choose a cover photo
- [ ] User can mark highlights
- [ ] User can archive the Journey
- [ ] New Journey appears on homepage
- [ ] User can open Journey detail page
- [ ] User can click a photo and open lightbox
- [ ] UI matches DESIGN.md principles: clean, white, photo-first, low-density

## 10. Explicit Non-goals for v1

Do not implement:

- Real backend
- Real database
- Real cloud storage
- Login
- AI photo selection
- Map
- Timeline
- Export
- Settings page
- Full-screen A/B/C/D PK
