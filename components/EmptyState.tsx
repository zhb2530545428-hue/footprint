import Link from "next/link";

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="mb-6 text-6xl">🏕️</div>
      <h2 className="mb-3 text-2xl font-semibold text-foreground">
        No footprints yet
      </h2>
      <p className="mb-8 max-w-sm text-base text-muted leading-relaxed">
        Create your first journey and turn photos into memories.
      </p>
      <Link
        href="/journeys/new"
        className="rounded-button bg-accent px-6 py-3 text-sm font-medium text-white transition hover:bg-accent/85"
      >
        New Journey
      </Link>
    </div>
  );
}
