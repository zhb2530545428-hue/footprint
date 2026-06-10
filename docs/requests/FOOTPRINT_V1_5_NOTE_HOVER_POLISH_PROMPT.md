# Footprint v1.5 Photo Notes Hover Polish — Claude Code Prompt

## 0. How to use this file

Put this file in the project root of the Footprint repository, then open Claude Code from the repo root and say:

```text
请阅读项目根目录里的 FOOTPRINT_V1_5_NOTE_HOVER_POLISH_PROMPT.md，然后按照里面的要求实现。
这次只做 v1.5 Photo Notes Hover Polish，不要扩大范围。
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

The current project already has v1.5 Photo Notes Polish basically working, but the hover note preview UI is not good enough.

Current visible issue:

- When hovering over a photo with a note, the preview appears above the photo instead of near the cursor.
- The preview is too small.
- Long note content is truncated.
- The card feels like a basic web tooltip, not a polished product interaction.
- The UI should feel more like Apple-style floating UI: soft, clean, translucent, rounded, smooth, and premium.

This task is a **small v1.5 UI refinement**, not a new roadmap feature.

---

## 2. Scope of this task

Only improve the desktop hover preview for photo notes.

### Must do

1. Replace the current small note tooltip with a larger floating hover note card.
2. The card should appear near the exact mouse hover point, not fixed above the photo.
3. The card should show the full note content.
4. Remove any line-clamp behavior from the hover note preview.
5. Make the card visually feel Apple-like:
   - large rounded corners
   - soft translucent white surface
   - subtle backdrop blur
   - very light border / hairline ring
   - soft, premium shadow
   - comfortable spacing
   - elegant typography
   - no heavy badge-like styling
6. Add a smooth entrance animation:
   - fade in
   - slight scale up
   - slight upward or outward movement
   - not abrupt
7. Keep the existing delayed hover behavior so fast mouse movement does not trigger the card.
8. Keep mobile behavior unchanged:
   - no hover note card on touch devices
   - mobile users should still tap into Lightbox to read notes.
9. Prevent the card from going off-screen.
10. Keep the rest of v1.5 behavior intact:
   - orange dot still marks photos with notes
   - Lightbox still shows the note
   - With Notes filter remains available
   - note add/edit/delete still works.

### Must not do

Do not implement or modify:

```text
export
share
AI
map
timeline
countdown
A/B/C/D photo picking
real backend
login
cloud storage
homepage density
new social features
new photo metadata systems
new roadmap features
```

Do not redesign the whole app.

Do not change the homepage low-density style.

Do not rewrite the Journey data model unless absolutely necessary.

---

## 3. Files to inspect first

Inspect the current implementation before editing.

Likely relevant files:

```text
components/NoteTooltip.tsx
components/PhotoTile.tsx
components/PhotoGrid.tsx
components/PhotoLightbox.tsx
app/journeys/[id]/page.tsx
app/journeys/[id]/edit/page.tsx
lib/types.ts
lib/storage.ts
```

The main expected change is probably inside:

```text
components/NoteTooltip.tsx
```

But adjust usage sites if necessary.

---

## 4. Current UX problem to fix

Current hover preview behaves too much like a traditional tooltip.

The desired behavior:

```text
When the user hovers over a photo that has a note,
after a short delay,
a large Apple-like floating note card appears near the cursor position.
The card shows the full note text.
The card should feel soft, premium, and calm.
```

Do not place the card at the fixed top-center of the image.

Do not truncate the note content.

Do not put the note text directly on top of the image.

---

## 5. Desired interaction design

### 5.1 Hover trigger

Desktop only.

Use mouse / pointer hover behavior only for devices that support fine pointer interaction.

Suggested behavior:

```text
onMouseEnter / onPointerEnter:
  record cursor position
  start 1000-1200ms timer

onMouseMove:
  optionally update latest cursor position while waiting

onMouseLeave / onPointerLeave:
  clear timer
  hide card
