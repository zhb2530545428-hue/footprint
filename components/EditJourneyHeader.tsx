"use client";

import { useRouter } from "next/navigation";

interface EditJourneyHeaderProps {
  journeyId: string;
}

export default function EditJourneyHeader({ journeyId }: EditJourneyHeaderProps) {
  const router = useRouter();

  return (
    <section className="mb-12">
      <h1 className="text-[28px] font-semibold tracking-tight text-foreground lg:text-[34px]">
        Edit Journey
      </h1>
      <p className="mt-2 text-[15px] text-muted max-w-lg leading-relaxed">
        Refine the memory before it becomes part of your archive.
      </p>
      <button
        onClick={() => router.push(`/journeys/${journeyId}`)}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition hover:text-foreground"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M8.75 3.5L5.25 7L8.75 10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        View journey
      </button>
    </section>
  );
}
