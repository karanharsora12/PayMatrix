import { departmentApi } from "@/api/departments";
import { useAlert } from "@/components/common/AlertProvider";
import { GridDateFloatingFilter, GridDeleteCell } from "@/components/common";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Departments() {
  const gridRef = useRef<AgGridReact>(null);
  const { hasPermission } = useAuth();
  const canAdd =
    hasPermission("departments.create") || hasPermission("departments.add");
  const canEdit =
    hasPermission("departments.edit") || hasPermission("departments.update");
  const canDelete =
    hasPermission("departments.delete") || hasPermission("departments.remove");
  const canExport =
    hasPermission("departments.export") || hasPermission("departments.view");
  const { confirm } = useAlert();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: departmentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error creating department"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      departmentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error updating department"),
  });

  const deleteMutation = useMutation({
    mutationFn: departmentApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error deleting department"),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", description: "" });
  };

  const handleEdit = (dept: any) => {
    setEditingId(dept.id);
    setFormData({
      code: dept.code || "",
      name: dept.name || "",
      description: dept.description || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Code and Name are required");
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 120 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "description", headerName: "Description", flex: 1 },
      {
        field: "isActive",
        headerName: "Status",
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
        field: "createdAt",
        headerName: "Created",
        width: 150,
        valueFormatter: (params) => {
          if (!params.value) return "";
          if (params.value.includes("-")) {
            const [year, month, day] = params.value.split("T")[0].split("-");
            return `${day}/${month}/${year}`;
          }
          return new Date(params.value).toLocaleDateString();
        },
        filter: "agTextColumnFilter",
        floatingFilterComponent: GridDateFloatingFilter,
      },
      ...(canDelete
        ? [
            {
              headerName: "",
              width: 60,
              sortable: false,
              filter: false,
              cellRenderer: GridDeleteCell,
              cellRendererParams: {
                onDelete: handleDelete,
                module: "departments",
              },
            },
          ]
        : []),
    ],
    [canDelete],
  );

  const allDepartments = data?.data || [];
  const departments = allDepartments.filter(
    (d: any) =>
      !searchQuery ||
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <ListingCard>
        <ListingHeader
          title="Departments"
          module="departments"
          canAdd={canAdd}
          canExport={canExport}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => {
            resetForm();
            setOpen(true);
          }}
          addButtonText="Add Department"
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
          }}
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "departments.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Departments")
          }
          onPrint={() =>
            gridRef.current?.api &&
            gridPrint(gridRef.current.api, "Departments")
          }
        />
        <div className="h-[500px]">
          <DataGrid
            ref={gridRef}
            rowData={departments}
            columnDefs={columnDefs}
            gridOptions={{
              onRowDoubleClicked: canEdit
                ? (e) => handleEdit(e.data)
                : undefined,
            }}
          />
        </div>
      </ListingCard>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetForm();
          setOpen(v);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Department Code
              </label>
              <Input
                placeholder="e.g. ENG"
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Department Name
              </label>
              <Input
                placeholder="e.g. Engineering"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Description
              </label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
