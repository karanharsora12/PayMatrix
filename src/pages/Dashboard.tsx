import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { useDashboardSummary } from "@/hooks/useDashboard";
import { useAuth } from "@/context/AuthContext";
import type { DashboardPeriod } from "@/api/dashboard";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { AttendanceTrendCard, TodayAttendanceCard } from "@/components/dashboard/AttendanceCards";
import { PayrollCard } from "@/components/dashboard/PayrollCard";
import { LeaveCard } from "@/components/dashboard/LeaveCard";
import { WorkforceCard } from "@/components/dashboard/WorkforceCard";
import { DocumentsCard } from "@/components/dashboard/DocumentsCard";
import { EventsCard } from "@/components/dashboard/EventsCard";
import { ActivityCard } from "@/components/dashboard/ActivityCard";
import { SelfCard } from "@/components/dashboard/SelfCard";

const PERIOD_LABEL: Record<DashboardPeriod, string> = {
  day: "Today",
  week: "Last 7 days",
  month: "This month",
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-[110px] animate-pulse bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 h-[340px] animate-pulse bg-muted" />
        <Card className="col-span-12 lg:col-span-4 h-[340px] animate-pulse bg-muted" />
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-7 h-[320px] animate-pulse bg-muted" />
        <Card className="col-span-12 lg:col-span-5 h-[320px] animate-pulse bg-muted" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const { data, isLoading, isError, isFetching, refetch } = useDashboardSummary(period);
  const { user } = useAuth();

  if (isLoading) return <SkeletonBlock />;

  const summary = data;
  const errorKeys = summary ? Object.entries(summary.errors) : [];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}, {user?.name || user?.email?.split("@")[0] || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {summary
              ? `Live overview for ${summary.range.from} → ${summary.range.to}`
              : "Loading your workforce overview…"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as DashboardPeriod)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Dashboard API is unreachable — showing the last known data.
        </div>
      )}

      {errorKeys.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>Some sections could not be loaded:</span>
          {errorKeys.map(([key, message]) => (
            <Badge key={key} variant="outline" className="border-red-300 text-red-700">
              {key}: {message}
            </Badge>
          ))}
        </div>
      )}

      {summary && <KpiGrid summary={summary} />}

      {summary && (
        <div className="grid grid-cols-12 gap-4">
          {summary.access.attendance && summary.attendance && (
            <div className="col-span-12 lg:col-span-8">
              <AttendanceTrendCard attendance={summary.attendance} period={period} />
            </div>
          )}
          {summary.access.leave && summary.leave && (
            <div className={summary.access.attendance ? "col-span-12 lg:col-span-4" : "col-span-12 lg:col-span-6"}>
              <LeaveCard leave={summary.leave} rangeLabel={PERIOD_LABEL[period]} />
            </div>
          )}

          {summary.access.attendance && summary.attendance && (
            <div className="col-span-12 lg:col-span-7">
              <TodayAttendanceCard attendance={summary.attendance} />
            </div>
          )}
          {summary.access.payroll && summary.payroll && (
            <div
              className={
                summary.access.attendance ? "col-span-12 lg:col-span-5" : "col-span-12 lg:col-span-7"
              }
            >
              <PayrollCard payroll={summary.payroll} />
            </div>
          )}

          {summary.access.employees && summary.employees && (
            <div className="col-span-12 lg:col-span-4">
              <WorkforceCard employees={summary.employees} />
            </div>
          )}
          {summary.access.documents && summary.documents && (
            <div className="col-span-12 lg:col-span-4">
              <DocumentsCard documents={summary.documents} />
            </div>
          )}
          {summary.self && (
            <div className="col-span-12 lg:col-span-4">
              <SelfCard self={summary.self} />
            </div>
          )}

          {summary.events && (
            <div className="col-span-12 lg:col-span-6">
              <EventsCard events={summary.events} />
            </div>
          )}
          {summary.access.activity && summary.activity && (
            <div className="col-span-12 lg:col-span-6">
              <ActivityCard activity={summary.activity} />
            </div>
          )}
        </div>
      )}

      {summary && !summary.access.attendance && !summary.access.payroll && !summary.access.employees && (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">No modules assigned to your role</div>
            <div className="mt-1 max-w-md text-xs text-muted-foreground">
              Ask an administrator to grant permissions for attendance, payroll or employee data to
              see them on this dashboard.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
