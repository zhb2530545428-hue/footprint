"use client";

import { useEffect, useState } from "react";
import type { Journey } from "@/lib/types";
import {
  getJourneys,
  revokeJourneyObjectUrls,
  setJourneys,
} from "@/lib/storage";
import { MOCK_JOURNEYS } from "@/lib/mock-data";
import TopNav from "@/components/TopNav";
import JourneyGrid from "@/components/JourneyGrid";
import EmptyState from "@/components/EmptyState";

export default function HomePage() {
  const [archived, setArchived] = useState<Journey[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let loadedJourneys: Journey[] = [];

    const loadJourneys = async () => {
      let journeys = await getJourneys();

      // Seed mock data on first visit
      if (journeys.length === 0) {
        journeys = MOCK_JOURNEYS;
        await setJourneys(journeys);
      }

      loadedJourneys = journeys;
      if (cancelled) {
        revokeJourneyObjectUrls(journeys);
        return;
      }

      setArchived(journeys.filter((j) => j.status === "archived"));
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

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-7xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-8 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          Your Footprints
        </h1>
        {archived.length === 0 ? (
          <EmptyState />
        ) : (
          <JourneyGrid journeys={archived} />
        )}
      </main>
    </div>
  );
}
