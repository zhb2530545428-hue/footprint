export interface FootprintSettings {
  homepageCard: {
    showLocation: boolean;
    showTime: boolean;
    showCompanions: boolean;
  };
}

const SETTINGS_KEY = "footprint.settings";

const DEFAULT_SETTINGS: FootprintSettings = {
  homepageCard: {
    showLocation: true,
    showTime: true,
    showCompanions: true,
  },
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSettings(): FootprintSettings {
  if (!isBrowser()) return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_SETTINGS };
    const obj = parsed as Record<string, unknown>;
    const homepageCard = obj.homepageCard as Record<string, unknown> | undefined;
    return {
      homepageCard: {
        showLocation: typeof homepageCard?.showLocation === "boolean" ? homepageCard.showLocation : true,
        showTime: typeof homepageCard?.showTime === "boolean" ? homepageCard.showTime : true,
        showCompanions: typeof homepageCard?.showCompanions === "boolean" ? homepageCard.showCompanions : true,
      },
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: FootprintSettings): void {
  if (!isBrowser()) return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
