import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdCard, Clock } from "lucide-react";
import type { DashboardSelf } from "@/api/dashboard";
import { EmptyState, StatusBadge } from "./helpers";
import { formatTime } from "./format";

export function SelfCard({ self }: { self: DashboardSelf }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Day</CardTitle>
        <Badge variant="outline">{self.employeeCode ?? "Employee"}</Badge>
      </CardHeader>
      <CardContent>
        {!self.department && !self.designation && !self.shift && !self.todayAttendance ? (
          <EmptyState
            icon={IdCard}
            title="Profile incomplete"
            description="Department, shift and attendance details will appear here once assigned."
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium">{self.name}</div>
              <div className="text-xs text-muted-foreground">
                {[self.department, self.designation, self.branch].filter(Boolean).join(" • ") ||
                  "No department assigned"}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Shift
              </div>
              <div className="mt-1 text-sm">
                {self.shift
                  ? `${self.shift.name} • ${self.shift.startTime}–${self.shift.endTime}`
                  : "No shift assigned"}
              </div>
            </div>

            <div className="rounded-lg border p-3">
              <div className="text-xs font-medium text-muted-foreground">Today</div>
              {self.todayAttendance ? (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <StatusBadge status={self.todayAttendance.status} />
                  <span className="text-muted-foreground">
                    {formatTime(self.todayAttendance.checkIn)} →{" "}
                    {formatTime(self.todayAttendance.checkOut)}
                  </span>
                </div>
              ) : (
                <div className="mt-1 text-sm text-muted-foreground">
                  Attendance not marked yet
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
