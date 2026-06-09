import type { Journey } from "@/lib/types";
import JourneyCard from "./JourneyCard";

interface JourneyGridProps {
  journeys: Journey[];
}

export default function JourneyGrid({ journeys }: JourneyGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {journeys.map((journey) => (
        <JourneyCard key={journey.id} journey={journey} />
      ))}
    </div>
  );
}
