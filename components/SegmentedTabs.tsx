"use client";

interface SegmentedTabsProps {
  tabs: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export default function SegmentedTabs({
  tabs,
  active,
  onChange,
}: SegmentedTabsProps) {
  return (
    <div className="inline-flex min-w-max rounded-xl bg-surface p-1">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.key}
          onClick={() => onChange(tab.key)}
          aria-pressed={active === tab.key}
          className={`rounded-lg px-3 py-2 text-[14px] font-medium transition sm:px-4 ${
            active === tab.key
              ? "bg-white text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
