import type { Shift } from "@/api/shifts";
import { GridDateFloatingFilter, GridDeleteCell } from "@/components/common";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
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
import {
  useAssignShift,
  useCreateShift,
  useDeleteShift,
  useEmployeeShifts,
  useShifts,
  useUpdateShift,
} from "@/hooks/useShifts";
import type { ColDef } from "ag-grid-community";
import { Clock, History, Moon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function Shifts() {
  const { data: shiftsData, isLoading } = useShifts({ pageSize: 50 });
  const shifts = shiftsData?.data ?? [];

  const { data: employeesData } = useEmployees({ pageSize: 100 });
  const employees = employeesData?.data ?? [];

  const createShiftMutation = useCreateShift();
  const updateShiftMutation = useUpdateShift();
  const deleteShiftMutation = useDeleteShift();
  const assignShiftMutation = useAssignShift();

  // Modals state
  const [createOpen, setCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedShiftForAssign, setSelectedShiftForAssign] =
    useState<Shift | null>(null);
  const [historyEmpId, setHistoryEmpId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("shifts");

  // Form states
  const [form, setForm] = useState({
    code: "",
    name: "",
    startTime: "09:30",
    endTime: "18:30",
    breakMinutes: 60,
    workingHours: 8,
    graceMinutes: 15,
    overtimeAllowed: false,
    isNightShift: false,
    isActive: true,
  });

  const [assignForm, setAssignForm] = useState({
    employeeId: "",
    shiftId: "",
    effectiveFrom: new Date().toISOString().substring(0, 10),
    effectiveTo: "",
  });

  const { data: historyData, isLoading: historyLoading } = useEmployeeShifts(
    historyEmpId ?? undefined,
  );

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      startTime: "09:30",
      endTime: "18:30",
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
      isNightShift: false,
      isActive: true,
    });
    setEditingShift(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const handleOpenEdit = (s: Shift) => {
    setEditingShift(s);
    setForm({
      code: s.code,
      name: s.name,
      startTime: s.startTime.substring(0, 5),
      endTime: s.endTime.substring(0, 5),
      breakMinutes: s.breakMinutes,
      workingHours: Number(s.workingHours),
      graceMinutes: s.graceMinutes,
      overtimeAllowed: s.overtimeAllowed,
      isNightShift: s.isNightShift,
      isActive: s.isActive,
    });
    setCreateOpen(true);
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and Name are required");
      return;
    }

    try {
      if (editingShift) {
        await updateShiftMutation.mutateAsync({
          id: editingShift.id,
          payload: form,
        });
        toast.success("Shift updated successfully");
      } else {
        await createShiftMutation.mutateAsync(form);
        toast.success("Shift created successfully");
      }
      setCreateOpen(false);
      resetForm();
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to save shift",
      );
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    try {
      await deleteShiftMutation.mutateAsync(id);
      toast.success("Shift deleted");
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to delete shift",
      );
    }
  };

  const handleOpenAssign = (shift?: Shift) => {
    setSelectedShiftForAssign(shift ?? null);
    setAssignForm({
      employeeId: "",
      shiftId: shift?.id ?? (shifts[0]?.id || ""),
      effectiveFrom: new Date().toISOString().substring(0, 10),
      effectiveTo: "",
    });
    setAssignOpen(true);
  };

  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !assignForm.employeeId ||
      !assignForm.shiftId ||
      !assignForm.effectiveFrom
    ) {
      toast.error("Employee, Shift and Effective Date are required");
      return;
    }

    try {
      await assignShiftMutation.mutateAsync({
        employeeId: assignForm.employeeId,
        payload: {
          shiftId: assignForm.shiftId,
          effectiveFrom: assignForm.effectiveFrom,
          effectiveTo: assignForm.effectiveTo || undefined,
        },
      });
      toast.success("Shift assigned to employee successfully");
      setAssignOpen(false);
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to assign shift. Overlapping assignment may exist.",
      );
    }
  };

  const shiftsColDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 100 },
      { field: "name", headerName: "Name", flex: 1 },
      {
        field: "timing",
        headerName: "Timing",
        width: 150,
        valueGetter: (p) =>
          p.data.startTime
            ? `${p.data.startTime.substring(0, 5)} - ${p.data.endTime.substring(0, 5)}`
            : "",
        cellRenderer: (p: any) => (
          <div className="flex items-center gap-1.5 text-sm h-full">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{p.value}</span>
          </div>
        ),
      },
      {
        field: "workingHours",
        headerName: "Work Hours",
        width: 120,
        valueFormatter: (p) => `${Number(p.value)}h`,
      },
      {
        field: "breakMinutes",
        headerName: "Break",
        width: 100,
        valueFormatter: (p) => `${p.value}m`,
      },
      {
        field: "graceMinutes",
        headerName: "Grace",
        width: 100,
        valueFormatter: (p) => `${p.value}m`,
      },
      {
        field: "overtimeAllowed",
        headerName: "Overtime",
        width: 120,
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
        field: "isNightShift",
        headerName: "Type",
        width: 120,
        cellRenderer: (p: any) =>
          p.value ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Moon className="h-3 w-3" /> Night
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Regular</span>
          ),
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
      {
        headerName: "",
        width: 60,
        sortable: false,
        filter: false,
        cellRenderer: GridDeleteCell,
        cellRendererParams: {
          onDelete: (id: string) => {
            const shift = shifts.find((s) => s.id === id);
            if (shift) handleDeleteShift(id, shift.name);
          },
        },
      },
    ],
    [],
  );

  const historyColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "shiftName",
        headerName: "Shift",
        flex: 1,
        valueGetter: (p) =>
          p.data.shift ? `${p.data.shift.name} (${p.data.shift.code})` : "—",
      },
      {
        field: "timings",
        headerName: "Timings",
        flex: 1,
        valueGetter: (p) =>
          p.data.shift
            ? `${p.data.shift.startTime.substring(0, 5)} - ${p.data.shift.endTime.substring(0, 5)}`
            : "—",
      },
      {
        field: "effectiveFrom",
        headerName: "Effective From",
        flex: 1,
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
        field: "effectiveTo",
        headerName: "Effective To",
        flex: 1,
        valueFormatter: (p) => {
          if (!p.value) return "Ongoing / Indefinite";
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
        field: "status",
        headerName: "Status",
        width: 120,
        valueGetter: (p) =>
          !p.data.effectiveTo ||
          p.data.effectiveTo >= new Date().toISOString().substring(0, 10),
        cellRenderer: (p: any) => (
          <div className="flex items-center h-full">
            <div
              className={`h-2.5 w-2.5 rounded-full ${p.value ? "bg-emerald-500" : "bg-red-500"}`}
              title={p.value ? "Active" : "Inactive"}
            />
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Shift Management"
          subtitle="Configure work schedules, overnight night shifts, and grace periods."
          onAddNew={activeTab === "shifts" ? handleOpenCreate : undefined}
          addButtonText="Add Shift"
          tabs={{
            value: activeTab,
            onChange: setActiveTab,
            options: [
              { label: "Shifts Configuration", value: "shifts" },
              { label: "Employee Shift History", value: "history" },
            ],
          }}
        />

        {activeTab === "shifts" && (
          <div className="space-y-4 mt-2">
            {/* Shifts Table Card */}
            <div className="h-[500px]">
              <DataGrid
                rowData={shifts}
                columnDefs={shiftsColDefs}
                gridOptions={{
                  onRowDoubleClicked: (e) => handleOpenEdit(e.data),
                  getContextMenuItems: (params) => {
                    return [
                      {
                        name: "Assign Shift",
                        action: () => {
                          if (params.node?.data) {
                            handleOpenAssign(params.node.data);
                          }
                        },
                      },
                      "separator",
                      "copy",
                      "export",
                    ];
                  },
                }}
              />
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4 mt-2">
            <div className="rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">
                    Employee Shift History Lookup
                  </h3>
                </div>
                <div className="w-64">
                  <NativeSelect
                    placeholder="Select employee to view history"
                    value={historyEmpId ?? ""}
                    onChange={(val) => setHistoryEmpId(val || null)}
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.employeeCode})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              </div>
              <div className="p-0">
                {historyEmpId ? (
                  <div className="h-[400px]">
                    <DataGrid
                      rowData={historyData || []}
                      columnDefs={historyColDefs}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Select an employee above to inspect their shift allocation
                    timeline.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </ListingCard>

      {/* Create / Edit Shift Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent onClose={() => setCreateOpen(false)}>
          <DialogHeader>
            <DialogTitle>Shift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveShift} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Shift Code
                </label>
                <Input
                  placeholder="e.g. SH-GEN"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Shift Name
                </label>
                <Input
                  placeholder="e.g. General Shift"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Start Time (HH:mm)
                </label>
                <Input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  End Time (HH:mm)
                </label>
                <Input
                  type="time"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm({ ...form, endTime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Work Hours
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="24"
                  value={form.workingHours}
                  onChange={(e) =>
                    setForm({ ...form, workingHours: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Break (Mins)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.breakMinutes}
                  onChange={(e) =>
                    setForm({ ...form, breakMinutes: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Grace (Mins)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={form.graceMinutes}
                  onChange={(e) =>
                    setForm({ ...form, graceMinutes: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.overtimeAllowed}
                  onChange={(e) =>
                    setForm({ ...form, overtimeAllowed: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span>Allow Overtime calculation for this shift</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isNightShift}
                  onChange={(e) =>
                    setForm({ ...form, isNightShift: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <span>Night Shift (crosses midnight)</span>
              </label>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
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
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createShiftMutation.isPending || updateShiftMutation.isPending
                }
              >
                {editingShift ? "Save Changes" : "Create Shift"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Shift Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent onClose={() => setAssignOpen(false)}>
          <DialogHeader>
            <DialogTitle>Assign Shift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAssign} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Select Employee
              </label>
              <NativeSelect
                placeholder="Choose employee"
                value={assignForm.employeeId}
                onChange={(val) =>
                  setAssignForm({ ...assignForm, employeeId: val || "" })
                }
                required
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode})
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Select Shift
              </label>
              <NativeSelect
                placeholder="Choose shift"
                value={assignForm.shiftId}
                onChange={(val) =>
                  setAssignForm({ ...assignForm, shiftId: val || "" })
                }
                required
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.startTime.substring(0, 5)} to{" "}
                    {s.endTime.substring(0, 5)}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Effective From
                </label>
                <Input
                  type="date"
                  value={assignForm.effectiveFrom}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      effectiveFrom: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Effective To{" "}
                  <span className="text-muted-foreground font-normal">
                    (Optional)
                  </span>
                </label>
                <Input
                  type="date"
                  value={assignForm.effectiveTo}
                  onChange={(e) =>
                    setAssignForm({
                      ...assignForm,
                      effectiveTo: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={assignShiftMutation.isPending}>
                {assignShiftMutation.isPending
                  ? "Assigning..."
                  : "Confirm Assignment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