```

Important:

- Fast mouse movement should not show the card.
- The delay should remain calm and intentional.
- Do not show hover card on touchstart.

Suggested delay:

```text
1000ms
```

A value between 1000ms and 1200ms is acceptable.

---

### 5.2 Positioning

The floating card should be positioned near the mouse hover point.

Recommended default offset:

```text
x = cursorX + 16
y = cursorY + 18
```

Use viewport coordinates and fixed positioning.

Recommended approach:

```tsx
position: fixed;
left: computedX;
top: computedY;
z-index: high enough above photo grids and tabs;
```

The card should not be constrained by the photo tile container. It should not be clipped by `overflow-hidden` on the tile.

If the current `NoteTooltip` wrapper is inside an `overflow-hidden` tile, use a React portal to `document.body`, or otherwise make sure the card can escape the tile.

Preferred approach:

```tsx
createPortal(...)
```

Use the portal only on the client side.

---

### 5.3 Viewport collision handling

The card must not go off-screen.

Use a reasonable estimated or measured card size.

Recommended behavior:

- If the card would overflow the right edge, place it to the left of the cursor.
- If the card would overflow the bottom edge, place it above the cursor.
- Keep at least 16px margin from viewport edges.
- If the viewport is small, reduce width with `max-width: calc(100vw - 32px)`.

Pseudo logic:

```ts
const margin = 16;
const offset = 16;
const cardWidth = 360; // or measured width
const cardMaxHeight = Math.min(window.innerHeight * 0.7, 520);

let left = cursorX + offset;
let top = cursorY + offset;

if (left + cardWidth + margin > window.innerWidth) {
  left = cursorX - cardWidth - offset;
}

if (top + cardMaxHeight + margin > window.innerHeight) {
  top = cursorY - cardMaxHeight - offset;
}

left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));
top = Math.max(margin, top);
```

It is okay to use measured dimensions with a ref after render if that produces cleaner behavior.

---

## 6. Desired visual design

The card should feel like Apple-style UI.

### 6.1 Card surface

Use a calm translucent surface:

```text
background: rgba(255, 255, 255, 0.82-0.9)
backdrop-filter: blur(18px) or blur(24px)
border / ring: subtle black 5%-8%
shadow: large, soft, not harsh
border-radius: 20px-24px
```

Tailwind-style direction:

```tsx
rounded-3xl
bg-white/85
backdrop-blur-2xl
ring-1 ring-black/5
shadow-[0_24px_80px_rgba(15,23,42,0.16)]
```

If custom arbitrary shadow values are not preferred, use existing Tailwind shadow classes, but keep the result soft and premium.

---

### 6.2 Typography

The note text should feel readable and relaxed.

Suggested typography:

```text
font size: 14px or 15px
line height: relaxed, around 1.6
text color: near black, not pure muted gray
white-space: pre-wrap
word-break: break-word
```

Tailwind-style direction:

```tsx
text-[14px]
leading-6
text-foreground
whitespace-pre-wrap
break-words
```

---

### 6.3 Layout

Recommended size:

```text
width: 320px to 420px
max-width: calc(100vw - 32px)
max-height: 65vh or 70vh
padding: 16px to 20px
```

Important:

- Do not use line-clamp.
- Do not cut note content in normal cases.
- If a note is extremely long and exceeds the viewport, allow internal scrolling.
- The card should be allowed to grow vertically for realistic note lengths.

Suggested Tailwind direction:

```tsx
w-[min(380px,calc(100vw-32px))]
max-h-[70vh]
overflow-y-auto
px-5
py-4
```

Use a clean custom CSS class if Tailwind arbitrary `min()` is awkward.

---

### 6.4 Animation

Add a smooth entrance.

Recommended animation:

```text
opacity: 0 -> 1
scale: 0.96 -> 1
translateY: 6px -> 0
duration: 160ms to 220ms
easing: cubic-bezier or ease-out
```

Tailwind-style direction:

```tsx
transition-all duration-200 ease-out
data-[state=open]:opacity-100
data-[state=open]:scale-100
```

If not using data attributes, conditional class names are fine.

Avoid bouncy or playful animation. It should feel quiet and premium.

---

### 6.5 Arrow

Do not use the current small triangle arrow.

The Apple-like version should be a clean floating card without a tooltip arrow.

Remove the arrow unless there is a strong reason to keep it.

---

## 7. Implementation guidance

### 7.1 Refactor `NoteTooltip`

The component can keep a similar public API:

```tsx
interface NoteTooltipProps {
  note: string;
  children: ReactNode;
  delay?: number;
}
```

But internally it should:

- Track `visible`
- Track latest cursor position
- Track whether the interaction is touch
- Track timer ref
- Use `createPortal` to render the floating card into `document.body`
- Use fixed positioning
- Apply viewport collision handling
- Render nothing if:
  - note is empty after trim
  - touch interaction
  - not visible
  - document is unavailable

The wrapper can still render:

```tsx
<div
  className="relative"
  onMouseEnter={...}
  onMouseMove={...}
  onMouseLeave={...}
  onTouchStart={...}
