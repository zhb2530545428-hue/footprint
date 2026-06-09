# BACKLOG.md — Footprint Long-term Product Backlog

This file records all long-term ideas and agreed product decisions for Footprint, so future conversations or new coding sessions can quickly align with the current direction.

## 1. Confirmed Product Direction

Footprint is a personal travel photo memory app.

It should help users:

- Create a Journey around a place/trip
- Record location, time, companions, and notes
- Upload photos
- Select cover and highlights
- Archive the trip into a beautiful Journey page
- Revisit past trips through a calm, photo-first homepage

The app should feel more like a travel memory gallery than a photo management dashboard.

## 2. Confirmed MVP v1 Decisions

### Homepage

- Only show archived Journey cards.
- Keep homepage low-density.
- Do not show complex tools on homepage.
- Each Journey card shows:
  - Cover image
  - Location
  - Time
  - Companions
- Future settings can control whether location/time/companions appear.

### New Journey

- v1 New Journey is one page.
- New Journey should support:
  - Fill metadata
  - Upload photos
  - Manual highlight selection
  - Cover selection
  - Archive Journey
- Photo upload should be optional because a Journey can be created before a trip.

### Photo Selection v1

- Automatic selection is not required in v1.
- v1 can use manual selection only:
  - choose cover
  - mark highlights
  - keep photos

### Journey Detail v1

- Album-oriented detail page.
- Large cover/hero.
- Basic information:
  - location
  - date/time
  - companions
- Highlights section.
- All Photos section.
- Simple category tabs can be present:
  - All
  - People
  - Landscape
  - Food
  - Other
- Photo lightbox.

### v1 Technical Direction

- Next.js
- TypeScript
- Tailwind CSS
- localStorage/mock data
- Local image previews
- No backend
- No login
- No real AI
- No cloud storage

## 3. Future: Automatic / Smart Photo Selection

Automatic photo selection is a core future direction, even though it is not required in v1.

Possible future capabilities:

- Detect blurry photos
- Detect duplicates
- Detect near-duplicates
- Recommend highlights
- Recommend cover
- Group similar photos
- Group by time/location/scene
- Give simple reasons for recommendations
- Allow user to accept/reject suggestions

Important principle:

> Footprint recommends; the user decides.

The product must not automatically delete photos or permanently reject them without user confirmation.

Automatic selection does not have to use a large model. It can use:

- EXIF data
- Time intervals
- Image similarity
- Face/scene heuristics
- Local model
- Cloud AI model
- Large multimodal model in a later version

## 4. Future: Pianke-inspired Similar Photo PK

The user referenced `zhaoyue4810/pianke` as inspiration for photo selection.

Borrow only high-level ideas:

- Similar photo grouping
- Focused comparison
- Fast selection
- Undo
- Progress save
- Human final choice

Do not copy:

- Source code
- UI text
- Branding
- Implementation details

Future PK mode should be:

- Full-screen
- Focused
- Not embedded inside New Journey one-page form
- Designed for selecting from similar photos

It may support:

- A/B
- A/B/C
- A/B/C/D
- Keep one
- Keep multiple
- Reject all
- Skip
- Undo
- Keyboard shortcuts
- Progress indicator
- Similar group navigation

Core idea:

> In a group of similar photos, help the user quickly pick the ones worth keeping.

## 5. Future: Photo Notes and Orange Dot

Selected/final photos should support optional notes.

Rules:

- Notes should not be visually burned onto the photo.
- Notes should not appear directly on photo cards by default.
- Annotated photos should show a subtle orange dot.
- User can reveal notes by:
  - opening the photo
  - hovering for a few seconds on desktop
  - tapping/opening on mobile

Future note features:

- Add/edit note per photo
- Orange dot on annotated photos
- Hover delay note preview
- Lightbox note display
- Filter photos that have notes
- Use notes as material for AI-generated trip story

## 6. Future: Map View

Map view should be recorded for later.

Possible features:

- Map of all Journeys
- Map inside each Journey
- Photo pins by GPS location
- Click map point to view photos
- Cluster photos by place
- Show route between photo clusters
- Connect map with timeline

Not v1.

## 7. Future: Timeline

Timeline should be recorded for later.

Possible features:

- Group photos by day
- Group photos by time
- Day 1 / Day 2 / Day 3 structure
- Auto-generate timeline from EXIF time
- Add manual notes to timeline moments
- Connect timeline with map
- Use timeline for AI travel recap

Not v1.

## 8. Future: Pre-trip Journey and Countdown

Journey can be created before the trip.

Future capabilities:

- Create Journey before departure
- Add location/date/companions/notes before travel
- Show upcoming Journeys on homepage
- Show departure countdown
- Save planned Journey
- Add photos after trip
- Convert planned Journey to archived Journey

v1 can reserve the `planned` status but does not need to show upcoming Journeys on homepage.

## 9. Future: Export

Export is a strong future direction.

Possible export features:

- Export selected photos
- Export all highlights
- Export entire Journey page as PDF
- Generate social media nine-grid
- Generate Xiaohongshu copy
- Generate travel recap long image
- Export notes/captions
- Export timeline
- Export map route screenshot
- Private share page

Not v1.

## 10. Future: Settings

Settings should eventually control:

- Which metadata appears on homepage cards:
  - location
  - time
  - companions
- Display language
- Theme/accent color
- Photo note visibility behavior
- Privacy options
- AI/automation preference
- Export defaults

Not v1 unless needed.

## 11. Future: AI-generated Travel Content

AI can eventually generate:

- Journey title suggestions
- Trip summary
- Photo captions
- Daily summaries
- Xiaohongshu copy
- Social posts
- Travel recap text
- Cover recommendation reasons

Principle:

- AI-generated text should be editable.
- User notes should be used as high-quality memory input.
- AI should not invent sensitive or unsupported details.

## 12. Future: Privacy and Storage

Important future issues:

- Private by default
- User owns photos
- No public sharing by default
- No automatic third-party AI upload without consent
- Cloud processing should be optional or transparent
- Original photos should not be deleted automatically
- Rejected photos should be recoverable unless user explicitly deletes them

## 13. Future: Real Backend

Potential stack:

- Supabase/PostgreSQL
- Supabase Storage / Cloudflare R2 / S3
- Authentication
- User table
- Journey table
- Photo table
- Companion table
- Tags/categories
- Notes
- Export jobs

## 14. Future: Data Model Extensions

Potential tables/entities:

### Journey

- id
- title
- location
- startDate
- endDate
- companions
- notes
- status
- coverPhotoId
- createdAt
- updatedAt

### Photo

- id
- journeyId
- url
- fileName
- takenAt
- gpsLocation
- width
- height
- category
- tags
- isCover
- isHighlight
- note
- hasNote
- curationStatus
- createdAt

### Companion

- id
- name
- relation

### CurationGroup

- id
- journeyId
- groupType
- photoIds
- selectedPhotoIds
- rejectedPhotoIds
- progress

## 15. Future: Product Tone

Footprint should remain:

- calm
- personal
- memory-first
- photo-first
- low-density
- not a management dashboard
- not a marketplace
- not a social network by default

Avoid:

- Too many stats
- Too many badges
- Dense metadata
- Complex filters on homepage
- AI-heavy marketing language
- Anything that makes the app feel like admin software
