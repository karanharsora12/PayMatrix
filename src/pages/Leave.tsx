import type { LeaveType } from "@/api/leave";
import { DatePicker, useAlert } from "@/components/common";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuth } from "@/context/AuthContext";
import { useCanManageLeave } from "@/hooks/useUserParameters";
import {
  useApproveLeave,
  useCancelLeave,
  useCreateLeaveRequest,
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveBalances,
  useLeaveCalendar,
  useLeaveRequests,
  useLeaveTypes,
  useRejectLeave,
  useUpdateLeaveType,
} from "@/hooks/useLeave";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { CheckCircle2, RotateCcw, Trash2, XCircle, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function Leave() {
  const { confirm } = useAlert();
  const { user } = useAuth();
  const canManageLeave = useCanManageLeave();
  const currentEmployeeId = user?.employeeId || user?.employee?.id || "";

  const currentYear = new Date().getFullYear();
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7);

  const [activeTab, setActiveTab] = useState("requests");
  const [searchQuery, setSearchQuery] = useState("");
  const gridRef = useRef<AgGridReact>(null);

  // Filter States
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmployeeId, setFilterEmployeeId] = useState("");
  const [balanceEmpId, setBalanceEmpId] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(currentMonthStr);

  const effectiveFilterEmployeeId = canManageLeave
    ? filterEmployeeId
    : currentEmployeeId;

  // Queries
  const { data: typesData, isLoading: typesLoading } = useLeaveTypes();
  const leaveTypes = typesData?.data ?? [];

  const { data: requestsData, isLoading: requestsLoading } = useLeaveRequests({
    status: filterStatus || undefined,
    employeeId: effectiveFilterEmployeeId || undefined,
    pageSize: 50,
  });
  const requests = requestsData?.data ?? [];

  const { data: employeesData } = useEmployees({ pageSize: 100 });
  const employees = employeesData?.data ?? [];

  const effectiveBalanceEmpId = canManageLeave
    ? balanceEmpId || employees[0]?.id || currentEmployeeId
    : currentEmployeeId;

  const { data: balancesData, isLoading: balancesLoading } = useLeaveBalances(
    effectiveBalanceEmpId || undefined,
    currentYear,
  );
  const balances = balancesData ?? [];

  const fromMonthDate = `${calendarMonth}-01`;
  const toMonthDate = `${calendarMonth}-31`;
  const { data: calendarEvents } = useLeaveCalendar({
    fromDate: fromMonthDate,
    toDate: toMonthDate,
    employeeId: canManageLeave ? undefined : currentEmployeeId,
  });

  // Mutations
  const createTypeMutation = useCreateLeaveType();
  const updateTypeMutation = useUpdateLeaveType();
  const deleteTypeMutation = useDeleteLeaveType();
  const createRequestMutation = useCreateLeaveRequest();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();
  const cancelMutation = useCancelLeave();

  // Modals
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");

  // Forms
  const [requestForm, setRequestForm] = useState({
    employeeId: "",
    leaveTypeId: "",
    fromDate: todayStr,
    toDate: todayStr,
    reason: "",
  });

  const [typeForm, setTypeForm] = useState({
    code: "",
    name: "",
    description: "",
    isPaid: true,
    annualAllowance: 12,
    carryForwardAllowed: false,
    maxCarryForwardDays: 5,
    maxConsecutiveDays: 5,
    requiresApproval: true,
    isActive: true,
  });

  // Self employee label helper
  const selfEmployeeLabel = useMemo(() => {
    const selfEmp =
      employees.find((e: any) => e.id === currentEmployeeId) || user?.employee;
    const firstName = selfEmp?.firstName || user?.name?.split(" ")[0] || "User";
    const lastName = selfEmp?.lastName || "";
    const code = (selfEmp as any)?.employeeCode
      ? ` (${(selfEmp as any).employeeCode})`
      : "";
    return `${firstName} ${lastName}${code}`.trim();
  }, [employees, currentEmployeeId, user]);

  // Action Handlers
  const handleOpenRequest = () => {
    setRequestForm({
      employeeId: canManageLeave
        ? employees[0]?.id || currentEmployeeId || ""
        : currentEmployeeId,
      leaveTypeId: leaveTypes[0]?.id || "",
      fromDate: todayStr,
      toDate: todayStr,
      reason: "",
    });
    setRequestModalOpen(true);
  };

  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = canManageLeave
      ? requestForm.employeeId
      : currentEmployeeId;

    if (
      !targetEmpId ||
      !requestForm.leaveTypeId ||
      !requestForm.fromDate ||
      !requestForm.toDate
    ) {
      toast.error("All fields are required");
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        ...requestForm,
        employeeId: targetEmpId,
      });
      toast.success("Leave request submitted successfully");
      setRequestModalOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to submit leave request",
      );
    }
  };

  const handleOpenTypeModal = (t?: LeaveType) => {
    if (t) {
      setEditingType(t);
      setTypeForm({
        code: t.code,
        name: t.name,
        description: t.description || "",
        isPaid: t.isPaid,
        annualAllowance: Number(t.annualAllowance),
        carryForwardAllowed: t.carryForwardAllowed,
        maxCarryForwardDays: Number(t.maxCarryForwardDays || 0),
        maxConsecutiveDays: t.maxConsecutiveDays || 5,
        requiresApproval: t.requiresApproval,
        isActive: t.isActive,
      });
    } else {
      setEditingType(null);
      setTypeForm({
        code: "",
        name: "",
        description: "",
        isPaid: true,
        annualAllowance: 12,
        carryForwardAllowed: false,
        maxCarryForwardDays: 5,
        maxConsecutiveDays: 5,
        requiresApproval: true,
        isActive: true,
      });
    }
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeForm.code.trim() || !typeForm.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }

    try {
      if (editingType) {
        await updateTypeMutation.mutateAsync({
          id: editingType.id,
          payload: typeForm,
        });
        toast.success("Leave type updated");
      } else {
        await createTypeMutation.mutateAsync(typeForm);
        toast.success("Leave type created");
      }
      setTypeModalOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to save leave type",
      );
    }
  };

  const handleDeleteType = async (id: string, name: string) => {
    try {
      await deleteTypeMutation.mutateAsync(id);
      toast.success("Leave type deleted");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Cannot delete leave type",
      );
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Leave request approved and balance deducted");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to approve leave",
      );
    }
  };

  const handleOpenReject = (id: string) => {
    setRejectingRequestId(id);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequestId) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is mandatory");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        id: rejectingRequestId,
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Leave request rejected");
      setRejectModalOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to reject leave",
      );
    }
  };

  const handleCancel = async (id: string) => {
    const ok = await confirm({
      title: "Cancel Leave Request?",
      message:
        "If approved, the leave balance will be restored. This cannot be undone.",
      confirmText: "Yes, Cancel Request",
      cancelText: "Keep it",
    });
    if (!ok) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Leave request cancelled and balance restored");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to cancel leave",
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Approved
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Pending
          </Badge>
        );
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      case "REJECTED":
      default:
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            Rejected
          </Badge>
        );
    }
  };

  const requestsColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "employee",
        headerName: "Employee",
        flex: 1,
        valueGetter: (p) =>
          p.data?.employee?.firstName
            ? `${p.data.employee.firstName} ${p.data.employee.lastName}`
            : "—",
      },
      {
        field: "leaveType",
        headerName: "Leave Type",
        width: 150,
        cellRenderer: (p: any) => (
          <div className="flex items-center h-full">
            <div
              className={`h-2.5 w-2.5 rounded-full ${p.value ? "bg-emerald-500" : "bg-red-500"}`}
              title={p.value ? "Active" : "Inactive"}
            />
          </div>
        ),
      },
      {
        field: "period",
        headerName: "Period",
        width: 220,
        valueGetter: (p) => `${p.data.fromDate} → ${p.data.toDate}`,
      },
      {
        field: "totalDays",
        headerName: "Days",
        width: 100,
        valueFormatter: (p) =>
          `${Number(p.value)} ${Number(p.value) === 1 ? "day" : "days"}`,
      },
      {
        field: "reason",
        headerName: "Reason",
        flex: 1,
        cellRenderer: (p: any) => (
          <div className="text-xs text-muted-foreground max-w-[180px] truncate">
            {p.value || "—"}
            {p.data.rejectionReason && (
              <div className="text-red-500 font-medium">
                Rejection: {p.data.rejectionReason}
              </div>
            )}
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (p: any) => getStatusBadge(p.value),
      },
      {
        headerName: "Actions",
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: (p: any) => (
          <div className="flex items-center justify-end gap-1.5 h-full">
            {p.data.status === "PENDING" && canManageLeave && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  onClick={() => handleApprove(p.data.id)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleOpenReject(p.data.id)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </>
            )}
            {(p.data.status === "PENDING" || p.data.status === "APPROVED") &&
              (canManageLeave || p.data.employeeId === currentEmployeeId) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleCancel(p.data.id)}
                  disabled={cancelMutation.isPending}
                >
                  <RotateCcw className="h-3 w-3 mr-1" /> Cancel
                </Button>
              )}
          </div>
        ),
      },
    ],
    [
      approveMutation.isPending,
      rejectMutation.isPending,
      cancelMutation.isPending,
      canManageLeave,
      currentEmployeeId,
    ],
  );

  const typesColDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 100 },
      { field: "name", headerName: "Name", flex: 1 },
      {
        field: "isPaid",
        headerName: "Type",
        width: 100,
        cellRenderer: (p: any) => (
          <div className="flex items-center h-full">
            <div
              className={`h-2.5 w-2.5 rounded-full ${p.value ? "bg-emerald-500" : "bg-red-500"}`}
              title={p.value ? "Active" : "Inactive"}
            />
          </div>
        ),
      },
      {
        field: "annualAllowance",
        headerName: "Annual Allowance",
        width: 150,
        valueFormatter: (p) => `${Number(p.value)} days`,
      },
      {
        field: "carryForwardAllowed",
        headerName: "Carry Forward",
        width: 150,
        valueGetter: (p) =>
          p.data?.carryForwardAllowed ? `Yes (max ${p.data.maxCarryForwardDays ?? "∞"})` : "No",
      },
      {
        field: "maxConsecutiveDays",
        headerName: "Max Consecutive",
        width: 150,
        valueFormatter: (p) => (p.value ? `${p.value} days` : "Unlimited"),
      },
      {
        field: "requiresApproval",
        headerName: "Approval",
        width: 120,
        valueFormatter: (p) => (p.value ? "Required" : "Auto"),
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 100,
        cellRenderer: (p: any) => (
          <div className="flex items-center h-full">
            <div
              className={`h-2.5 w-2.5 rounded-full ${p.value ? "bg-emerald-500" : "bg-red-500"}`}
              title={p.value ? "Active" : "Inactive"}
            />
          </div>
        ),
      },
      ...(canManageLeave
        ? [
            {
              headerName: "",
              width: 80,
              sortable: false,
              filter: false,
              cellRenderer: (p: any) => (
                <div className="flex items-center justify-end gap-1 h-full">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteType(p.data.id, p.data.name);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [canManageLeave],
  );

  const balancesColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "leaveType",
        headerName: "Leave Type",
        flex: 1,
        valueGetter: (p) =>
          p.data.leaveType
            ? `${p.data.leaveType.name} (${p.data.leaveType.code})`
            : "—",
      },
      {
        field: "openingBalance",
        headerName: "Opening Balance",
        width: 150,
        valueFormatter: (p) => String(Number(p.value)),
      },
      {
        field: "allocatedDays",
        headerName: "Allocated",
        width: 120,
        valueFormatter: (p) => String(Number(p.value)),
      },
      {
        field: "usedDays",
        headerName: "Used Days",
        width: 120,
        valueFormatter: (p) => String(Number(p.value)),
      },
      {
        field: "pendingDays",
        headerName: "Pending Approval",
        width: 150,
        valueFormatter: (p) => String(Number(p.value)),
      },
      {
        field: "remainingDays",
        headerName: "Remaining Balance",
        width: 160,
        valueFormatter: (p) => String(Number(p.value)),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <ListingCard>
        <ListingHeader
          title="Leave Management"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={
            activeTab === "types" && canManageLeave
              ? () => handleOpenTypeModal()
              : activeTab === "requests"
                ? handleOpenRequest
                : undefined
          }
          addButtonText={
            activeTab === "types" ? "Add Leave Type" : "Request Leave"
          }
          onRefresh={() => {}}
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "leave.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api && gridExportPdf(gridRef.current.api, "Leave")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Leave")
          }
          tabs={{
            options: [
              { label: "Leave Requests", value: "requests" },
              ...(canManageLeave
                ? [{ label: "Leave Types", value: "types" }]
                : []),
              { label: "Balances", value: "balances" },
            ],
            value:
              activeTab === "types" && !canManageLeave ? "requests" : activeTab,
            onChange: setActiveTab,
          }}
        />

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px]">
                {canManageLeave ? (
                  <NativeSelect
                    placeholder="All Employees"
                    value={filterEmployeeId}
                    onChange={(val) => setFilterEmployeeId(val || "")}
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/60 text-xs font-medium text-foreground">
                    <User className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {selfEmployeeLabel || "Self Leaves"}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-40">
                <NativeSelect
                  placeholder="All Statuses"
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val || "")}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </NativeSelect>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setFilterEmployeeId("");
                  setFilterStatus("");
                }}
              >
                Reset Filters
              </Button>
            </div>
            <div className="h-[500px]">
              <DataGrid
                ref={gridRef}
                rowData={requests}
                columnDefs={requestsColDefs}
              />
            </div>
          </div>
        )}

        {/* Types Tab */}
        {activeTab === "types" && canManageLeave && (
          <div className="h-[500px]">
            <DataGrid
              ref={gridRef}
              rowData={leaveTypes}
              columnDefs={typesColDefs}
              gridOptions={{
                onRowDoubleClicked: (e) =>
                  canManageLeave && handleOpenTypeModal(e.data),
              }}
            />
          </div>
        )}

        {/* Balances Tab */}
        {activeTab === "balances" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Employee Leave Balances ({currentYear})
              </p>
              <div className="w-64">
                {canManageLeave ? (
                  <NativeSelect
                    value={balanceEmpId || (employees[0]?.id ?? "")}
                    onChange={(val) => setBalanceEmpId(val || "")}
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/60 text-xs font-medium text-foreground">
                    <User className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {selfEmployeeLabel || "Self Balance"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="h-[400px]">
              <DataGrid
                ref={gridRef}
                rowData={balances}
                columnDefs={balancesColDefs}
              />
            </div>
          </div>
        )}
      </ListingCard>

      {/* Request Leave Modal */}
      <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRequest} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Employee
                </label>
              </div>
              {canManageLeave ? (
                <NativeSelect
                  value={requestForm.employeeId}
                  onChange={(val) =>
                    setRequestForm({ ...requestForm, employeeId: val || "" })
                  }
                  required
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeCode})
                    </option>
                  ))}
                </NativeSelect>
              ) : (
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border bg-muted/60 text-xs font-medium text-foreground cursor-not-allowed">
                  <User className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">
                    {selfEmployeeLabel || "Current Employee"}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Leave Type
              </label>
              <NativeSelect
                value={requestForm.leaveTypeId}
                onChange={(val) =>
                  setRequestForm({ ...requestForm, leaveTypeId: val || "" })
                }
                required
              >
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.code}) — {t.isPaid ? "Paid" : "Unpaid"}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  From Date <span className="text-destructive">*</span>
                </label>
                <DatePicker
                  value={requestForm.fromDate}
                  onChange={(_, str) =>
                    setRequestForm({ ...requestForm, fromDate: str })
                  }
                  placeholder="Select from date"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  To Date <span className="text-destructive">*</span>
                </label>
                <DatePicker
                  value={requestForm.toDate}
                  onChange={(_, str) =>
                    setRequestForm({ ...requestForm, toDate: str })
                  }
                  placeholder="Select to date"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Reason
              </label>
              <Input
                placeholder="Specify reason for leave..."
                value={requestForm.reason}
                onChange={(e) =>
                  setRequestForm({ ...requestForm, reason: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRequestModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending}>
                {createRequestMutation.isPending
                  ? "Submitting..."
                  : "Submit Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Rejection Reason
              </label>
              <Input
                placeholder="e.g. Critical release scheduled during these dates"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending
                  ? "Rejecting..."
                  : "Confirm Rejection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Leave Type Modal */}
      <Dialog open={typeModalOpen} onOpenChange={setTypeModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveType} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Code
                </label>
                <Input
                  placeholder="e.g. CL"
                  value={typeForm.code}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, code: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Name
                </label>
                <Input
                  placeholder="e.g. Casual Leave"
                  value={typeForm.name}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Description
              </label>
              <Input
                placeholder="Short description of this leave type"
                value={typeForm.description}
                onChange={(e) =>
                  setTypeForm({ ...typeForm, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Annual Days
                </label>
                <Input
                  type="number"
                  min="0"
                  value={typeForm.annualAllowance}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      annualAllowance: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Max Consecutive
                </label>
                <Input
                  type="number"
                  min="1"
                  value={typeForm.maxConsecutiveDays}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      maxConsecutiveDays: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Max Carry Forward
                </label>
                <Input
                  type="number"
                  min="0"
                  value={typeForm.maxCarryForwardDays}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      maxCarryForwardDays: Number(e.target.value),
                    })
                  }
                  disabled={!typeForm.carryForwardAllowed}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.isPaid}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, isPaid: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span>Paid Leave</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.carryForwardAllowed}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      carryForwardAllowed: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span>Allow carry-forward to next calendar year</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.requiresApproval}
                  onChange={(e) =>
                    setTypeForm({
                      ...typeForm,
                      requiresApproval: e.target.checked,
                    })
                  }
                  className="rounded border-gray-300"
                />
                <span>Requires Manager / HR approval</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeForm.isActive}
                  onChange={(e) =>
                    setTypeForm({ ...typeForm, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span>Active</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTypeModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createTypeMutation.isPending || updateTypeMutation.isPending
                }
              >
                {editingType ? "Save Changes" : "Create Leave Type"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