>
  {children}
</div>
```

But the floating card itself should not be a child constrained inside the photo tile.

---

### 7.2 Avoid hydration issues

This is a Next.js client component.

Use `"use client"`.

If using `document.body`, make sure code only accesses `document` after mount or inside effects / event handlers.

A simple `mounted` state is acceptable:

```tsx
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);
```

Only call `createPortal` when mounted is true.

---

### 7.3 Pointer / touch behavior

Mobile should not show hover card.

Implementation should avoid touch triggering mouse hover accidentally.

Use:

```tsx
const wasTouchRef = useRef(false);

const handleTouchStart = () => {
  wasTouchRef.current = true;
  clearTimer();
  setVisible(false);
};
```

And on mouse enter, if recently touched, do not show.

A more robust solution can also check:

```ts
window.matchMedia("(hover: hover) and (pointer: fine)").matches
```

If not matched, do not show hover card.

---

### 7.4 Keep note dot behavior

The small orange dot on photos with notes should remain.

Do not replace the orange dot with text.

Do not make the dot too loud.

It should still feel like:

```text
this photo has a memory attached
```

not:

```text
this is a notification badge
```

---

### 7.5 Keep Lightbox behavior

The Lightbox should remain the canonical place to read notes on mobile.

If the current Lightbox already shows notes, do not redesign it heavily.

Only fix bugs if the hover card refactor breaks note visibility.

---

## 8. Acceptance criteria

After implementation, verify these manually.

### Desktop hover card

- Hovering over a photo without note does not show a card.
- Hovering quickly over a photo with note does not show a card.
- Hovering for about 1 second over a photo with note shows a card.
- The card appears near the mouse position, not fixed above the photo.
- The card is not clipped by the photo tile.
- The card does not get hidden behind category tabs or other grid UI.
- The full note text is visible.
- There is no `line-clamp` in the hover preview.
- Multi-line notes preserve line breaks.
- Very long notes do not break the layout; the card can scroll internally if necessary.
- The card stays within the viewport near right and bottom edges.
- Moving the mouse away hides the card.

### Visual quality

- The card feels clean, soft, and premium.
- The card uses large radius, subtle blur, subtle border, and soft shadow.
- The card does not use the old small tooltip arrow.
- The text is readable and not cramped.
- The animation feels smooth, not jumpy.

### Mobile behavior

- Touching a photo does not show the hover card.
- Mobile users can still open Lightbox and read the note there.

### Regression checks

- Orange note dots still show on photos with notes.
- Note add/edit/delete still works.
- With Notes filter still works.
- Lightbox note display still works.
- Existing category filtering still works.
- Homepage remains unchanged and low-density.

---

## 9. Testing commands

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Fix all errors.

If a command is not defined in `package.json`, say so clearly and run the closest available equivalent.

---

## 10. Report back

After finishing, report:

1. Which files changed.
2. What was changed.
3. How the hover note card is positioned.
4. How long notes are handled.
5. How mobile/touch behavior is protected.
6. The results of:

```bash
npm run lint
npm run typecheck
npm run build
```

---

## 11. Important constraints

This is not a redesign project.

This is not a new feature sprint.

This is a focused UI polish pass inside v1.5 Photo Notes Polish.

Keep the product calm, personal, photo-first, and low-density.

Do not expand the roadmap.
