# ROADMAP.md — Footprint Roadmap

## v1 — Manual Archive MVP

Goal: Build a working, beautiful, low-density travel memory app shell.

Features:

- Archived Journey homepage
- One-page New Journey flow
- Journey metadata input
- Local photo upload preview
- Manual cover selection
- Manual highlight selection
- Archive Journey
- Album-oriented Journey detail page
- Photo lightbox
- localStorage/mock data

Not included:

- AI
- Automatic selection
- Map
- Timeline
- Export
- Login
- Cloud storage

## v1.5 — Refinement

Goal: Make MVP feel more usable and polished.

Potential features:

- Edit Journey metadata
- Edit cover/highlights after archive
- Simple photo notes in lightbox
- Orange dot indicator for annotated photos
- Better empty states
- Better mobile layout
- Simple photo category editing
- Basic settings for Journey card metadata visibility

## v2 — Smart Curation Foundation

Goal: Add the first real photo selection workflow.

Potential features:

- Manual Quick Review
- Smart grouping by time/file similarity/simple image metadata
- Automatic highlight suggestions using non-LLM heuristics or lightweight models
- “Review suggested highlights” flow
- Re-curate photos from Journey detail
- Cover recommendation

Important:

- Automatic selection does not have to use a large model.
- AI/automation should recommend, not decide permanently.

## v2.5 — Full-screen Similar Photo Comparison

Goal: Implement the core Pianke-inspired curation experience independently.

Potential features:

- Full-screen focused curation mode
- A/B comparison
- A/B/C/D comparison for similar photos
- Keep one / keep multiple / reject / skip
- Keyboard shortcuts
- Undo
- Progress saving
- Similar-photo group navigation
- Winner/keep/highlight outputs

Important:

- This must be full-screen.
- Do not embed advanced PK inside the New Journey form.
- Do not copy Pianke source code or branding.

## v3 — Journey as Travel Memory Page

Goal: Upgrade detail page from album to rich memory page.

Potential features:

- Timeline by day/time
- Map view
- Photo locations
- AI-generated trip summary
- AI-generated photo captions
- Notes integrated into story
- Highlighted moments
- Better categories

## v4 — Pre-trip Planning Lifecycle

Goal: Support Journey before travel.

Potential features:

- Upcoming Journeys on homepage
- Departure countdown
- Planned Journey state
- Packing/planning notes
- Add photos after trip
- Convert planned Journey into archived Journey

## v5 — Export and Sharing

Goal: Turn Footprint memories into portable/shareable outputs.

Potential features:

- Export selected photos
- Export entire Journey page as PDF
- Generate social media nine-grid
- Generate Xiaohongshu copy
- Generate travel recap long image
- Private share link
- Public share page with privacy controls

## v6 — Real Backend and Sync

Goal: Make Footprint usable across devices.

Potential features:

- Authentication
- Supabase/PostgreSQL
- Cloud photo storage
- Storage quotas
- User-owned data
- Backup/sync
- Privacy settings
