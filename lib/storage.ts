import type { Journey, JourneyPhoto, PhotoCategory } from "./types";
import {
  dataUrlToBlob,
  deletePhotoBlobs,
  getPhotoBlob,
  savePhotoBlob,
} from "./image-storage";

const STORAGE_KEY = "footprint.journeys";

/** Map legacy string category values to default category IDs */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  people: "default-people",
  landscape: "default-landscape",
  food: "default-food",
  transport: "default-transport",
  other: "default-other",
};

/** Create the 5 default starter categories for a new Journey */
export function createDefaultCategories(now?: string): PhotoCategory[] {
  const ts = now ?? new Date().toISOString();
  return [
    { id: "default-people", name: "People", createdAt: ts },
    { id: "default-landscape", name: "Landscape", createdAt: ts },
    { id: "default-food", name: "Food", createdAt: ts },
    { id: "default-transport", name: "Transport", createdAt: ts },
    { id: "default-other", name: "Other", createdAt: ts },
  ];
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function isTransientUrl(url: string): boolean {
  return url.startsWith("blob:") || url.startsWith("data:");
}

function readStoredJourneys(): Journey[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Journey[]) : [];
  } catch {
    return [];
  }
}

function toStoredJourneys(journeys: Journey[]): Journey[] {
  return journeys.map((journey) => ({
    ...journey,
    photos: journey.photos.map((photo) => ({
      ...photo,
      url: isTransientUrl(photo.url) ? "" : photo.url,
    })),
  }));
}

function writeStoredJourneys(journeys: Journey[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredJourneys(journeys)));
}

async function hydrateJourney(journey: Journey): Promise<{
  journey: Journey;
  migrated: boolean;
}> {
  let migrated = false;

  // Migrate categories: add defaults if missing
  let categories: PhotoCategory[] = journey.categories;
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    categories = createDefaultCategories(journey.createdAt);
    migrated = true;
  }

  const photos: JourneyPhoto[] = [];

  for (const photo of journey.photos) {
    let processed: JourneyPhoto & { category?: string } = { ...photo };

    // --- URL hydration (existing logic) ---
    if (photo.url.startsWith("data:")) {
      const storageKey = photo.storageKey ?? photo.id;
      const blob = await dataUrlToBlob(photo.url);
      await savePhotoBlob(storageKey, blob);
      processed = {
        ...processed,
        storageKey,
        url: URL.createObjectURL(blob),
      };
      migrated = true;
    } else if (photo.storageKey) {
      const blob = await getPhotoBlob(photo.storageKey);
      processed = {
        ...processed,
        url: blob ? URL.createObjectURL(blob) : "",
      };
    } else if (photo.url.startsWith("blob:")) {
      processed = { ...processed, url: "" };
      migrated = true;
    }

    // --- Category migration: convert legacy string category to categoryId ---
    if (!processed.categoryId) {
      const legacyPhoto = photo as JourneyPhoto & { category?: string };
      const oldCategory = legacyPhoto.category;
      if (oldCategory && typeof oldCategory === "string" && oldCategory !== "all") {
        const legacyId = LEGACY_CATEGORY_MAP[oldCategory];
        if (legacyId) {
          migrated = true;
          const { category: _omit, ...rest } = processed;
          processed = { ...rest, categoryId: legacyId };
        }
      }
    }

    // If still no categoryId, default to Other
    if (!processed.categoryId) {
      migrated = true;
      const { category: _omit, ...rest } = processed;
      processed = { ...rest, categoryId: "default-other" };
    }

    // Strip any lingering legacy `category` field for cleanliness
    if ("category" in processed) {
      const { category: _omit, ...rest } = processed;
      processed = rest;
    }

    photos.push(processed as JourneyPhoto);
  }

  return {
    journey: { ...journey, photos, categories },
    migrated,
  };
}

