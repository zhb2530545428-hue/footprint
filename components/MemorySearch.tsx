"use client";

interface MemorySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MemorySearch({ value, onChange }: MemorySearchProps) {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by place, people, or memory…"
        aria-label="Search journeys"
        className="w-full rounded-xl border border-border bg-white px-4 py-3 pr-10 text-[15px] text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/10 transition"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] leading-none text-muted hover:text-foreground transition"
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
