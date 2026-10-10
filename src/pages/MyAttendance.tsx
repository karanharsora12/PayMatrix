import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  History,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { PunchWidget } from "@/components/attendance/PunchWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  useMyAttendanceHistory,
  useAttendanceCalendar,
} from "@/hooks/useAttendance";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDateFloatingFilter } from "@/components/common/GridDateFloatingFilter";
import type { ColDef } from "ag-grid-community";

export default function MyAttendance() {
  const { user } = useAuth();
  const currentEmployeeId = user?.employeeId || user?.employee?.id || "";

  const today = new Date().toISOString().substring(0, 10);
  const currentMonthStr = today.substring(0, 7);

  // Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(currentMonthStr);

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    refetch: refetchHistory,
  } = useMyAttendanceHistory({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    status: statusFilter || undefined,
  });

  const { data: calendarData, isLoading: isCalendarLoading } =
    useAttendanceCalendar({
      employeeId: currentEmployeeId,
      month: calendarMonth,
    });

  const records = historyData?.data ?? [];

  const formatTime = (iso?: string | null) => {
    if (!iso) return "--:--";
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Present
          </Badge>
        );
      case "LATE":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Late
          </Badge>
        );
      case "HALF_DAY":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
            Half Day
          </Badge>
        );
      case "ON_LEAVE":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            On Leave
          </Badge>
        );
      case "HOLIDAY":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            Holiday
          </Badge>
        );
      case "WEEK_OFF":
        return (
          <Badge className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            Week Off
          </Badge>
        );
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const colDefs: ColDef[] = [
    {
      field: "attendanceDate",
      headerName: "Date",
      width: 130,
      valueFormatter: (p) => {
        if (!p.value) return "";
        if (p.value.includes("-")) {
          const [year, month, day] = p.value.split("T")[0].split("-");
          return `${day}/${month}/${year}`;
        }
        return p.value;
      },
      filter: "agTextColumnFilter",
      floatingFilterComponent: GridDateFloatingFilter,
    },
    {
      field: "checkIn",
      headerName: "Punch In",
      width: 120,
      cellRenderer: (p: any) => (
        <span className="font-mono text-xs">{formatTime(p.value)}</span>
      ),
    },
    {
      field: "checkOut",
      headerName: "Punch Out",
      width: 120,
      cellRenderer: (p: any) => (
        <span className="font-mono text-xs">{formatTime(p.value)}</span>
      ),
    },
    {
      field: "workingMinutes",
      headerName: "Hours Worked",
      width: 130,
      cellRenderer: (p: any) => {
        if (!p.value) return "--";
        const h = Math.floor(p.value / 60);
        const m = p.value % 60;
        return (
          <span className="font-mono text-xs font-semibold">
            {h}h {m}m
          </span>
        );
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (p: any) => getStatusBadge(p.value),
    },
    {
      field: "remarks",
      headerName: "Remarks",
      flex: 1,
      minWidth: 160,
      cellRenderer: (p: any) => (
        <span className="text-xs text-muted-foreground">{p.value || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Record your daily punches and review your attendance history.
        </p>
      </div>

      {/* Punch In / Out Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PunchWidget onPunchSuccess={() => refetchHistory()} />
        </div>

        {/* Quick Tips / Instructions */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Attendance Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Punch In:</span>{" "}
                  Remember to punch in when beginning your workday. Your time is recorded automatically by the server.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Punch Out:</span>{" "}
                  Don't forget to punch out when concluding your work. Your working duration and status are calculated automatically based on your shift rules.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Missing Punches:</span>{" "}
                  If you forgot to punch in or punch out, contact your reporting manager or attendance administrator to request a manual correction.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* History and Calendar Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Attendance History
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Monthly Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader className="py-3.5 px-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm font-semibold">Past Records</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  placeholder="From Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  className="h-8 text-xs w-36"
                  placeholder="To Date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
                {(fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[480px]">
                <DataGrid
                  rowData={records}
                  columnDefs={colDefs}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="py-3.5 px-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Monthly Calendar</CardTitle>
              <Input
                type="month"
                className="h-8 text-xs w-40"
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(e.target.value)}
              />
            </CardHeader>
            <CardContent className="p-4">
              {isCalendarLoading ? (
                <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
                  Loading calendar...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {(calendarData || []).map((rec: any) => (
                    <div
                      key={rec.id || rec.attendanceDate}
                      className="border rounded-lg p-2.5 bg-card flex flex-col justify-between min-h-[75px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-foreground">
                          {rec.attendanceDate?.slice(8)}
                        </span>
                        {getStatusBadge(rec.status)}
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground mt-1">
                        {rec.checkIn ? formatTime(rec.checkIn) : "--"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
