import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ListingCard } from "@/components/common/ListingCard";
import { DataGrid } from "@/components/common/DataGrid";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sliders, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parametersApi } from "@/api/parameters";
import type {
  ParameterDefinition,
  UserWiseParameterRow,
} from "@/api/parameters";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch } from "@/store";
import { fetchUserParameters } from "@/store/slices/userParametersSlice";
import type { ColDef } from "ag-grid-community";

export default function UserParameters() {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  // Parameters list
  const [paramSearch, setParamSearch] = useState("");
  const [definitions, setDefinitions] = useState<ParameterDefinition[]>([]);
  const [definitionsLoading, setDefinitionsLoading] = useState(true);
  const [selectedParamName, setSelectedParamName] = useState<string>("");

  // Employee modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeesData, setEmployeesData] = useState<UserWiseParameterRow[]>(
    [],
  );
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [savingBatch, setSavingBatch] = useState(false);

  // Working state for employee parameter values inside modal: Record<employeeId, boolean>
  const [workingValues, setWorkingValues] = useState<Record<string, boolean>>(
    {},
  );
  const [dirtyEmployeeIds, setDirtyEmployeeIds] = useState<Set<string>>(
    new Set(),
  );

  const loadDefinitions = async () => {
    setDefinitionsLoading(true);
    try {
      const defs = await parametersApi.getDefinitions();
      setDefinitions(defs);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to load parameter definitions",
      );
      setDefinitions([]);
    } finally {
      setDefinitionsLoading(false);
    }
  };

  useEffect(() => {
    loadDefinitions();
  }, []);

  const filteredParams = useMemo(() => {
    if (!paramSearch.trim()) return definitions;
    const q = paramSearch.toLowerCase();
    return definitions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [definitions, paramSearch]);

  // Open employee modal for selected parameter
  const openParameterModal = async (paramName: string) => {
    setSelectedParamName(paramName);
    setEmployeeSearch("");
    setLoadingEmployees(true);
    setModalOpen(true);
    try {
      const res = await parametersApi.listUserParameters({
        parameterName: paramName,
      });
      const rows = res.data || [];
      setEmployeesData(rows);

      // Initialize working values map
      const initialMap: Record<string, boolean> = {};
      for (const row of rows) {
        initialMap[row.employeeId] = Boolean(row.parameterValue);
      }
      setWorkingValues(initialMap);
      setDirtyEmployeeIds(new Set());
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to load employees for parameter",
      );
    } finally {
      setLoadingEmployees(false);
    }
  };

  // Toggle value for an employee in modal
  const handleToggleValue = (empId: string) => {
    const currentVal = workingValues[empId] ?? false;
    const newVal = !currentVal;
    setWorkingValues((prev) => ({ ...prev, [empId]: newVal }));
    setDirtyEmployeeIds((prev) => {
      const next = new Set(prev);
      next.add(empId);
      return next;
    });
  };

  // Filtered employees inside modal (with live working values)
  const modalRowData = useMemo(() => {
    const rows = employeesData.map((emp) => ({
      ...emp,
      currentWorkingValue:
        workingValues[emp.employeeId] ?? Boolean(emp.parameterValue),
    }));

    if (!employeeSearch.trim()) return rows;
    const q = employeeSearch.toLowerCase();
    return rows.filter(
      (e) =>
        e.employeeCode.toLowerCase().includes(q) ||
        e.employeeName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q) ||
        e.designationName.toLowerCase().includes(q),
    );
  }, [employeesData, employeeSearch, workingValues]);

  // Save changes from modal
  const handleSaveModal = async () => {
    if (dirtyEmployeeIds.size === 0) {
      setModalOpen(false);
      return;
    }

    setSavingBatch(true);
    try {
      const itemsToUpdate = Array.from(dirtyEmployeeIds).map((empId) => ({
        employeeId: empId,
        parameterValue: workingValues[empId],
      }));

      await parametersApi.batchUpsertUserParameters({
        parameterName: selectedParamName,
        items: itemsToUpdate,
      });

      toast.success(
        `Updated ${itemsToUpdate.length} employee settings for "${selectedParamName}".`,
      );

      // Refresh current user Redux parameters if their record was updated
      const myEmpId = user?.employeeId || user?.employee?.id;
      if (myEmpId && dirtyEmployeeIds.has(myEmpId)) {
        await dispatch(fetchUserParameters());
      }

      setDirtyEmployeeIds(new Set());
      setModalOpen(false);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.message ||
          "Failed to save employee parameters",
      );
    } finally {
      setSavingBatch(false);
    }
  };

  const parameterColDefs = useMemo<ColDef<ParameterDefinition>[]>(
    () => [
      {
        field: "srNo",
        headerName: "Sr No.",
        width: 50,
      },
      {
        field: "name",
        headerName: "Parm Name",
        width: 160,
      },
      {
        field: "description",
        headerName: "Parm Desc",
        width: 280,
      },
      {
        field: "defaultValueLabel",
        headerName: "Default Value",
        width: 100,
      },
      {
        headerName: "Employee Check",
        width: 160,
        cellRenderer: (p: any) => {
          const isSelected = selectedParamName === p.data?.name && modalOpen;
          return (
            <div>
              <Button
                size="sm"
                className="h-7"
                variant={isSelected ? "default" : "outline"}
                onClick={() => openParameterModal(p.data.name)}
              >
                Employee
              </Button>
            </div>
          );
        },
      },
    ],
    [selectedParamName, modalOpen],
  );

  // ─── Modal Employee DataGrid Column Definitions ─────────────────
  const employeeModalColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "currentWorkingValue",
        headerName: "Val.",
        width: 50,
        cellRenderer: (p: any) => {
          const isChecked = Boolean(p.value);

          return (
            <div className="flex items-center justify-center h-full">
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => handleToggleValue(p.data?.employeeId)}
              />
            </div>
          );
        },
      },
      {
        field: "employeeCode",
        headerName: "Employee ID",
        width: 120,
      },
      {
        field: "employeeName",
        headerName: "Employee Name",
        width: 160,
      },
      {
        field: "departmentName",
        headerName: "Department Name",
        width: 160,
      },
      {
        field: "designationName",
        headerName: "Designation Name",
      },
    ],
    [dirtyEmployeeIds, workingValues],
  );

  return (
    <div className="space-y-3 font-sans">
      <ListingCard>
        {/* Parameter Master Section with DataGrid */}
        <div className="p-3.5 space-y-3">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-64">
              <Input
                placeholder="Search"
                value={paramSearch}
                onChange={(e) => setParamSearch(e.target.value)}
                className="h-8 text-xs pl-2.5 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
              />
            </div>
          </div>

          {/* AG-Grid DataGrid for Parameter Master */}
          <div className="h-[520px] relative">
            {definitionsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading parameters...
              </div>
            ) : filteredParams.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No parameters found.
              </div>
            ) : (
              <DataGrid
                rowData={filteredParams}
                columnDefs={parameterColDefs}
                gridOptions={{
                  onRowDoubleClicked: (e) => {
                    if (e.data?.name) openParameterModal(e.data.name);
                  },
                  rowHeight: 35,
                }}
              />
            )}
          </div>
        </div>
      </ListingCard>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[780px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedParamName}</DialogTitle>
          </DialogHeader>

          <div className="h-[430px] p-1 bg-white dark:bg-slate-950">
            <DataGrid
              rowData={modalRowData}
              columnDefs={employeeModalColDefs}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={handleSaveModal}
              disabled={savingBatch || dirtyEmployeeIds.size === 0}
            >
              {savingBatch ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
