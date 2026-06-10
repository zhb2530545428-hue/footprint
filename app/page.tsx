"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Journey } from "@/lib/types";
import type { FootprintSettings } from "@/lib/settings";
import { getSettings } from "@/lib/settings";
import {
  getJourneys,
  revokeJourneyObjectUrls,
  setJourneys,
} from "@/lib/storage";
import { MOCK_JOURNEYS } from "@/lib/mock-data";
import {
  sortJourneysNewestFirst,
  filterJourneysBySearch,
  groupJourneysByYearMonth,
  groupJourneysByProvinceCity,
} from "@/lib/browseModes";
import TopNav from "@/components/TopNav";
import JourneyGrid from "@/components/JourneyGrid";
import SegmentedTabs from "@/components/SegmentedTabs";
import MemorySearch from "@/components/MemorySearch";
import TimelineJourneyGroups from "@/components/TimelineJourneyGroups";
import PlaceJourneyGroups from "@/components/PlaceJourneyGroups";
import EmptyState from "@/components/EmptyState";

const SEEDED_KEY = "footprint.seeded";

type BrowseMode = "recent" | "timeline" | "places";

const BROWSE_TABS = [
  { key: "recent", label: "Recent" },
  { key: "timeline", label: "Timeline" },
  { key: "places", label: "Places" },
];

export default function HomePage() {
  const [archived, setArchived] = useState<Journey[]>([]);
  const [settings, setSettings] = useState<FootprintSettings>(getSettings);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<BrowseMode>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadedJourneys: Journey[] = [];

    const loadJourneys = async () => {
      let journeys = await getJourneys();

      // Only seed mock data once on first visit
      if (journeys.length === 0 && !localStorage.getItem(SEEDED_KEY)) {
        journeys = MOCK_JOURNEYS;
        await setJourneys(journeys);
        localStorage.setItem(SEEDED_KEY, "true");
      }

      loadedJourneys = journeys;
      if (cancelled) {
        revokeJourneyObjectUrls(journeys);
        return;
      }

      setSettings(getSettings());
      setArchived(
        sortJourneysNewestFirst(
          journeys.filter((j) => j.status === "archived")
        )
      );
      setLoaded(true);
    };

    void loadJourneys().catch(() => {
      if (!cancelled) setLoaded(true);
    });

    return () => {
      cancelled = true;
      revokeJourneyObjectUrls(loadedJourneys);
    };
  }, []);

  // Derived state: apply search filter, then derive grouping for current mode
  const filteredJourneys = useMemo(
    () => filterJourneysBySearch(archived, searchQuery),
    [archived, searchQuery]
  );

  const timelineData = useMemo(
    () => groupJourneysByYearMonth(filteredJourneys),
    [filteredJourneys]
  );

  const placesData = useMemo(
    () => groupJourneysByProvinceCity(filteredJourneys),
    [filteredJourneys]
  );

  const hasArchivedJourneys = archived.length > 0;
  const showSearchEmpty = hasArchivedJourneys && searchQuery && filteredJourneys.length === 0;

  // ---- Loading state ----
  if (!loaded) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="min-h-screen">
      <TopNav />

      <main className="mx-auto max-w-7xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        {/* Memory Library Header */}
        <section className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
                Your memories
              </h1>
              <p className="mt-2 text-[15px] text-muted leading-relaxed">
                A calm archive for the journeys you want to remember.
              </p>
            </div>
            <Link
              href="/journeys/new"
              className="shrink-0 rounded-button bg-foreground px-5 py-2.5 text-sm font-medium text-white transition hover:bg-foreground/85"
            >
              + New Journey
            </Link>
          </div>
        </section>

        {/* No journeys at all */}
        {!hasArchivedJourneys ? (
          <EmptyState />
        ) : (
          <>
            {/* Search */}
            <section className="mb-6">
              <MemorySearch value={searchQuery} onChange={setSearchQuery} />
            </section>

            {/* Browse mode tabs */}
            <section className="mb-9">
              <SegmentedTabs
                tabs={BROWSE_TABS}
                active={mode}
                onChange={(key) => setMode(key as BrowseMode)}
              />
            </section>

            {/* Search empty state */}
            {showSearchEmpty ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 text-5xl">🔍</div>
                <h2 className="mb-2 text-xl font-semibold text-foreground">
                  No memories found.
                </h2>
                <p className="max-w-sm text-[15px] text-muted leading-relaxed">
                  Try searching by place, people, or memory.
                </p>
              </div>
            ) : mode === "recent" ? (
              <JourneyGrid journeys={filteredJourneys} settings={settings} />
            ) : mode === "timeline" ? (
              <TimelineJourneyGroups
                groups={timelineData.groups}
                undated={timelineData.undated}
                settings={settings}
              />
            ) : (
              <PlaceJourneyGroups
                groups={placesData.groups}
                otherPlaces={placesData.otherPlaces}
                settings={settings}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
