import type { Journey, JourneyPhoto } from "./types";
import {
  dataUrlToBlob,
  deletePhotoBlobs,
  getPhotoBlob,
  savePhotoBlob,
} from "./image-storage";

const STORAGE_KEY = "footprint.journeys";

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
  const photos = [];

  for (const photo of journey.photos) {
    if (photo.url.startsWith("data:")) {
      const storageKey = photo.storageKey ?? photo.id;
      const blob = await dataUrlToBlob(photo.url);
      await savePhotoBlob(storageKey, blob);
      photos.push({
        ...photo,
        storageKey,
        url: URL.createObjectURL(blob),
      });
      migrated = true;
      continue;
    }

    if (photo.storageKey) {
      const blob = await getPhotoBlob(photo.storageKey);
      photos.push({
        ...photo,
        url: blob ? URL.createObjectURL(blob) : "",
      });
      continue;
    }

    if (photo.url.startsWith("blob:")) {
      photos.push({ ...photo, url: "" });
      migrated = true;
      continue;
    }

    photos.push(photo);
  }

  return {
    journey: { ...journey, photos },
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
