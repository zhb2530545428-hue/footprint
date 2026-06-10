# Footprint v1.9 Memory Library Browse Modes — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V1_9_MEMORY_LIBRARY_BROWSE_MODES_PROMPT.md，然后按照里面的要求实现 Footprint v1.9。

这次做 Memory Library Browse Modes：把首页从单纯 Journey 卡片列表升级成可以按 Recent / Timeline / Places 三种方式浏览的私人旅行记忆库。

范围可以比前几版稍微大一点，但不要失控。不要实现地图、GPS、路线、照片级时间线、AI、导出、分享、登录、云存储或真实后端。

完成后运行 npm run lint、npm run typecheck、npm run build，并修复所有错误。
```

Repository:

```text
https://github.com/zhb2530545428-hue/footprint.git
```

---

## 1. Product context

Footprint is a personal travel photo memory app.

It should feel:

```text
calm
personal
memory-first
photo-first
low-density
Airbnb-inspired
not an admin dashboard
not a social album
not a marketplace
```

The user is satisfied with versions up to v1.8:

```text
v1: Basic Journey flow
v1.1: Local image persistence and editing
v1.2: Trash & Safe Delete
v1.3: Settings & Home Polish
v1.4: Custom Categories & Manual Organization
v1.4.1: Category Polish
v1.5: Photo Notes Polish, including Apple-like hover note card
v1.6: Journey Detail Memory Polish
v1.7: Edit Journey Curation Polish
v1.8: China Province + Multi-city Location Fields
```

Now implement:

```text
v1.9 Memory Library Browse Modes
```

One-sentence goal:

```text
Turn Home from a simple Journey card list into a calm Memory Library where users can find travel memories by recent order, time, or place.
```

Chinese product goal:

```text
把首页从“Journey 卡片列表”升级成“可以按最近、时间、地点找回旅行记忆的私人旅行记忆库”。
```

---

## 2. Why v1.9 matters

The core Journey flow is now strong:

```text
New Journey
→ upload photos
→ Edit Journey: curate cover / highlights / categories / notes
→ Journey Detail: enjoy the memory page
→ Home: re-enter archived memories
```

v1.8 added structured China location data:

```text
locationProvince
locationCities
locationAddress
location display string
```

Now v1.9 should use that foundation to improve the Home browsing experience.

The user specifically wants future Home browsing to support:

```text
1. timeline-style browsing
2. location-based browsing
```

v1.9 should implement a lightweight first version of both on Home.

Important:

```text
Timeline mode is only Journey-level year/month grouping.
Places mode is only Journey-level province/city grouping.
```

Do not build full map/timeline systems.

---

## 3. Scope of v1.9

Main page to modify:

```text
Home page
```

Likely files:

```text
app/page.tsx
components/JourneyGrid.tsx
components/JourneyCard.tsx
components/SegmentedTabs.tsx
components/EmptyState.tsx
lib/types.ts
lib/storage.ts
lib/chinaLocations.ts or location helpers if present
```

Create small focused components if useful, for example:

```text
components/MemoryLibraryHeader.tsx
components/MemorySearch.tsx
components/MemoryBrowseTabs.tsx
components/TimelineJourneyGroups.tsx
components/PlaceJourneyGroups.tsx
```

Only create new components if they reduce complexity.

Do not do a broad app rewrite.

---

## 4. Required Home structure

Home should become a Memory Library with this structure:

```text
TopNav

Memory Library Header
  - title
  - short subtitle
  - + New Journey remains primary action

Search
  - lightweight Journey-level search

Browse Mode Tabs
  - Recent
  - Timeline
  - Places

Content
  - Recent mode: existing-style Journey card grid
  - Timeline mode: grouped by year/month
  - Places mode: grouped by province/city

