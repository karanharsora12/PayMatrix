import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palmtree } from "lucide-react";
import type { DashboardLeave } from "@/api/dashboard";
import { EmptyState, StatTile } from "./helpers";

export function LeaveCard({ leave, rangeLabel }: { leave: DashboardLeave; rangeLabel: string }) {
  const hasData =
    leave.period.approved + leave.period.pending + leave.period.rejected + leave.period.cancelled >
      0 || leave.onLeaveToday > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leave Snapshot</CardTitle>
        <Badge variant="outline">{rangeLabel}</Badge>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={Palmtree}
            title="No leave activity"
            description="Leave requests and approvals for this period will show up here."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Approved"
                value={leave.period.approved}
                hint={`${leave.period.approvedDays} days`}
                accent="text-emerald-600"
              />
              <StatTile
                label="On Leave Today"
                value={leave.onLeaveToday}
                accent="text-blue-600"
              />
              <StatTile
                label="Pending"
                value={leave.period.pending}
                hint={`${leave.period.pendingDays} days`}
                accent="text-amber-600"
              />
              <StatTile
                label="Rejected"
                value={leave.period.rejected}
                accent="text-red-600"
              />
            </div>

            {leave.byType.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">By leave type</div>
                <div className="space-y-2">
                  {leave.byType.map((t) => (
                    <div
                      key={t.leaveTypeId}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span>{t.name}</span>
                      <Badge variant="secondary">{t.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
