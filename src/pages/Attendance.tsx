import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataGrid } from "@/components/common/DataGrid";
import { DatePicker } from "@/components/common";
import type { ColDef } from "ag-grid-community";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  Fingerprint,
  Plus,
  Pencil,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAttendance,
  useAttendanceSummary,
  useAttendanceCalendar,
  useAttendanceLogs,
  useCreateAttendance,
  useUpdateAttendance,
  useRecordPunch,
} from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import type { AttendanceRecord } from "@/api/attendance";
import { useAuth } from "@/context/AuthContext";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { ShieldAlert, User } from "lucide-react";

export default function Attendance() {
  const today = new Date().toISOString().substring(0, 10);
  const currentMonthStr = today.substring(0, 7);

  // Filters
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(currentMonthStr);

  const { user } = useAuth();
  const canManageAttendance = useSelector(
    (state: RootState) => state.userParameters.CanManageAttendance,
  );
  const currentEmployeeId = user?.employeeId || user?.employee?.id || "";
  const effectiveFilterEmployeeId = canManageAttendance
    ? filterEmployeeId
    : currentEmployeeId;

  // Queries
  const {
    data: attendanceData,
    isLoading: tableLoading,
    refetch,
  } = useAttendance({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    employeeId: effectiveFilterEmployeeId || undefined,
    status: filterStatus || undefined,
    pageSize: 50,
  });
  const records = attendanceData?.data ?? [];

  const { data: summary } = useAttendanceSummary({
    date: fromDate === toDate ? fromDate : undefined,
    fromDate: fromDate !== toDate ? fromDate : undefined,
    toDate: fromDate !== toDate ? toDate : undefined,
  });

  const { data: calendarRecords } = useAttendanceCalendar({
    month: calendarMonth,
    employeeId: effectiveFilterEmployeeId || undefined,
  });

  const { data: punchLogs } = useAttendanceLogs({
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    employeeId: effectiveFilterEmployeeId || undefined,
  });

  const { data: employeesData } = useEmployees({ pageSize: 100 });
  const employees = employeesData?.data ?? [];

  const employeeOptions = useMemo(() => {
    if (!canManageAttendance && currentEmployeeId) {
      const selfEmp =
        employees.find((e: any) => e.id === currentEmployeeId) ||
        user?.employee;
      const firstName =
        selfEmp?.firstName || user?.name?.split(" ")[0] || "User";
      const lastName = selfEmp?.lastName || "";
      const code = (selfEmp as any)?.employeeCode
        ? ` (${(selfEmp as any).employeeCode})`
        : "";
      return [
        {
          value: currentEmployeeId,
          label: `${firstName} ${lastName}${code}`.trim(),
        },
      ];
    }
    return employees.map((e: any) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
    }));
  }, [employees, canManageAttendance, currentEmployeeId, user]);

  const statusOptions = useMemo(
    () => [
      { value: "PRESENT", label: "PRESENT" },
      { value: "HALF_DAY", label: "HALF_DAY" },
      { value: "LATE", label: "LATE" },
      { value: "ON_LEAVE", label: "ON_LEAVE" },
      { value: "HOLIDAY", label: "HOLIDAY" },
      { value: "WEEK_OFF", label: "WEEK_OFF" },
      { value: "ABSENT", label: "ABSENT" },
    ],
    [],
  );

  const filterStatusOptions = useMemo(
    () => [
      { value: "", label: "All Statuses" },
      { value: "PRESENT", label: "Present" },
      { value: "LATE", label: "Late" },
      { value: "HALF_DAY", label: "Half Day" },
      { value: "ON_LEAVE", label: "On Leave" },
      { value: "HOLIDAY", label: "Holiday" },
      { value: "WEEK_OFF", label: "Week Off" },
      { value: "ABSENT", label: "Absent" },
    ],
    [],
  );

  const punchTypeOptions = useMemo(
    () => [
      { value: "IN", label: "PUNCH IN" },
      { value: "OUT", label: "PUNCH OUT" },
      { value: "BREAK_IN", label: "BREAK IN" },
      { value: "BREAK_OUT", label: "BREAK OUT" },
    ],
    [],
  );

  // Mutations
  const createMutation = useCreateAttendance();
  const updateMutation = useUpdateAttendance();
  const punchMutation = useRecordPunch();

  // Modals state
  const [manualOpen, setManualOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [punchOpen, setPunchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("register");

  // Manual Form
  const [manualForm, setManualForm] = useState({
    employeeId: "",
    attendanceDate: today,
    checkInTime: "09:30",
    checkOutTime: "18:30",
    breakMinutes: 60,
    status: "PRESENT",
    remarks: "",
  });

  // Punch Form
  const [punchForm, setPunchForm] = useState({
    employeeId: "",
    punchType: "IN",
    punchTime: new Date().toISOString().substring(0, 16),
  });

  const handleOpenManualCreate = () => {
    setEditingRecord(null);
    setManualForm({
      employeeId: canManageAttendance
        ? (employees[0]?.id ?? "")
        : currentEmployeeId,
      attendanceDate: today,
      checkInTime: "09:30",
      checkOutTime: "18:30",
      breakMinutes: 60,
      status: "PRESENT",
      remarks: "",
    });
    setManualOpen(true);
  };

  const handleOpenEdit = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    const inTime = rec.checkIn
      ? new Date(rec.checkIn).toISOString().substring(11, 16)
      : "09:30";
    const outTime = rec.checkOut
      ? new Date(rec.checkOut).toISOString().substring(11, 16)
      : "18:30";
    setManualForm({
      employeeId: rec.employeeId,
      attendanceDate: rec.attendanceDate,
      checkInTime: inTime,
      checkOutTime: outTime,
      breakMinutes: rec.breakMinutes ?? 60,
      status: rec.status,
      remarks: rec.remarks ?? "",
    });
    setManualOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = canManageAttendance
      ? manualForm.employeeId
      : currentEmployeeId;

    if (!targetEmpId || !manualForm.attendanceDate) {
      toast.error("Employee and Date are required");
      return;
    }

    const checkInIso = manualForm.checkInTime
      ? `${manualForm.attendanceDate}T${manualForm.checkInTime}:00Z`
      : undefined;
    const checkOutIso = manualForm.checkOutTime
      ? `${manualForm.attendanceDate}T${manualForm.checkOutTime}:00Z`
      : undefined;

    try {
      if (editingRecord) {
        await updateMutation.mutateAsync({
          id: editingRecord.id,
          payload: {
            checkIn: checkInIso,
            checkOut: checkOutIso,
            breakMinutes: manualForm.breakMinutes,
            status: manualForm.status as any,
            remarks: manualForm.remarks,
          },
        });
        toast.success("Attendance updated");
      } else {
        await createMutation.mutateAsync({
          employeeId: targetEmpId,
          attendanceDate: manualForm.attendanceDate,
          checkIn: checkInIso,
          checkOut: checkOutIso,
          breakMinutes: manualForm.breakMinutes,
          status: manualForm.status as any,
          remarks: manualForm.remarks,
        });
        toast.success("Attendance recorded");
      }
      setManualOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to save attendance",
      );
    }
  };

  const handleSavePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = canManageAttendance
      ? punchForm.employeeId
      : currentEmployeeId;

    if (!targetEmpId) {
      toast.error("Select employee");
      return;
    }

    try {
      await punchMutation.mutateAsync({
        employeeId: targetEmpId,
        punchTime: new Date(punchForm.punchTime).toISOString(),
        punchType: punchForm.punchType,
        source: "WEB",
      });
      toast.success(`Punch ${punchForm.punchType} recorded successfully`);
      setPunchOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to log punch",
      );
    }
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
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Half Day
          </Badge>
        );
      case "ON_LEAVE":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            On Leave
          </Badge>
        );
      case "HOLIDAY":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">
            Holiday
          </Badge>
        );
      case "WEEK_OFF":
        return <Badge variant="secondary">Week Off</Badge>;
      case "ABSENT":
      default:
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            Absent
          </Badge>
        );
    }
  };

  const recordsColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "employee",
        headerName: "Employee",
        flex: 1,
        valueGetter: (p) =>
          p.data?.employee?.firstName
            ? `${p.data.employee.firstName} ${p.data.employee.lastName}`
            : "—",
        cellRenderer: (p: any) => (
          <div className="flex flex-col justify-center h-full">
            <div className="font-medium text-sm leading-tight">{p.value}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              {p.data?.employee?.employeeCode} •{" "}
              {p.data?.employee?.department?.name || "General"}
            </div>
          </div>
        ),
      },
      {
        field: "attendanceDate",
        headerName: "Date",
        width: 120,
        cellClass: "font-mono text-sm",
      },
      {
        field: "shiftName",
        headerName: "Assigned Shift",
        width: 140,
        valueGetter: (p) => p.data.shiftName || "Not Assigned",
        cellRenderer: (p: any) => (
          <div className="flex items-center gap-1.5 h-full">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{p.value}</span>
          </div>
        ),
      },
      {
        field: "checkIn",
        headerName: "Check In",
        width: 100,
        valueFormatter: (p) =>
          p.value
            ? new Date(p.value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
      },
      {
        field: "checkOut",
        headerName: "Check Out",
        width: 100,
        valueFormatter: (p) =>
          p.value
            ? new Date(p.value).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—",
      },
      {
        field: "workingMinutes",
        headerName: "Working Hours",
        width: 140,
        valueFormatter: (p) =>
          p.value != null ? `${(p.value / 60).toFixed(1)}h` : "—",
        cellClass: "font-medium text-sm",
      },
      {
        field: "overtimeMinutes",
        headerName: "Overtime",
        width: 110,
        valueFormatter: (p) =>
          p.value ? `${(p.value / 60).toFixed(1)}h` : "0h",
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
        cellClass: "text-xs text-muted-foreground truncate",
      },
    ],
    [],
  );

  const punchLogsColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "employee",
        headerName: "Employee",
        flex: 1,
        valueGetter: (p) =>
          p.data?.employee?.firstName
            ? `${p.data.employee.firstName} ${p.data.employee.lastName}`
            : "—",
        cellRenderer: (p: any) => (
          <div className="flex flex-col justify-center h-full">
            <div className="font-medium text-sm leading-tight">{p.value}</div>
            <div className="text-xs text-muted-foreground leading-tight">
              {p.data?.employee?.employeeCode}
            </div>
          </div>
        ),
      },
      {
        field: "punchTime",
        headerName: "Punch Time",
        width: 200,
        cellClass: "font-mono text-sm",
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleString() : "—",
      },
      {
        field: "punchType",
        headerName: "Type",
        width: 120,
        cellRenderer: (p: any) => (
          <Badge variant={p.value === "IN" ? "success" : "secondary"}>
            {p.value}
          </Badge>
        ),
      },
      {
        field: "source",
        headerName: "Source",
        width: 120,
        cellClass: "font-mono text-xs",
      },
      {
        field: "deviceId",
        headerName: "Device ID",
        flex: 1,
        cellClass: "text-xs text-muted-foreground",
        valueFormatter: (p) => p.value || "WEB-PORTAL",
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Attendance & Timesheets"
          subtitle="Real-time tracking, shift calculations, and leave resolution"
          onRefresh={refetch}
          tabs={{
            value: activeTab,
            onChange: setActiveTab,
            options: [
              { label: "Attendance Register", value: "register" },
              { label: "Calendar View", value: "calendar" },
              { label: "Raw Punch Logs", value: "punches" },
            ],
          }}
        />

        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPunchForm({
                  employeeId: canManageAttendance
                    ? employees[0]?.id || ""
                    : currentEmployeeId,
                  punchType: "IN",
                  punchTime: new Date().toISOString().substring(0, 16),
                });
                setPunchOpen(true);
              }}
            >
              <Fingerprint className="h-3.5 w-3.5 mr-1.5" />
              Quick Punch
            </Button>
            <Button size="sm" onClick={handleOpenManualCreate}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Record Attendance
            </Button>
          </div>
        </div>
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span>Total Workforce</span>
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold mt-2">
                {summary?.totalEmployees ?? employees.length}
              </div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-medium">
                <span>Present</span>
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-2">
                {summary?.present ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-medium">
                <span>Late</span>
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-2">
                {summary?.late ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-medium">
                <span>Half Day</span>
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                {summary?.halfDay ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 dark:border-purple-900 bg-purple-50/30 dark:bg-purple-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-medium">
                <span>On Leave</span>
                <CalendarIcon className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                {summary?.onLeave ?? 0}
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-red-700 dark:text-red-300 font-medium">
                <span>Absent</span>
                <XCircle className="h-3.5 w-3.5" />
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300 mt-2">
                {summary?.absent ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab 1: Attendance Register */}
        {activeTab === "register" && (
          <div className="space-y-4">
            {/* Server-side Filter Bar */}
            <div className="p-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex-1 min-w-[200px]">
                {canManageAttendance ? (
                  <Select
                    value={filterEmployeeId || "ALL"}
                    onValueChange={(val) =>
                      setFilterEmployeeId(val === "ALL" ? "" : val)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Employees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Employees</SelectItem>
                      {employeeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/60 text-xs font-medium text-foreground">
                    <User className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {employeeOptions[0]?.label || "Self Attendance"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  From:
                </span>
                <DatePicker
                  className="w-36 h-9 text-xs"
                  value={fromDate}
                  onChange={(_, str) => setFromDate(str)}
                  placeholder="From date"
                />
                <span className="text-xs text-muted-foreground font-medium">
                  To:
                </span>
                <DatePicker
                  className="w-36 h-9 text-xs"
                  value={toDate}
                  onChange={(_, str) => setToDate(str)}
                  placeholder="To date"
                />
              </div>
              <div className="w-36">
                <Select
                  value={filterStatus || "ALL"}
                  onValueChange={(val) =>
                    setFilterStatus(val === "ALL" ? "" : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFromDate(today);
                  setToDate(today);
                  setFilterEmployeeId("");
                  setFilterStatus("");
                }}
              >
                Reset
              </Button>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
              </Button>
            </div>

            {/* Table */}
            <div className="h-[500px]">
              <DataGrid
                rowData={records}
                columnDefs={recordsColDefs}
                gridOptions={{
                  onRowDoubleClicked: (e) => handleOpenEdit(e.data),
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Calendar View */}
        {activeTab === "calendar" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">
                    Attendance Calendar Grid
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Monthly breakdown of employee punches & leaves
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="month"
                    className="w-40 h-9 text-xs"
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-muted-foreground mb-2">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dayStr = `${calendarMonth}-${String(dayNum).padStart(2, "0")}`;
                    const dayRecords = (calendarRecords ?? []).filter(
                      (r) => r.attendanceDate === dayStr,
                    );
                    const presentCount = dayRecords.filter(
                      (r) => r.status === "PRESENT" || r.status === "LATE",
                    ).length;
                    const leaveCount = dayRecords.filter(
                      (r) => r.status === "ON_LEAVE",
                    ).length;

                    return (
                      <div
                        key={idx}
                        className="min-h-[70px] border rounded-lg p-2 flex flex-col justify-between bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="text-xs font-semibold text-muted-foreground">
                          {dayNum}
                        </div>
                        <div className="space-y-1">
                          {presentCount > 0 && (
                            <div className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded px-1 py-0.5 font-medium">
                              {presentCount} Present
                            </div>
                          )}
                          {leaveCount > 0 && (
                            <div className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded px-1 py-0.5 font-medium">
                              {leaveCount} On Leave
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Raw Attendance Punches / Logs */}
        {activeTab === "punches" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-sm">
                    Biometric & Web Punch Stream
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Unprocessed timestamp punches from biometric and web devices
                  </p>
                </div>
                <Button size="sm" onClick={() => setPunchOpen(true)}>
                  <Fingerprint className="h-4 w-4 mr-1" /> Log Punch
                </Button>
              </div>
              <div className="h-[400px]">
                <DataGrid
                  rowData={punchLogs || []}
                  columnDefs={punchLogsColDefs}
                />
              </div>
            </div>
          </div>
        )}
      </ListingCard>

      {/* Manual Attendance Dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveManual} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Employee
                </label>
              </div>
              <Select
                value={
                  canManageAttendance
                    ? manualForm.employeeId
                    : currentEmployeeId
                }
                onValueChange={(val) =>
                  canManageAttendance &&
                  setManualForm({ ...manualForm, employeeId: val })
                }
                disabled={!canManageAttendance || !!editingRecord}
              >
                <SelectTrigger
                  className={
                    !canManageAttendance ? "bg-muted/60 cursor-not-allowed" : ""
                  }
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Attendance Date
              </label>
              <DatePicker
                value={manualForm.attendanceDate}
                onChange={(_, str) =>
                  setManualForm({
                    ...manualForm,
                    attendanceDate: str,
                  })
                }
                disabled={!!editingRecord}
                placeholder="Select date"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Check In Time
                </label>
                <Input
                  type="time"
                  value={manualForm.checkInTime}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      checkInTime: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Check Out Time
                </label>
                <Input
                  type="time"
                  value={manualForm.checkOutTime}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      checkOutTime: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Break Minutes
                </label>
                <Input
                  type="number"
                  min="0"
                  value={manualForm.breakMinutes}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      breakMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Status (Optional Override)
                </label>
                <Select
                  value={manualForm.status}
                  onValueChange={(val) =>
                    setManualForm({ ...manualForm, status: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Remarks
              </label>
              <Input
                placeholder="Reason or notes..."
                value={manualForm.remarks}
                onChange={(e) =>
                  setManualForm({ ...manualForm, remarks: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingRecord ? "Save Changes" : "Record Attendance"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Punch Modal */}
      <Dialog open={punchOpen} onOpenChange={setPunchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Punch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePunch} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Employee
                </label>
              </div>
              <Select
                value={
                  canManageAttendance ? punchForm.employeeId : currentEmployeeId
                }
                onValueChange={(val) =>
                  canManageAttendance &&
                  setPunchForm({ ...punchForm, employeeId: val })
                }
                disabled={!canManageAttendance}
              >
                <SelectTrigger
                  className={
                    !canManageAttendance ? "bg-muted/60 cursor-not-allowed" : ""
                  }
                >
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employeeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Punch Type
              </label>
              <Select
                value={punchForm.punchType}
                onValueChange={(val) =>
                  setPunchForm({ ...punchForm, punchType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Punch Type" />
                </SelectTrigger>
                <SelectContent>
                  {punchTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Punch Time
              </label>
              <Input
                type="datetime-local"
                value={punchForm.punchTime}
                onChange={(e) =>
                  setPunchForm({ ...punchForm, punchTime: e.target.value })
                }
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPunchOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={punchMutation.isPending}>
                {punchMutation.isPending ? "Logging..." : "Confirm Punch"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
