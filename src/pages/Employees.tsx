import { departmentApi } from "@/api/departments";
import { designationApi } from "@/api/designations";
import { DataGrid } from "@/components/common/DataGrid";
import { GridDateFloatingFilter } from "@/components/common/GridDateFloatingFilter";
import { ActionMenu } from "@/components/common/ActionMenu";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { Upload, User, Edit2, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAlert } from "@/components/common/AlertProvider";
import { employeeApi } from "@/api/employees";

export default function Employees() {
  const { hasPermission } = useAuth();
  const gridRef = useRef<AgGridReact>(null);
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { confirm } = useAlert();
  const q = searchParams.get("search") ?? "";
  const dept = searchParams.get("department") ?? "";
  const desig = searchParams.get("designation") ?? "";
  const status = searchParams.get("status") ?? "";

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const handleDeptChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== "ALL") {
      next.set("department", value);
    } else {
      next.delete("department");
    }
    // Clear designation filter when department changes
    next.delete("designation");
    setSearchParams(next);
  };

  const handleDesigChange = (value: string) => {
    setParam("designation", value);
  };

  const handleStatusChange = (value: string) => {
    setParam("status", value);
  };

  const { data: deptsData } = useQuery({
    queryKey: ["departments", "list"],
    queryFn: () =>
      departmentApi
        .list({ page: 1, pageSize: 100 })
        .catch(() => ({ data: [] })),
  });

  const { data: desigsData } = useQuery({
    queryKey: ["designations", "list"],
    queryFn: () =>
      designationApi
        .list({ page: 1, pageSize: 100 })
        .catch(() => ({ data: [] })),
  });

  const isUUID = (val?: string) =>
    val
      ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          val,
        )
      : false;

  const filters = useMemo(() => {
    let departmentId: string | undefined;
    if (dept && dept !== "ALL") {
      if (isUUID(dept)) {
        departmentId = dept;
      } else if (Array.isArray(deptsData?.data)) {
        const match = deptsData.data.find(
          (d: any) => d.name?.toLowerCase() === dept.toLowerCase(),
        );
        if (match && isUUID(match.id)) departmentId = match.id;
      }
    }

    let designationId: string | undefined;
    if (desig && desig !== "ALL") {
      if (isUUID(desig)) {
        designationId = desig;
      } else if (Array.isArray(desigsData?.data)) {
        const match = desigsData.data.find(
          (d: any) => d.name?.toLowerCase() === desig.toLowerCase(),
        );
        if (match && isUUID(match.id)) designationId = match.id;
      }
    }

    return {
      search: q || undefined,
      departmentId,
      designationId,
      status: status && status !== "ALL" ? status : undefined,
    };
  }, [q, dept, desig, status, deptsData, desigsData]);

  const { data, refetch, isLoading } = useEmployees(filters);

  const departmentOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    if (Array.isArray(deptsData?.data)) {
      deptsData.data.forEach((d: any) => {
        if (d?.name && !seen.has(d.name.toLowerCase())) {
          seen.add(d.name.toLowerCase());
          list.push({ id: d.id || d.name, name: d.name });
        }
      });
    }

    if (Array.isArray(data?.data)) {
      data.data.forEach((e: any) => {
        const name =
          e.department?.name ??
          (typeof e.department === "string" ? e.department : null);
        const id = e.department?.id ?? e.departmentId ?? name;
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          list.push({ id: id || name, name });
        }
      });
    }

    return list;
  }, [deptsData, data]);

  const selectedDeptObj = useMemo(() => {
    if (!dept || dept === "ALL") return null;
    return (
      departmentOptions.find(
        (d) => d.id === dept || d.name.toLowerCase() === dept.toLowerCase(),
      ) || null
    );
  }, [dept, departmentOptions]);

  // Designations filtered according to selected department
  const designationOptions = useMemo(() => {
    const allDesigs: {
      id: string;
      name: string;
      departmentId?: string;
      departmentName?: string;
    }[] = [];
    const seen = new Set<string>();

    if (Array.isArray(desigsData?.data)) {
      desigsData.data.forEach((d: any) => {
        if (d?.name && !seen.has(d.name.toLowerCase())) {
          seen.add(d.name.toLowerCase());
          allDesigs.push({
            id: d.id || d.name,
            name: d.name,
            departmentId: d.departmentId || d.department?.id,
            departmentName: d.department?.name,
          });
        }
      });
    }

    if (Array.isArray(data?.data)) {
      data.data.forEach((e: any) => {
        const name =
          e.designation?.name ??
          (typeof e.designation === "string" ? e.designation : null);
        const id = e.designation?.id ?? e.designationId ?? name;
        const empDeptName =
          e.department?.name ??
          (typeof e.department === "string" ? e.department : undefined);
        const empDeptId = e.department?.id ?? e.departmentId;
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          allDesigs.push({
            id: id || name,
            name,
            departmentId: empDeptId,
            departmentName: empDeptName,
          });
        }
      });
    }

    // If no department is selected, return all designations
    if (!dept || dept === "ALL") {
      return allDesigs;
    }

    // Filter designations according to selected department
    return allDesigs.filter((d) => {
      if (
        selectedDeptObj?.id &&
        d.departmentId &&
        d.departmentId === selectedDeptObj.id
      ) {
        return true;
      }
      if (
        selectedDeptObj?.name &&
        d.departmentName &&
        d.departmentName.toLowerCase() === selectedDeptObj.name.toLowerCase()
      ) {
        return true;
      }
      if (
        d.departmentName &&
        d.departmentName.toLowerCase() === dept.toLowerCase()
      ) {
        return true;
      }
      if (d.departmentId && d.departmentId === dept) {
        return true;
      }
      return false;
    });
  }, [desigsData, data, dept, selectedDeptObj]);

  const employeeList = useMemo(() => {
    let source: any[] =
      data?.data && data.data.length > 0 ? [...data.data] : [];

    if (q) {
      const query = q.toLowerCase();
      source = source.filter((e) =>
        `${e.firstName ?? ""} ${e.lastName ?? ""} ${e.employeeId ?? e.employeeCode ?? ""} ${e.email ?? ""}`
          .toLowerCase()
          .includes(query),
      );
    }
    if (dept && dept !== "ALL") {
      source = source.filter((e) => {
        const dName =
          e.department?.name ??
          (typeof e.department === "string" ? e.department : "");
        const dId = e.department?.id ?? e.departmentId;
        return (
          dName.toLowerCase() === dept.toLowerCase() ||
          dId === dept ||
          (selectedDeptObj &&
            (dId === selectedDeptObj.id ||
              dName.toLowerCase() === selectedDeptObj.name.toLowerCase()))
        );
      });
    }
    if (desig && desig !== "ALL") {
      source = source.filter((e) => {
        const dName =
          e.designation?.name ??
          (typeof e.designation === "string" ? e.designation : "");
        const dId = e.designation?.id ?? e.designationId;
        return (
          dName.toLowerCase() === desig.toLowerCase() ||
          dId === desig ||
          designationOptions.some(
            (opt) =>
              (opt.id === desig ||
                opt.name.toLowerCase() === desig.toLowerCase()) &&
              (opt.id === dId ||
                opt.name.toLowerCase() === dName.toLowerCase()),
          )
        );
      });
    }
    if (status && status !== "ALL") {
      source = source.filter(
        (e) =>
          (e.status ?? e.employmentStatus)?.toLowerCase() ===
          status.toLowerCase(),
      );
    }
    return source;
  }, [data, q, dept, desig, status, selectedDeptObj, designationOptions]);

  const handleDelete = useCallback(
    (id: string | number, name: string) => {
      confirm({
        title: "Delete Employee",
        message: `Are you sure you want to remove ${name}? This action cannot be undone.`,
        confirmText: "Delete",
        onConfirm: async () => {
          try {
            await employeeApi.remove(id.toString());
            toast.success(`Removed ${name} successfully`);
            refetch();
          } catch (err: any) {
            toast.error(err.message || "Failed to delete employee");
          }
        },
      });
    },
    [confirm, refetch],
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    const cols: ColDef[] = [
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
        field: "joiningDate",
        headerName: "Joining Date",
        width: 130,
        cellClass: "font-mono text-sm",
        valueFormatter: (params) => {
          if (!params.value) return "—";
          if (params.value.includes("-")) {
            const [year, month, day] = params.value.split("T")[0].split("-");
            return `${day}/${month}/${year}`;
          }
          return new Date(params.value).toLocaleDateString();
        },
        filter: "agTextColumnFilter",
        floatingFilterComponent: GridDateFloatingFilter,
      },
      {
        field: "status",
        headerName: "Status",
        width: 115,
      },
    ];

    const hasEdit = hasPermission("employees.edit");
    const hasDelete = hasPermission("employees.delete");

    cols.push({
      headerName: "",
      width: 60,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: (params: any) => {
        if (!params.data) return null;
        return (
          <ActionMenu
            items={[
              {
                label: "View Profile",
                icon: <User className="h-4 w-4" />,
                onClick: () => nav(`/employees/${params.data.id}`),
              },
              {
                label: "Edit Employee",
                icon: <Edit2 className="h-4 w-4" />,
                onClick: () => nav(`/employees/${params.data.id}/edit`),
                hidden: !hasEdit,
              },
              {
                label: "Delete",
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                separator: true,
                onClick: () => {
                  const name =
                    `${params.data.firstName ?? ""} ${params.data.lastName ?? ""}`.trim() ||
                    "Employee";
                  handleDelete(params.data.id, name);
                },
                hidden: !hasDelete,
              },
            ]}
          />
        );
      },
    });
    return cols;
  }, [nav, handleDelete, hasPermission]);

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Employees"
          searchValue={q}
          onSearchChange={(v) => setParam("search", v)}
          onAddNew={
            hasPermission("employees.create")
              ? () => nav("/employees/new")
              : undefined
          }
          addButtonText="Add Employee"
          onRefresh={refetch}
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "employees.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Employees")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Employees")
          }
        />

        <div className="flex flex-wrap gap-2 mb-3">
          <NativeSelect
            value={dept || "ALL"}
            onChange={handleDeptChange}
            placeholder="All Departments"
            className="w-[180px] h-8 text-xs bg-background border-input"
          >
            <option value="ALL">All Departments</option>
            {departmentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            value={desig || "ALL"}
            onChange={handleDesigChange}
            placeholder={
              dept && dept !== "ALL" && designationOptions.length === 0
                ? "No Designations"
                : "All Designations"
            }
            className="w-[180px] h-8 text-xs bg-background border-input"
            disabled={Boolean(
              dept && dept !== "ALL" && designationOptions.length === 0,
            )}
          >
            <option value="ALL">All Designations</option>
            {designationOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </NativeSelect>
        </div>

        <div className="w-full" style={{ height: "450px" }}>
          <DataGrid
            ref={gridRef}
            rowData={employeeList}
            columnDefs={columnDefs}
            pageSize={15}
            gridOptions={{
              onRowDoubleClicked: (e) => {
                if (e.data?.id && hasPermission("employees.edit"))
                  nav(`/employees/${e.data.id}/edit`);
                else if (e.data?.id) nav(`/employees/${e.data.id}`);
              },
              loading: isLoading,
            }}
          />
        </div>
      </ListingCard>
    </div>
  );
}