Empty states
```

The page should remain calm and low-density.

Do not turn Home into a dashboard.

---

## 5. Browse modes

Implement three browse modes:

```text
Recent
Timeline
Places
```

Use a low-density tab / segmented control.

The default mode should be:

```text
Recent
```

The selected mode may optionally persist in localStorage if this fits the existing settings pattern, but it is not required.

Do not over-engineer routing/query params unless the app already uses them.

---

## 6. Mode 1 — Recent

Recent should preserve the current Home feeling.

Behavior:

```text
Show archived Journeys as Journey cards.
Sort from newest to oldest.
Use startDate if available.
Fallback to createdAt if startDate is missing.
```

This mode should still respect existing Home card display settings from v1.3:

```text
show location
show time
show companions
```

Do not add statistics.
Do not add dense metadata.
Do not add management controls.

`+ New Journey` should remain the primary action on Home.

---

## 7. Mode 2 — Timeline

Timeline mode should group Journeys by Journey-level time.

This is not a full Timeline feature.

### 7.1 Grouping

Group archived Journeys by:

```text
year
month
```

Use:

```text
startDate
```

Fallback:

```text
createdAt
```

If no usable date exists, group under:

```text
Undated
```

Example:

```text
2026
  June
    JourneyCard
    JourneyCard

  May
    JourneyCard

2025
  October
    JourneyCard

Undated
  JourneyCard
```

### 7.2 Sorting

Recommended sorting:

```text
Years: newest first
Months: newest first
Journeys within month: newest first
```

If a future sort toggle exists, keep it simple, but v1.9 does not need complex sorting.

### 7.3 Visual style

Timeline mode should feel like a memory archive, not a project-management timeline.

Use:

```text
quiet year heading
smaller month heading
generous spacing
Journey cards in a clean grid or vertical stack
```

Avoid:

```text
dense vertical timeline rails
many dots
calendar widgets
photo EXIF timeline
Day 1 / Day 2 breakdown
```

### 7.4 Do not implement

Do not implement:

```text
photo-level timeline
EXIF timeline
Day 1 / Day 2 grouping
route timeline
map-linked timeline
AI trip recap
```

---

## 8. Mode 3 — Places

Places mode should group Journeys by structured location data from v1.8.

### 8.1 Grouping logic

Use the new structured fields:

```ts
locationProvince?: string;
locationCities?: string[];
locationCity?: string; // compatibility
locationAddress?: string;
location?: string;
```

Group by:

```text
province
  city
    Journey cards
```

Example:

```text
浙江
  杭州
    JourneyCard
  湖州
    JourneyCard

云南
  昆明
    JourneyCard
  大理
    JourneyCard
  丽江
    JourneyCard
```

### 8.2 Multi-city behavior

A Journey with multiple cities should appear under each selected city.

Example Journey:

```text
locationProvince: "云南"
locationCities: ["昆明", "大理", "丽江"]
```

It should appear under:

```text
云南 / 昆明
云南 / 大理
云南 / 丽江
```

This is expected.

Do not duplicate the Journey within the same city.

### 8.3 Compatibility behavior

Some Journeys may only have:

```ts
location: "Kyoto, Japan"
```

or old single-city structured data:

```ts
locationProvince: "浙江";
locationCity: "杭州";
```

Required behavior:

```text
If locationProvince + locationCities exist:
  group under province / each city.

Else if locationProvince + locationCity exist:
  group under province / locationCity.

Else if only free-text location exists:
  group under "Other places".
