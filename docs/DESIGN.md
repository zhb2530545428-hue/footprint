# DESIGN.md — Footprint UI Design System

## 1. Visual Direction

Footprint should feel like:

> Airbnb-inspired travel memory gallery: clean, white, photo-first, low-density, soft, calm.

The user provided Airbnb listing/search pages as the UI reference. Borrow the following:

- White background
- Generous spacing
- Rounded photo cards
- Soft top navigation
- Centered capsule-like primary action/search area
- Horizontal/sectioned photo-card grids
- Minimal visual noise

Do not copy Airbnb exactly. Footprint is not a marketplace and should not show pricing, ratings, recommendation tags, or dense filtering in v1.

## 2. Product Mood

Keywords:

- Calm
- Personal
- Memory-focused
- Warm
- Photo-first
- Minimal
- Not a dashboard
- Not a file manager

## 3. Color

Recommended palette:

```css
--background: #ffffff;
--foreground: #111111;
--muted: #717171;
--border: #eeeeee;
--surface: #f7f7f7;
--accent: #f97316; /* warm orange */
--accent-soft: #fff7ed;
```

Orange is used for:

- Primary action
- Note indicator dot
- Small active states

Avoid too much orange. It should be a warm detail, not the entire brand.

## 4. Typography

Use system font or Inter.

Recommended stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Text hierarchy:

- Page title: 28–36px, semibold/bold
- Section title: 22–28px, semibold/bold
- Card title: 15–16px, semibold
- Metadata: 14–15px, muted
- Helper text: 13–14px, muted

## 5. Radius and Spacing

Recommended:

```css
--radius-card: 22px;
--radius-button: 999px;
--radius-panel: 28px;
--page-padding-desktop: 40px;
--page-padding-mobile: 20px;
--grid-gap: 24px;
```

Cards should feel similar to Airbnb photo cards: rounded, image-led, no heavy border, little or no shadow.

## 6. Navigation

Top nav:

- Left: `Footprint`
- Center or right: `+ New Journey`
- Optional right: settings/menu icon in future

Desktop example:

```text
Footprint                 + New Journey                       Settings
```

Mobile example:

```text
Footprint                                      +
```

## 7. Homepage Layout

Route: `/`

Homepage v1 only displays archived Journeys.

Structure:

```text
Top Navigation

Your Footprints

Journey Card Grid
```

Journey card:

```text
[rounded cover image]
Location
Date range
Companions
```

No pricing, no ratings, no photo counts, no AI status.

Empty state:

```text
No footprints yet.
Create your first journey and turn photos into memories.

[New Journey]
```

## 8. New Journey Layout

Route: `/journeys/new`

One-page layout.

Desktop:

```text
Top nav

New Journey

[Journey Info Panel]    [Photo Upload Panel]

[Uploaded Photos Grid]

[Archive Journey]
```

Mobile:

```text
Top nav
New Journey
Journey Info Panel
Photo Upload Panel
Uploaded Photos Grid
Archive Journey
```

Form fields:

- Journey Title
- Location
- Start Date
- End Date
- Companions
- Notes

If title is empty, derive from location + year.

## 9. Uploaded Photo Grid

Each uploaded photo card can show:

- Image thumbnail
- Cover selector
- Highlight toggle

Keep controls subtle.

Example states:

- `★ Cover`
- `✓ Highlight`
- Plain image for keep-only

No scoring, no AI explanation, no complex metadata in v1.

## 10. Journey Detail Layout

Route: `/journeys/[id]`

v1 is album-oriented.

Structure:

```text
Top Navigation

Hero Cover
- Location
- Date
- Companions

Highlights

All Photos
- Tabs: All / People / Landscape / Food / Other
- Photo grid

Photo Lightbox
```

Hero should use a large cover photo with clean text overlay or text below depending on readability.

## 11. Photo Note Indicator

Future-ready rule:

- Photos with notes show a small orange dot.
- Dot placement: top-right corner inside the photo or just near the photo corner.
- Dot should be subtle, not decorative clutter.
- Do not show note text directly over images in the grid.

Suggested CSS:

```css
.note-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #f97316;
}
```

## 12. Photo Lightbox

Clicking a photo opens a simple lightbox.

Content:

- Large photo
- Close button
- Optional note below photo
- Optional metadata in future

No heavy UI.

## 13. Future Full-screen Curation UI

Not v1, but record design rule:

Advanced similar-photo comparison must be full-screen and focused.

It can support:

- A/B
- A/B/C
- A/B/C/D
- Keyboard shortcuts
- Group progress
- Undo
- Keep all / reject all / skip

Do not embed advanced PK inside the New Journey one-page form.
