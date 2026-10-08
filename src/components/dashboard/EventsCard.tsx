import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Cake, Gift, PartyPopper } from "lucide-react";
import type { DashboardEvents } from "@/api/dashboard";
import { EmptyState } from "./helpers";
import { formatDate } from "@/lib/utils";

export function EventsCard({ events }: { events: DashboardEvents }) {
  const total = events.holidays.length + events.birthdays.length + events.anniversaries.length;

  if (total === 0) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={PartyPopper}
            title="Nothing coming up"
            description="Birthdays, work anniversaries and holidays in the next 30 days will appear here."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.anniversaries.map((a) => (
          <div
            key={`a-${a.employeeId}-${a.date}`}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
              <Gift className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium">{a.name}</div>
              <div className="text-xs text-muted-foreground">
                Work anniversary • {a.years} {a.years === 1 ? "year" : "years"} •{" "}
                {formatDate(a.date)}
              </div>
            </div>
          </div>
        ))}

        {events.birthdays.map((b) => (
          <div
            key={`b-${b.employeeId}-${b.date}`}
            className="flex items-center gap-3 rounded-lg border p-3"
          >
            <div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center">
              <Cake className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <div className="text-sm font-medium">{b.name}</div>
              <div className="text-xs text-muted-foreground">
                Birthday • turning {b.turning} • {formatDate(b.date)}
              </div>
            </div>
          </div>
        ))}

        {events.holidays.map((h) => (
          <div key={h.id} className="flex items-center gap-3 rounded-lg border p-3">
            <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <div className="text-sm font-medium">{h.name}</div>
              <div className="text-xs text-muted-foreground">
                Holiday • {h.type} • {formatDate(h.date)}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
