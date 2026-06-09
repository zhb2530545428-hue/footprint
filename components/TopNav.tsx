"use client";

import Link from "next/link";

export default function TopNav() {
  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-page-mobile lg:px-page-desktop">
        <Link
          href="/"
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          Footprint
        </Link>
        <Link
          href="/journeys/new"
          className="rounded-button bg-foreground px-5 py-2 text-sm font-medium text-white transition hover:bg-foreground/85"
        >
          + New Journey
        </Link>
      </div>
    </nav>
  );
}
