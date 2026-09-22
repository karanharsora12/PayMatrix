import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Search, Plus, Upload, Download, Eye } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NativeSelect } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEmployees } from "@/hooks/useEmployees";
import { employees as mockEmployees } from "@/mock/data";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDeleteCell } from "@/components/common/GridDeleteCell";
import type { ColDef } from "ag-grid-community";

export default function Employees() {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("search") ?? "";
  const dept = searchParams.get("department") ?? "";
  const status = searchParams.get("status") ?? "";
  const [showImport, setShowImport] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string | number>>(new Set());

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const filters = useMemo(
    () => ({
      search: q || undefined,
      departmentId: dept || undefined,
      status: status || undefined,
    }),
    [q, dept, status],
  );

  const { data, isLoading, isError } = useEmployees(filters);

  // Fallback to mock if API not reachable (dev without backend)
  const useMock = isError && !data;

  // Filtered list passed to DataGrid
  const employeeList = useMemo(() => {
    let source: any[] =
      data?.data && data.data.length > 0 ? [...data.data] : [...mockEmployees];

    // Filter out deleted
    source = source.filter((e) => !deletedIds.has(e.id));

    if (q) {
      const query = q.toLowerCase();
      source = source.filter((e) =>
        `${e.firstName ?? ""} ${e.lastName ?? ""} ${e.employeeId ?? e.employeeCode ?? ""} ${e.email ?? ""}`
          .toLowerCase()
          .includes(query),
      );
    }
    if (dept) {
      source = source.filter(
        (e) => (e.department?.name ?? e.department) === dept,
      );
    }
    if (status) {
      source = source.filter(
        (e) => (e.status ?? e.employmentStatus) === status,
      );
    }
    return source;
  }, [data, mockEmployees, deletedIds, q, dept, status]);

  const handleDelete = useCallback((id: string | number, name: string) => {
    setDeletedIds((prev) => new Set([...prev, id]));
    toast.success(`Removed ${name} successfully`);
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => {
    return [
      {
        field: "employeeCode",
        headerName: "Code",
        width: 110,
        valueGetter: (params) =>
          params.data?.employeeCode ??
          params.data?.employeeId ??
          `EMP${String(params.data?.id || "").padStart(3, "0")}`,
        cellClass: "font-mono font-medium text-slate-700 dark:text-slate-300",
      },
      {
        field: "employee",
        headerName: "Employee",
        width: 150,
        valueGetter: (params) => {
          const first = params.data?.firstName ?? params.data?.first_name ?? "";
          const last = params.data?.lastName ?? params.data?.last_name ?? "";
          return `${first} ${last}`.trim() || params.data?.name || "—";
        },
      },
      {
        field: "department",
        headerName: "Department",
        width: 120,
        valueGetter: (params) =>
          params.data?.department?.name ?? params.data?.department ?? "—",
      },
      {
        field: "designation",
        headerName: "Designation",
        width: 140,
        valueGetter: (params) =>
          params.data?.designation?.name ?? params.data?.designation ?? "—",
      },
      {
        field: "branch",
        headerName: "Branch",
        width: 120,
        valueGetter: (params) =>
          params.data?.branch?.name ?? params.data?.branch ?? "—",
      },
      {
        field: "salary",
        headerName: "Salary",
        width: 120,
        type: "numericColumn",
        valueGetter: (params) => Number(params.data?.salary ?? 0),
        valueFormatter: (params) => formatCurrency(Number(params.value ?? 0)),
      },
      {
        field: "status",
        headerName: "Status",
        width: 115,
      },
      {
        headerName: "",
        width: 60,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params: any) => {
          if (!params.data) return null;
          return (
            <GridDeleteCell
              {...params}
              onDelete={(id) => {
                const name =
                  `${params.data.firstName ?? ""} ${params.data.lastName ?? ""}`.trim() ||
                  "Employee";
                handleDelete(id, name);
              }}
            />
          );
        },
      },
    ];
  }, [nav, handleDelete]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Employees
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowImport(true)}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Exported employees to Excel")}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => nav("/employees/new")}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, email..."
              className="pl-9 h-8 text-xs"
              value={q}
              onChange={(e) => setParam("search", e.target.value)}
            />
          </div>
          <NativeSelect
            value={dept}
            onChange={(v) => setParam("department", v)}
            placeholder="All Departments"
            className="w-[180px] h-8 text-xs"
          >
            <option value="">All Departments</option>
            <option>Engineering</option>
            <option>Finance</option>
            <option>Marketing</option>
            <option>Sales</option>
            <option>Human Resources</option>
          </NativeSelect>
          <NativeSelect
            value={status}
            onChange={(v) => setParam("status", v)}
            placeholder="All Status"
            className="w-[160px] h-8 text-xs"
          >
            <option value="">All Status</option>
            <option>Active</option>
            <option>On Leave</option>
            <option>Probation</option>
            <option>Inactive</option>
          </NativeSelect>
        </CardContent>
      </Card>

      <div className="w-full" style={{ height: "450px" }}>
        <DataGrid
          rowData={employeeList}
          columnDefs={columnDefs}
          pageSize={15}
          gridOptions={{
            onRowDoubleClicked: (e) => {
              if (e.data?.id) nav(`/employees/${e.data.id}`);
            },
          }}
        />
      </div>

      {/* Import Modal */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent onClose={() => setShowImport(false)}>
          <DialogHeader>
            <DialogTitle>Import Employees</DialogTitle>
          </DialogHeader>
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">
            Drop Excel file here or click to browse
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowImport(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Imported 12 employees");
                setShowImport(false);
              }}
            >
              Import
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
