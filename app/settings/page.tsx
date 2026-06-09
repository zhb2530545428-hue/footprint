"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { FootprintSettings } from "@/lib/settings";
import { getSettings, saveSettings } from "@/lib/settings";
import TopNav from "@/components/TopNav";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<FootprintSettings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) {
    return (
      <div>
        <TopNav />
        <div className="flex items-center justify-center py-32">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-accent" />
        </div>
      </div>
    );
  }

  const toggle = (key: "showLocation" | "showTime" | "showCompanions") => {
    const next: FootprintSettings = {
      ...settings,
      homepageCard: {
        ...settings.homepageCard,
        [key]: !settings.homepageCard[key],
      },
    };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-2xl px-page-mobile py-10 lg:px-page-desktop lg:py-14">
        <h1 className="mb-2 text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
          Settings
        </h1>
        <p className="mb-10 text-[15px] text-muted">
          Customize how your Footprints appear.
        </p>

        <section className="rounded-panel border border-border bg-white px-6 py-6">
          <h2 className="mb-1 text-[17px] font-semibold text-foreground">
            Homepage Card Display
          </h2>
          <p className="mb-5 text-[14px] text-muted leading-relaxed">
            Choose which Journey metadata appears on homepage cards.
          </p>

          <div className="space-y-4">
            {/* Show location */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showLocation}
                  onChange={() => toggle("showLocation")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show location</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Kyoto, Japan</span>
              </div>
            </label>

            {/* Show time */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showTime}
                  onChange={() => toggle("showTime")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show time</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Nov 15 – 22, 2025</span>
              </div>
            </label>

            {/* Show companions */}
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.homepageCard.showCompanions}
                  onChange={() => toggle("showCompanions")}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-accent" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-foreground">Show companions</span>
                <span className="ml-2 text-[13px] text-muted">e.g. Yuki, Mei</span>
              </div>
            </label>
          </div>
        </section>

        {/* Saved indicator */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="rounded-button border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-surface"
          >
            Back to Home
          </button>
          {saved && (
            <span className="text-[14px] text-accent transition-opacity">
              Saved
            </span>
          )}
        </div>
      </main>
    </div>
  );
}