```

Preferred user-facing label:

```text
Other places
```

Keep it gentle.

Do not make old data look broken.
Do not try to parse old free-text locations.

### 8.4 Sorting

Recommended sorting:

```text
Provinces alphabetical or in CHINA_PROVINCES order if available.
Cities follow the province city list order if available.
Journeys inside each city sorted newest first.
Other places at the bottom.
```

If simpler, alphabetical sorting is acceptable.

### 8.5 Visual style

Places mode should feel like a calm travel memory index.

Use:

```text
province heading
city subheading
Journey cards
generous section spacing
```

Avoid:

```text
maps
pins
route lines
dense address tables
statistics
```

---

## 9. Search

Add a lightweight search box on Home.

Suggested placeholder:

```text
Search by place, people, or memory…
```

Search should filter Journeys before they are rendered in the selected browse mode.

That means:

```text
Search query → filtered archived Journeys → render Recent / Timeline / Places grouping
```

### 9.1 Search fields

Search only Journey-level fields:

```text
title
location
locationProvince
locationCities
locationCity
locationAddress
companions
journey notes
startDate / endDate / year text
```

Do not search:

```text
photo notes
photo filenames
categories
image metadata
EXIF
```

### 9.2 Search behavior

Search should be:

```text
case-insensitive
trimmed
simple substring match
```

For arrays such as companions and locationCities, join or check each value.

Examples:

```text
"云南" matches locationProvince or location string.
"大理" matches locationCities.
"妈妈" matches companions if present.
"2026" matches date/year if present.
"西湖" matches locationAddress or notes if present.
```

### 9.3 Empty search state

If search returns no Journeys, show a calm empty state.

Suggested copy:

```text
No memories found.
Try searching for a place, person, or note from the journey.
```

Do not show technical text.

---

## 10. Memory Library Header

Update Home header to feel more like a memory library.

Suggested title options:

```text
Your memories
```

or keep existing Footprint title if better.

Suggested subtitle:

```text
A calm archive for the journeys you want to remember.
```

Keep `+ New Journey` visible and primary.

Do not add dashboard-style summary stats.

Do not add:

```text
total journeys
total photos
total notes
total locations
```

---

## 11. Settings compatibility

v1.3 added Home card display settings:

```text
show location
show time
show companions
```

v1.9 must preserve those settings.

Journey cards in all modes should still use the same display preferences.

Do not hard-code new card metadata that ignores settings.

If the existing `JourneyCard` already handles settings, reuse it.

Do not create separate card variants that drift from settings unless necessary.

---

## 12. Empty states

Handle these states calmly:

### 12.1 No Journeys at all

Use existing empty state if good.

Possible copy:

```text
No journeys yet.
Create your first Journey to start keeping travel memories.
```

### 12.2 No archived Journeys

If Home only shows archived Journeys, preserve that behavior.

Do not suddenly show planned/unarchived Journeys unless existing behavior already does.

### 12.3 Search has no results

Show:

```text
No memories found.
Try searching by place, people, or memory.
```

### 12.4 Timeline no dated Journeys

If there are archived Journeys but none have usable dates, show them under:

```text
Undated
```

### 12.5 Places no structured locations

If all Journeys are old free-text locations, show them under:

```text
Other places
```

Do not hide them.

---

## 13. Visual design principles

Home should remain:

```text
calm
personal
memory-first
photo-first
low-density
Airbnb-inspired
```

Use:

```text
white background
black / near-black text
muted secondary text
warm orange accent
large rounded cards
soft section spacing
light dividers only if useful
```

Avoid:

```text
dashboard cards
statistics panels
dense filter bars
large tables
admin controls
too many badges
loud mode tabs
maps
calendar widgets
```

The result should feel like:

```text
a private travel memory library
```

not:

```text
a photo management backend
```

---

## 14. Responsive behavior

Desktop:

```text
header and New Journey action align cleanly
search is comfortable width
browse tabs visible in one row
Timeline groups use spacious cards
Places groups use spacious cards
```

Tablet:

```text
tabs and search wrap cleanly if needed
cards remain readable
```

Mobile:

```text
header stacks naturally
search full width
tabs remain tappable
Timeline groups stack vertically
Places groups stack vertically
Journey cards remain low-density
no horizontal overflow
```

Do not make key browsing controls hover-only.

---

## 15. Accessibility and semantics

Use semantic structure where practical:

```tsx
<section>
  <h1>Your memories</h1>
</section>

<section>
  <h2>2026</h2>
</section>

<section>
  <h3>June</h3>
</section>

<section>
  <h2>云南</h2>
</section>

<section>
  <h3>大理</h3>
</section>
```

Search input should have:

```text
label or aria-label
```

Browse mode tabs should be keyboard accessible.

Do not remove focus states.

---

## 16. Implementation guidance

### 16.1 Data flow

Recommended flow:

```ts
const archivedJourneys = journeys.filter((journey) => journey.status === "archived");
const filteredJourneys = filterJourneysBySearch(archivedJourneys, searchQuery);

