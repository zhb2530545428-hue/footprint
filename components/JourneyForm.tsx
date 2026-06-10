"use client";

import { useState, useCallback } from "react";
import ChinaLocationFields from "@/components/ChinaLocationFields";
import type { ChinaLocationData } from "@/components/ChinaLocationFields";
import { formatJourneyLocation } from "@/lib/utils";

interface JourneyFormData {
  title: string;
  location: string;
  locationProvince: string;
  locationCities: string[];
  locationAddress: string;
  startDate: string;
  endDate: string;
  companions: string;
  notes: string;
}

interface JourneyFormProps {
  initial?: Partial<JourneyFormData>;
  onChange: (data: JourneyFormData) => void;
}

export default function JourneyForm({ initial, onChange }: JourneyFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [companions, setCompanions] = useState(initial?.companions ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  // Location structured state
  const [locationProvince, setLocationProvince] = useState(
    initial?.locationProvince ?? ""
  );
  const [locationCities, setLocationCities] = useState<string[]>(
    initial?.locationCities ?? []
  );
  const [locationAddress, setLocationAddress] = useState(
    initial?.locationAddress ?? ""
  );

  const oldLocationFallback = !initial?.locationProvince
    ? initial?.location
    : undefined;

  const buildAndEmit = useCallback(
    (
      titleVal: string,
      province: string,
      cities: string[],
      address: string,
      start: string,
      end: string,
      comps: string,
      n: string
    ) => {
      const displayLocation = formatJourneyLocation({
        province,
        cities,
        address,
        fallback: oldLocationFallback,
      });

      onChange({
        title: titleVal,
        location: displayLocation,
        locationProvince: province,
        locationCities: cities,
        locationAddress: address,
        startDate: start,
        endDate: end,
        companions: comps,
        notes: n,
      });
    },
    [onChange, oldLocationFallback]
  );

  const handleLocationChange = useCallback(
    (data: ChinaLocationData) => {
      setLocationProvince(data.province);
      setLocationCities(data.cities);
      setLocationAddress(data.address);
      buildAndEmit(
        title,
        data.province,
        data.cities,
        data.address,
        startDate,
        endDate,
        companions,
        notes
      );
    },
    [title, startDate, endDate, companions, notes, buildAndEmit]
  );

  const handleTitleChange = useCallback(
    (val: string) => {
      setTitle(val);
      buildAndEmit(
        val,
        locationProvince,
        locationCities,
        locationAddress,
        startDate,
        endDate,
        companions,
        notes
      );
    },
    [locationProvince, locationCities, locationAddress, startDate, endDate, companions, notes, buildAndEmit]
  );

  const handleStartDateChange = useCallback(
    (val: string) => {
      setStartDate(val);
      buildAndEmit(
        title,
        locationProvince,
        locationCities,
        locationAddress,
        val,
        endDate,
        companions,
        notes
      );
    },
    [title, locationProvince, locationCities, locationAddress, endDate, companions, notes, buildAndEmit]
  );

  const handleEndDateChange = useCallback(
    (val: string) => {
      setEndDate(val);
      buildAndEmit(
        title,
        locationProvince,
        locationCities,
        locationAddress,
        startDate,
        val,
        companions,
        notes
      );
    },
    [title, locationProvince, locationCities, locationAddress, startDate, companions, notes, buildAndEmit]
  );

  const handleCompanionsChange = useCallback(
    (val: string) => {
      setCompanions(val);
      buildAndEmit(
        title,
        locationProvince,
        locationCities,
        locationAddress,
        startDate,
        endDate,
        val,
        notes
      );
    },
    [title, locationProvince, locationCities, locationAddress, startDate, endDate, notes, buildAndEmit]
  );

  const handleNotesChange = useCallback(
    (val: string) => {
      setNotes(val);
      buildAndEmit(
        title,
        locationProvince,
        locationCities,
        locationAddress,
        startDate,
        endDate,
        companions,
        val
      );
    },
    [title, locationProvince, locationCities, locationAddress, startDate, endDate, companions, buildAndEmit]
  );

  const inputClass =
    "w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted outline-none transition focus:border-foreground/30";

  return (
    <div className="space-y-5">
      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Journey Title
        </label>
        <input
          type="text"
          placeholder="e.g. Kyoto Autumn Leaves"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-[13px] text-muted">
          Leave blank to auto-generate from location and date
        </p>
      </div>

      {/* Structured China location fields */}
      <ChinaLocationFields
        initial={{
          province: locationProvince,
          cities: locationCities,
          address: locationAddress,
        }}
        oldLocationFallback={oldLocationFallback}
        onChange={handleLocationChange}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-foreground">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-foreground">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Companions
        </label>
        <input
          type="text"
          placeholder="e.g. Alex, Sam (comma separated)"
          value={companions}
          onChange={(e) => handleCompanionsChange(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Notes
        </label>
        <textarea
          placeholder="What made this trip special?"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>
    </div>
  );
}

export type { JourneyFormData };
