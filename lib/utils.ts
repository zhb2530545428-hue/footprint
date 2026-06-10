/** Generate a simple unique id */
export function generateId(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Format a date string to a readable form */
export function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format a date range like "Jun 12 – 18, 2025" or "Dec 28, 2025 – Jan 3, 2026" */
export function formatDateRange(start?: string, end?: string): string {
  if (!start && !end) return "";
  if (!end) return formatDate(start);
  if (!start) return formatDate(end);

  const s = parseDate(start);
  const e = parseDate(end);

  const sameYear = s.getFullYear() === e.getFullYear();
  const sameMonth = sameYear && s.getMonth() === e.getMonth();

  const sDay = s.getDate();
  const eDay = e.getDate();
  const sMonth = s.toLocaleDateString("en-US", { month: "short" });
  const eMonth = e.toLocaleDateString("en-US", { month: "short" });
  const year = s.getFullYear();

  if (sameMonth) {
    return `${sMonth} ${sDay} – ${eDay}, ${year}`;
  }
  if (sameYear) {
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${year}`;
  }
  return `${sMonth} ${sDay}, ${s.getFullYear()} – ${eMonth} ${eDay}, ${e.getFullYear()}`;
}

/** Format structured China location fields into a display string like "浙江 · 杭州 / 湖州 · 西湖区" */
export function formatJourneyLocation(input: {
  province?: string;
  cities?: string[];
  city?: string;
  address?: string;
  fallback?: string;
}): string {
  const cityNames = input.cities?.length
    ? input.cities
    : input.city
      ? [input.city]
      : [];

  const cityText = cityNames
    .map((city) => city.trim())
    .filter(Boolean)
    .join(" / ");

  const parts = [input.province, cityText, input.address]
    .map((part) => part?.trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : input.fallback?.trim() ?? "";
}

/** Derive a display title: prefer explicit title, else location + year */
export function deriveTitle(title?: string, location?: string, startDate?: string): string {
  if (title?.trim()) return title.trim();
  const year = startDate ? parseDate(startDate).getFullYear() : "";
  const loc = location?.trim() ?? "";
  if (loc && year) return `${loc} ${year}`;
  if (loc) return loc;
  return "Untitled Journey";
}
