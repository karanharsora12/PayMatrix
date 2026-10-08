import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarCheck, Users } from "lucide-react";
import type { DashboardAttendance, DashboardPeriod } from "@/api/dashboard";
import { EmptyState, StatusBadge } from "./helpers";
import { formatTime } from "./format";

const COLORS = {
  present: "#10b981",
  onLeave: "#3b82f6",
  absent: "#ef4444",
  weekOff: "#94a3b8",
};

export function AttendanceTrendCard({
  attendance,
  period,
}: {
  attendance: DashboardAttendance;
  period: DashboardPeriod;
}) {
  const label = period === "day" ? "Today" : period === "week" ? "Last 7 days" : "This month";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Attendance Trend</CardTitle>
        <Badge variant="outline">{label}</Badge>
      </CardHeader>
      <CardContent className="h-[280px]">
        {attendance.series.length === 0 || attendance.todayRowsTotal === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance recorded"
            description="Attendance will appear here once employees start marking their day."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendance.series}>
              <XAxis dataKey="date" fontSize={11} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis fontSize={11} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="presentTotal" stackId="a" name="Present" fill={COLORS.present} />
              <Bar dataKey="onLeave" stackId="a" name="On Leave" fill={COLORS.onLeave} />
              <Bar dataKey="absent" stackId="a" name="Absent" fill={COLORS.absent} />
              <Bar dataKey="weekOff" stackId="a" name="Week Off" fill={COLORS.weekOff} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function TodayAttendanceCard({ attendance }: { attendance: DashboardAttendance }) {
  const { today, todayRows, todayRowsTotal } = attendance;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Today's Attendance</CardTitle>
        <Badge variant="outline">{today.date}</Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-emerald-50 p-3">
            <div className="text-lg font-semibold text-emerald-700">{today.present}</div>
            <div className="text-xs text-emerald-700/80">Present</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-lg font-semibold text-red-700">{today.absent}</div>
            <div className="text-xs text-red-700/80">Absent</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-lg font-semibold text-blue-700">{today.onLeave}</div>
            <div className="text-xs text-blue-700/80">On Leave</div>
          </div>
          <div className="rounded-lg bg-orange-50 p-3">
            <div className="text-lg font-semibold text-orange-700">{today.late + today.halfDay}</div>
            <div className="text-xs text-orange-700/80">Late / Half Day</div>
          </div>
        </div>

        {todayRows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No records for today"
            description="Records will show up as soon as check-ins are recorded."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Employee</th>
                  <th className="py-2 pr-3 font-medium">Department</th>
                  <th className="py-2 pr-3 font-medium">Shift</th>
                  <th className="py-2 pr-3 font-medium">In</th>
                  <th className="py-2 pr-3 font-medium">Out</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayRows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{row.employeeName}</div>
                      <div className="text-xs text-muted-foreground">{row.employeeCode}</div>
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{row.department ?? "—"}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {row.shift
                        ? `${row.shift.name} (${row.shift.startTime}–${row.shift.endTime})`
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{formatTime(row.checkIn)}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{formatTime(row.checkOut)}</td>
                    <td className="py-2">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {todayRowsTotal > todayRows.length && (
              <div className="pt-2 text-right text-xs text-muted-foreground">
                Showing {todayRows.length} of {todayRowsTotal}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
