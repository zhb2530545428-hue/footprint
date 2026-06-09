"use client";

import { useState } from "react";

interface JourneyFormData {
  title: string;
  location: string;
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
  const [form, setForm] = useState<JourneyFormData>({
    title: initial?.title ?? "",
    location: initial?.location ?? "",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    companions: initial?.companions ?? "",
    notes: initial?.notes ?? "",
  });

  const update = (field: keyof JourneyFormData, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    onChange(next);
  };

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
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          className={inputClass}
        />
        <p className="mt-1 text-[13px] text-muted">
          Leave blank to auto-generate from location and date
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Location <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Kyoto, Japan"
          value={form.location}
          onChange={(e) => update("location", e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-foreground">
            Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update("startDate", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[14px] font-medium text-foreground">
            End Date
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update("endDate", e.target.value)}
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
          value={form.companions}
          onChange={(e) => update("companions", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[14px] font-medium text-foreground">
          Notes
        </label>
        <textarea
          placeholder="What made this trip special?"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
          rows={3}
          className={inputClass + " resize-none"}
        />
      </div>
    </div>
  );
}

export type { JourneyFormData };
