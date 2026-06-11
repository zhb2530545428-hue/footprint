# Footprint

**A calm, local-first travel photo memory app.**

Your journeys, notes, categories, and photos live in a **Library folder** you control. You can keep that Library on your computer, an external drive, or a synced folder you trust. Footprint does not require login and does not upload your photos to a cloud service.

> "Went somewhere → with someone → at some time → which photos and memories are worth keeping."

---

## Philosophy

- **Local-first & offline-first** — your data lives on your disk, not our servers
- **Private by default** — no login, no cloud, no tracking
- **Photo-first** — clean, Airbnb-inspired layout that puts your memories front and center
- **Calm & personal** — not an admin dashboard, not a SaaS, not a social album

---

## What is a Footprint Library?

A Footprint Library is a folder on your computer that contains everything:

```
Footprint Library/
├── footprint.db       # SQLite database (journeys, categories, notes, metadata)
├── photos/            # Your original photos, organized by journey
├── thumbnails/        # Auto-generated thumbnails for fast browsing
```

You can move this folder to an external drive, back it up however you like, or keep it in a synced folder (Dropbox, iCloud, etc.). The app only reads from and writes to the Library folder you choose.

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Rust** 1.77+ (desktop app only)
- **Tauri prerequisites** — see [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)

### Web Development (browser only)

```bash
npm install
npm run dev          # Start Next.js dev server at http://localhost:3000
```

Web mode stores data in your browser's localStorage and IndexedDB. No backend required.

### Desktop Development

```bash
npm install
npm run desktop:dev  # Start Tauri desktop app with hot reload
```

The desktop app stores data in a **Library folder** you select on first launch.

### Build Desktop App

```bash
npm run desktop:build
```

This produces a native desktop application in `src-tauri/target/release/`.

---

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web dev server |
| `npm run build` | Build Next.js for production |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run desktop:dev` | Start Tauri desktop dev |
| `npm run desktop:build` | Build Tauri desktop app |
| `npm test` | Run tests |

---

## Where Data is Stored

| Mode | Location |
|------|----------|
| **Browser (dev)** | localStorage + IndexedDB |
| **Desktop** | A user-chosen Library folder on disk |
| **Desktop (config)** | Tauri app data directory (`footprint-store.json`) |

---

## How Photos are Stored

- In **browser mode**, photos are stored as blobs in IndexedDB
- In **desktop mode**, photos are copied into `Library/photos/<journeyId>/` as regular image files
- Thumbnails (v2.1+) are generated into `Library/thumbnails/<journeyId>/` for faster grid browsing

Photos are never uploaded anywhere. They stay on your device.

---

## Privacy

- **No login** required — there are no user accounts
- **No cloud upload** — your photos and data never leave your device
- **No analytics or tracking** — we don't collect any usage data
- **AI features are not part of this version** — if added in the future, they will be explicit and optional

See [docs/PRIVACY.md](docs/PRIVACY.md) for more details.

---

## Current Status

Footprint v2.1 — **Desktop Production Push**

What works:
- Create and manage journeys
- Upload and organize photos
- Categorize, highlight, and add notes
- Browse by Recent, Timeline, or Places
- China province + multi-city location fields
- Trash & safe delete
- Desktop app with local SQLite storage
- Thumbnail generation for faster browsing
- Library management (create, switch, recent)

What's NOT included:
- Cloud sync or backup
- User accounts or login
- AI photo picking or captions
- Map or GPS features
- Export or public sharing
- Mobile apps

---

## Documentation

- [Local Library](docs/LOCAL_LIBRARY.md) — Library folder structure and management
- [Privacy](docs/PRIVACY.md) — Privacy and data handling
- [Product](docs/PRODUCT.md) — Full product specification
- [Design](docs/DESIGN.md) — UI design system
- [Roadmap](docs/ROADMAP.md) — Version planning

---

## License

License: TBD

---

## Repository

[https://github.com/zhb2530545428-hue/footprint](https://github.com/zhb2530545428-hue/footprint)