/** Get all journeys, recreating temporary object URLs for IndexedDB images. */
export async function getJourneys(): Promise<Journey[]> {
  const stored = readStoredJourneys();
  const hydrated = [];
  let migrated = false;

  for (const journey of stored) {
    const result = await hydrateJourney(journey);
    hydrated.push(result.journey);
    migrated ||= result.migrated;
  }

  if (migrated) {
    writeStoredJourneys(hydrated);
  }

  return hydrated;
}

/** Get a single journey by id */
export async function getJourney(id: string): Promise<Journey | undefined> {
  const stored = readStoredJourneys();
  const index = stored.findIndex((journey) => journey.id === id);
  if (index === -1) return undefined;

  const result = await hydrateJourney(stored[index]);
  if (result.migrated) {
    stored[index] = result.journey;
    writeStoredJourneys(stored);
  }
  return result.journey;
}

/** Save a new journey's metadata to localStorage. */
export async function saveJourney(journey: Journey): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  journeys.push(journey);
  writeStoredJourneys(journeys);
}

/** Update an existing journey */
export async function updateJourney(updated: Journey): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  const idx = journeys.findIndex((j) => j.id === updated.id);
  if (idx === -1) return;

  const retainedKeys = new Set(
    updated.photos.flatMap((photo) => (photo.storageKey ? [photo.storageKey] : []))
  );
  const removedKeys = journeys[idx].photos.flatMap((photo) =>
    photo.storageKey && !retainedKeys.has(photo.storageKey) ? [photo.storageKey] : []
  );

  journeys[idx] = { ...updated, updatedAt: new Date().toISOString() };
  writeStoredJourneys(journeys);
  await deletePhotoBlobs(removedKeys);
}

/** Delete a journey by id */
export async function deleteJourney(id: string): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  const deleted = journeys.find((journey) => journey.id === id);
  writeStoredJourneys(journeys.filter((journey) => journey.id !== id));
  await deletePhotoBlobs(
    deleted?.photos.flatMap((photo) => (photo.storageKey ? [photo.storageKey] : [])) ?? []
  );
}

/** Move a journey to trash (soft delete) */
export async function moveJourneyToTrash(id: string): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  const idx = journeys.findIndex((j) => j.id === id);
  if (idx === -1) return;
  journeys[idx] = { ...journeys[idx], status: "trashed", updatedAt: new Date().toISOString() };
  writeStoredJourneys(journeys);
}

/** Restore a trashed journey back to archived */
export async function restoreJourney(id: string): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  const idx = journeys.findIndex((j) => j.id === id);
  if (idx === -1) return;
  journeys[idx] = { ...journeys[idx], status: "archived", updatedAt: new Date().toISOString() };
  writeStoredJourneys(journeys);
}

/** Permanently delete a journey: remove metadata + IndexedDB photo blobs */
export async function permanentlyDeleteJourney(id: string): Promise<void> {
  if (!isBrowser()) return;
  const journeys = readStoredJourneys();
  const target = journeys.find((j) => j.id === id);
  writeStoredJourneys(journeys.filter((j) => j.id !== id));
  await deletePhotoBlobs(
    target?.photos.flatMap((p) => (p.storageKey ? [p.storageKey] : [])) ?? []
  );
}

/** Get all trashed journeys */
export async function getTrashedJourneys(): Promise<Journey[]> {
  const all = await getJourneys();
  return all.filter((j) => j.status === "trashed");
}

/** Replace all journeys (useful for seeding) */
export async function setJourneys(journeys: Journey[]): Promise<void> {
  if (!isBrowser()) return;
  writeStoredJourneys(journeys);
}

export function revokePhotoObjectUrls(photos: JourneyPhoto[]): void {
  photos.forEach((photo) => {
    if (photo.url.startsWith("blob:")) {
      URL.revokeObjectURL(photo.url);
    }
  });
}

export function revokeJourneyObjectUrls(journeys: Journey[]): void {
  journeys.forEach((journey) => {
    revokePhotoObjectUrls(journey.photos);
  });
}
