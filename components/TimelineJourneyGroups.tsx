import type { Journey } from "@/lib/types";
import type { FootprintSettings } from "@/lib/settings";
import type { TimelineGroup } from "@/lib/browseModes";
import { groupTimelineGroupsByYear } from "@/lib/browseModes";
import JourneyCard from "./JourneyCard";

interface TimelineJourneyGroupsProps {
  groups: TimelineGroup[];
  undated: Journey[];
  settings: FootprintSettings;
}

export default function TimelineJourneyGroups({
  groups,
  undated,
  settings,
}: TimelineJourneyGroupsProps) {
  if (groups.length === 0 && undated.length === 0) return null;

  const yearGroups = groupTimelineGroupsByYear(groups);

  return (
    <div className="space-y-16">
      {yearGroups.map((yearGroup) => (
        <section key={yearGroup.year}>
          <h2 className="mb-8 text-[26px] font-semibold tracking-tight text-foreground">
            {yearGroup.year}
          </h2>

          <div className="relative space-y-12 before:absolute before:bottom-0 before:left-[72px] before:top-2 before:w-px before:bg-border sm:before:left-[108px]">
            {yearGroup.months.map((monthGroup) => (
              <section
                key={`${monthGroup.year}-${monthGroup.month}`}
                className="relative grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-x-8"
              >
                <span
                  aria-hidden="true"
                  className="absolute left-[68px] top-[7px] z-10 h-[9px] w-[9px] rounded-full border-2 border-foreground bg-white sm:left-[104px]"
                />
                <h3 className="pr-4 text-right text-[15px] font-medium leading-6 text-muted sm:pr-5 sm:text-[16px]">
                  {monthGroup.monthName}
                </h3>
                <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {monthGroup.journeys.map((journey) => (
                    <JourneyCard
                      key={journey.id}
                      journey={journey}
                      settings={settings}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      ))}

      {undated.length > 0 && (
        <section>
          <h2 className="mb-8 text-[26px] font-semibold tracking-tight text-foreground">
            Undated
          </h2>
          <div className="relative grid grid-cols-[72px_minmax(0,1fr)] gap-x-5 sm:grid-cols-[108px_minmax(0,1fr)] sm:gap-x-8">
            <span
              aria-hidden="true"
              className="absolute left-[68px] top-[7px] h-[9px] w-[9px] rounded-full border-2 border-foreground bg-white sm:left-[104px]"
            />
            <div className="border-r border-border" />
            <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {undated.map((journey) => (
                <JourneyCard
                  key={journey.id}
                  journey={journey}
                  settings={settings}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
