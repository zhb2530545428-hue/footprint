import type { Journey } from "./types";

const STORAGE_KEY = "footprint.journeys";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Get all journeys from localStorage */
export function getJourneys(): Journey[] {
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

/** Get a single journey by id */
export function getJourney(id: string): Journey | undefined {
  return getJourneys().find((j) => j.id === id);
}

/** Save a new journey to localStorage */
export function saveJourney(journey: Journey): void {
  if (!isBrowser()) return;
  const journeys = getJourneys();
  journeys.push(journey);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

/** Update an existing journey */
export function updateJourney(updated: Journey): void {
  if (!isBrowser()) return;
  const journeys = getJourneys();
  const idx = journeys.findIndex((j) => j.id === updated.id);
  if (idx === -1) return;
  journeys[idx] = { ...updated, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

/** Delete a journey by id */
export function deleteJourney(id: string): void {
  if (!isBrowser()) return;
  const journeys = getJourneys().filter((j) => j.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}

/** Replace all journeys (useful for seeding) */
export function setJourneys(journeys: Journey[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
}
