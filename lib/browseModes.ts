import type { Journey } from "./types";
import { CHINA_PROVINCES } from "./chinaLocations";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Get the best available date for a journey (startDate → createdAt fallback) */
export function getJourneyDate(journey: Journey): string {
  return journey.startDate || journey.createdAt;
}

/** Parse a journey's date into year and month, or null if unusable */
export function getJourneyYearMonth(
  journey: Journey
): { year: number; month: number } | null {
  const dateStr = journey.startDate || journey.createdAt;
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length < 2) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) return null;
  return { year, month };
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** Sort journeys newest first by startDate or createdAt */
export function sortJourneysNewestFirst(journeys: Journey[]): Journey[] {
  return [...journeys].sort((a, b) => {
    const aDate = getJourneyDate(a);
    const bDate = getJourneyDate(b);
    return bDate.localeCompare(aDate);
  });
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Build searchable text blob from a journey's top-level fields */
export function getJourneySearchText(journey: Journey): string {
  const parts: string[] = [];

  if (journey.title) parts.push(journey.title);
  if (journey.location) parts.push(journey.location);
  if (journey.locationProvince) parts.push(journey.locationProvince);
  if (journey.locationCities) parts.push(journey.locationCities.join(" "));
  if (journey.locationCity) parts.push(journey.locationCity);
  if (journey.locationAddress) parts.push(journey.locationAddress);
  if (journey.companions.length > 0) parts.push(journey.companions.join(" "));
  if (journey.notes) parts.push(journey.notes);
  if (journey.startDate) parts.push(journey.startDate);
  if (journey.endDate) parts.push(journey.endDate);

  return parts.join(" ").toLowerCase();
}

/** Filter journeys by case-insensitive substring match across journey fields */
export function filterJourneysBySearch(
  journeys: Journey[],
  query: string
): Journey[] {
  const q = query.trim().toLowerCase();
  if (!q) return journeys;
  return journeys.filter((j) => getJourneySearchText(j).includes(q));
}

// ---------------------------------------------------------------------------
// Timeline grouping
// ---------------------------------------------------------------------------

export interface TimelineGroup {
  year: number;
  month: number;
  monthName: string;
  journeys: Journey[];
}

export interface TimelineYearGroup {
  year: number;
  months: TimelineGroup[];
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Group journeys by year and month. Returns sorted groups + undated journeys. */
export function groupJourneysByYearMonth(journeys: Journey[]): {
  groups: TimelineGroup[];
  undated: Journey[];
} {
  const sorted = sortJourneysNewestFirst(journeys);
  const groupsMap = new Map<string, TimelineGroup>();
  const undated: Journey[] = [];

  for (const journey of sorted) {
    const ym = getJourneyYearMonth(journey);
    if (!ym) {
      undated.push(journey);
      continue;
    }
    const key = `${ym.year}-${ym.month}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        year: ym.year,
        month: ym.month,
        monthName: MONTH_NAMES[ym.month - 1],
        journeys: [],
      });
    }
    groupsMap.get(key)!.journeys.push(journey);
  }

  // Sort groups: newest year first, newest month first
  const groups = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  return { groups, undated };
}

/** Nest sorted month groups under a single entry for each year. */
export function groupTimelineGroupsByYear(
  groups: TimelineGroup[]
): TimelineYearGroup[] {
  const years = new Map<number, TimelineGroup[]>();

  for (const group of groups) {
    const months = years.get(group.year);
    if (months) {
      months.push(group);
    } else {
      years.set(group.year, [group]);
    }
  }

  return Array.from(years, ([year, months]) => ({ year, months }));
}

// ---------------------------------------------------------------------------
// Places grouping
// ---------------------------------------------------------------------------

export interface PlaceGroup {
  province: string;
  cities: { city: string; journeys: Journey[] }[];
}

/** Extract structured place entries from a single journey */
function getJourneyPlaceEntries(
  journey: Journey
): { province: string; city: string }[] {
  const province = journey.locationProvince?.trim();
  const cities = journey.locationCities?.length
    ? journey.locationCities
    : journey.locationCity
      ? [journey.locationCity]
      : [];

  if (province && cities.length > 0) {
    const uniqueCities = Array.from(
      new Set(cities.map((city) => city.trim()).filter(Boolean))
    );
    if (uniqueCities.length > 0) {
      return uniqueCities.map((city) => ({ province, city }));
    }
  }

  // Free-text location only → group under "Other places"
  if (journey.location?.trim()) {
    return [{ province: "Other places", city: "Memories" }];
  }

  return [];
}

/** Group journeys by province and city with proper ordering */
export function groupJourneysByProvinceCity(journeys: Journey[]): {
  groups: PlaceGroup[];
  otherPlaces: Journey[];
} {
  const sorted = sortJourneysNewestFirst(journeys);
  const provinceMap = new Map<string, Map<string, Journey[]>>();
  const otherPlaces: Journey[] = [];
  const provinceOrder = CHINA_PROVINCES.map((p) => p.name);

  for (const journey of sorted) {
    const entries = getJourneyPlaceEntries(journey);
    if (entries.length === 0) {
      otherPlaces.push(journey);
      continue;
    }

    for (const entry of entries) {
      if (entry.province === "Other places") {
        // Only push once to otherPlaces per journey
        if (!otherPlaces.find((j) => j.id === journey.id)) {
          otherPlaces.push(journey);
        }
        continue;
      }

      if (!provinceMap.has(entry.province)) {
        provinceMap.set(entry.province, new Map());
      }
      const cityMap = provinceMap.get(entry.province)!;
      if (!cityMap.has(entry.city)) {
        cityMap.set(entry.city, []);
      }
      const cityJourneys = cityMap.get(entry.city)!;
      // Avoid duplicate journey within the same city
      if (!cityJourneys.find((j) => j.id === journey.id)) {
        cityJourneys.push(journey);
      }
    }
  }

  // Sort provinces: CHINA_PROVINCES order first, then alphabetical
  const sortedProvinces = Array.from(provinceMap.keys()).sort((a, b) => {
    const ai = provinceOrder.indexOf(a);
    const bi = provinceOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const groups: PlaceGroup[] = [];
  for (const province of sortedProvinces) {
    const cityMap = provinceMap.get(province)!;
    const provinceData = CHINA_PROVINCES.find((p) => p.name === province);
    const cityOrder = provinceData?.cities ?? [];

    const sortedCities = Array.from(cityMap.keys()).sort((a, b) => {
      const ai = cityOrder.indexOf(a);
      const bi = cityOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });

    groups.push({
      province,
      cities: sortedCities.map((city) => ({
        city,
        journeys: cityMap.get(city)!,
      })),
    });
  }

  return { groups, otherPlaces };
}
