"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CHINA_PROVINCES } from "@/lib/chinaLocations";

export interface ChinaLocationData {
  province: string;
  cities: string[];
  address: string;
}

interface ChinaLocationFieldsProps {
  initial?: Partial<ChinaLocationData>;
  oldLocationFallback?: string;
  onChange: (data: ChinaLocationData) => void;
}

export default function ChinaLocationFields({
  initial,
  oldLocationFallback,
  onChange,
}: ChinaLocationFieldsProps) {
  const [province, setProvince] = useState(initial?.province ?? "");
  const [cities, setCities] = useState<string[]>(initial?.cities ?? []);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // Close city dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(e.target as Node)
      ) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const emit = useCallback(
    (p: string, c: string[], a: string) => {
      onChange({ province: p, cities: c, address: a });
    },
    [onChange]
  );

  const handleProvinceChange = useCallback(
    (value: string) => {
      setProvince(value);
      setCities([]);
      setCityDropdownOpen(false);
      emit(value, [], address);
    },
    [address, emit]
  );

  const toggleCity = useCallback(
    (city: string) => {
      setCities((prev) => {
        const next = prev.includes(city)
          ? prev.filter((c) => c !== city)
          : [...prev, city];
        emit(province, next, address);
        return next;
      });
    },
    [province, address, emit]
  );

  const removeCity = useCallback(
    (city: string) => {
      setCities((prev) => {
        const next = prev.filter((c) => c !== city);
        emit(province, next, address);
        return next;
      });
    },
    [province, address, emit]
  );

  const handleAddressChange = useCallback(
    (value: string) => {
      setAddress(value);
      emit(province, cities, value);
    },
    [province, cities, emit]
  );

  const currentProvinceData = CHINA_PROVINCES.find((p) => p.name === province);
  const cityOptions = currentProvinceData?.cities ?? [];

  const inputClass =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted outline-none transition focus:border-foreground/30";

  const selectClass =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-foreground outline-none transition focus:border-foreground/30 appearance-none cursor-pointer";

  return (
    <div className="space-y-5">
      {/* Old location fallback note */}
      {oldLocationFallback && !province && (
        <p className="text-[13px] text-muted italic">
          Existing location: {oldLocationFallback}
        </p>
      )}

      {/* Province */}
      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Province <span className="text-accent">*</span>
        </label>
        <div className="relative">
          <select
            value={province}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className={selectClass}
          >
            <option value="">Select province</option>
            {CHINA_PROVINCES.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Cities */}
      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Cities <span className="text-accent">*</span>
        </label>

        {!province ? (
          <div className={`${inputClass} text-muted cursor-not-allowed`}>
            Select province first
          </div>
        ) : (
          <>
            {/* City selector dropdown */}
            <div ref={cityDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setCityDropdownOpen((prev) => !prev)}
                className={`${inputClass} text-left flex items-center justify-between`}
              >
                <span className={cities.length === 0 ? "text-muted" : ""}>
                  {cities.length === 0
                    ? "Select cities"
                    : cities.length === 1
                      ? "1 city selected"
                      : `${cities.length} cities selected`}
                </span>
                <svg
                  className={`h-4 w-4 text-muted transition-transform ${cityDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {cityDropdownOpen && (
                <div className="absolute z-20 mt-1.5 w-full max-h-56 overflow-y-auto rounded-xl border border-border bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] py-1.5">
                  {cityOptions.map((city) => {
                    const selected = cities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleCity(city)}
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-[15px] text-left transition hover:bg-surface"
                      >
                        <span
                          className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition ${
                            selected
                              ? "border-accent bg-accent text-white"
                              : "border-muted/40 bg-white"
                          }`}
                        >
                          {selected && (
                            <svg
                              className="h-3 w-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        <span className={selected ? "font-medium text-foreground" : "text-foreground/80"}>
                          {city}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected city chips */}
            {cities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map((city) => (
                  <span
                    key={city}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/20 bg-accent/5 px-3 py-1.5 text-[13px] font-medium text-accent"
                  >
                    {city}
                    <button
                      type="button"
                      onClick={() => removeCity(city)}
                      className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-accent/60 transition hover:bg-accent/15 hover:text-accent"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Detailed address */}
      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Detailed address <span className="text-[13px] text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. 洱海、丽江古城、香格里拉路线上"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          className={inputClass}
        />
      </div>
    </div>
  );
}