if (mode === "recent") render recent grid;
if (mode === "timeline") render timeline groups from filteredJourneys;
if (mode === "places") render place groups from filteredJourneys;
```

Keep helpers small and testable.

Possible helper functions:

```ts
filterJourneysBySearch(journeys, query)
sortJourneysNewestFirst(journeys)
groupJourneysByYearMonth(journeys)
groupJourneysByProvinceCity(journeys)
getJourneySearchText(journey)
getJourneyDate(journey)
getJourneyYearMonth(journey)
```

Put helpers near Home page or in `lib` depending on project style.

### 16.2 Place grouping helper

Pseudo logic:

```ts
function getJourneyPlaceEntries(journey) {
  const province = journey.locationProvince?.trim();
  const cities = journey.locationCities?.length
    ? journey.locationCities
    : journey.locationCity
      ? [journey.locationCity]
      : [];

  if (province && cities.length > 0) {
    const uniqueCities = Array.from(new Set(cities.map((city) => city.trim()).filter(Boolean)));
    return uniqueCities.map((city) => ({ province, city }));
  }

  return [{ province: "Other places", city: "Memories" }];
}
```

This ensures old Journeys still show up.

### 16.3 Avoid duplicate Journey within same city

If locationCities accidentally contains duplicates, dedupe them.

Example:

```ts
const uniqueCities = Array.from(new Set(cities.map((city) => city.trim()).filter(Boolean)));
```

### 16.4 No new dependencies

Do not add a UI library, search library, date library, map library, chart library, or animation library.

Use existing React/Next/Tailwind utilities.

### 16.5 Do not change data persistence

v1.9 should be mostly view-layer and derived grouping.

Do not change storage format unless absolutely necessary.

Do not migrate user data.

Do not mutate Journeys just to render Home grouping.

---

## 17. Acceptance checklist

### Header

- Home feels like a Memory Library.
- Header has calm title/subtitle.
- `+ New Journey` remains primary and easy to find.
- No statistics dashboard was added.

### Browse modes

- Home has Recent / Timeline / Places modes.
- Recent is the default mode.
- Switching modes works without page errors.
- Browse mode UI is low-density and calm.

### Recent

- Recent mode still shows archived Journey cards.
- Recent mode is sorted newest first.
- Existing Home card settings still apply.
- Home does not become denser.

### Timeline

- Timeline mode groups Journeys by year and month.
- Years and months are sorted newest first.
- Journeys without usable dates appear under Undated.
- Timeline is Journey-level only.
- No photo-level timeline was added.

### Places

- Places mode groups Journeys by province and city.
- Multi-city Journeys appear under each selected city.
- Old single `locationCity` Journeys still group correctly if province exists.
- Old free-text location Journeys appear under Other places.
- No Journey is duplicated within the same city group.
- No map was added.

### Search

- Search filters Journeys by title, location, province, cities, detailed address, companions, notes, and year/date text.
- Search works in Recent mode.
- Search works in Timeline mode.
- Search works in Places mode.
- Search is case-insensitive.
- Empty search result has a calm empty state.
- Photo-level search was not added.

### Regression

- Home still only shows archived Journeys if that was the existing behavior.
- Journey cards still navigate to Journey Detail.
- Journey Detail v1.6 still works.
- Edit Journey v1.7 still works.
- China location fields v1.8 still work.
- Notes, categories, cover, highlights, and trash flows still work.
- LocalStorage and IndexedDB behavior remains intact.

### Scope

- No maps.
- No GPS.
- No route lines.
- No photo EXIF timeline.
- No AI.
- No export/share.
- No backend/login/cloud storage.
- No statistics dashboard.

---

## 18. Testing commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

If one of these scripts does not exist in `package.json`, say so clearly and run the closest available command.

Manual testing:

```text
Create or use several archived Journeys across different years/months.
Create/use Journeys with structured locations:
  浙江 / 杭州 + 湖州
  云南 / 昆明 + 大理 + 丽江
  北京 / 北京
Create/use at least one old-style Journey with only free-text location.
Open Home.
Confirm Recent mode displays normal cards.
Switch to Timeline and confirm year/month grouping.
Switch to Places and confirm province/city grouping.
Confirm multi-city Journey appears under each city.
Search for a province.
Search for a city.
Search for a companion.
Search for a year.
Search for text that has no result.
Confirm Home remains low-density.
Confirm no map/timeline detail/AI/export features were added.
```

---

## 19. Report back

After implementation, report:

1. Which files changed.
2. How Home structure changed.
3. How Recent mode works.
4. How Timeline grouping works.
5. How Places grouping works.
6. How multi-city Journeys are handled.
7. How old free-text location Journeys are handled.
8. How search works.
9. Whether existing Settings for Home card display are preserved.
10. Results of:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## 20. Final reminder

This is v1.9 Memory Library Browse Modes.

This version may be larger than recent polish iterations, but it must still stay focused.

Implement:

```text
Recent / Timeline / Places browse modes
Journey-level search
Journey-level timeline grouping
Journey-level place grouping
```

Do not implement:

```text
map
GPS
route
photo-level timeline
EXIF timeline
AI
export/share
backend/login/cloud storage
statistics dashboard
```

Keep Footprint calm, personal, memory-first, photo-first, and low-density.
