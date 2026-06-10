import type { Journey } from "@/lib/types";
import type { FootprintSettings } from "@/lib/settings";
import type { PlaceGroup } from "@/lib/browseModes";
import JourneyCard from "./JourneyCard";

interface PlaceJourneyGroupsProps {
  groups: PlaceGroup[];
  otherPlaces: Journey[];
  settings: FootprintSettings;
}

function CitySection({
  city,
  journeys,
  settings,
}: {
  city: string;
  journeys: Journey[];
  settings: FootprintSettings;
}) {
  return (
    <section className="relative grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-x-8">
      <span
        aria-hidden="true"
        className="absolute left-[68px] top-[7px] z-10 h-[9px] w-[9px] rounded-full border-2 border-foreground bg-white sm:left-[104px]"
      />
      <h3 className="pr-4 text-right text-[15px] font-medium leading-6 text-muted sm:pr-5 sm:text-[16px]">
        {city}
      </h3>
      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {journeys.map((journey) => (
          <JourneyCard
            key={journey.id}
            journey={journey}
            settings={settings}
          />
        ))}
      </div>
    </section>
  );
}

export default function PlaceJourneyGroups({
  groups,
  otherPlaces,
  settings,
}: PlaceJourneyGroupsProps) {
  if (groups.length === 0 && otherPlaces.length === 0) return null;

  return (
    <div className="space-y-16">
      {groups.map((group) => (
        <section key={group.province}>
          <h2 className="mb-8 text-[26px] font-semibold tracking-tight text-foreground">
            {group.province}
          </h2>
          <div
            data-place-axis="true"
            className="relative space-y-12 before:absolute before:bottom-0 before:left-[72px] before:top-2 before:w-px before:bg-border sm:before:left-[108px]"
          >
            {group.cities.map((cityGroup) => (
              <CitySection
                key={cityGroup.city}
                city={cityGroup.city}
                journeys={cityGroup.journeys}
                settings={settings}
              />
            ))}
          </div>
        </section>
      ))}

      {otherPlaces.length > 0 && (
        <section>
          <h2 className="mb-8 text-[26px] font-semibold tracking-tight text-foreground">
            Other places
          </h2>
          <div
            data-place-axis="true"
            className="relative before:absolute before:bottom-0 before:left-[72px] before:top-2 before:w-px before:bg-border sm:before:left-[108px]"
          >
            <CitySection
              city="Memories"
              journeys={otherPlaces}
              settings={settings}
            />
          </div>
        </section>
      )}
    </div>
  );
}
