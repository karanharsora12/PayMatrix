import { departmentApi } from "@/api/departments";
import { designationApi } from "@/api/designations";
import { useAlert } from "@/components/common/AlertProvider";
import { GridDateFloatingFilter, GridDeleteCell } from "@/components/common";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { formatCurrency } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/use-toast";

export default function Designations() {
  const gridRef = useRef<AgGridReact>(null);
  const { confirm } = useAlert();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    departmentId: "",
    grade: "",
    minimumSalary: "",
    maximumSalary: "",
  });
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["designations"],
    queryFn: () => designationApi.list(),
  });

  const { data: deptsData } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentApi.list(),
  });
  const departments = deptsData?.data || [];

  const createMutation = useMutation({
    mutationFn: designationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error creating designation"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      designationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error updating designation"),
  });

  const deleteMutation = useMutation({
    mutationFn: designationApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation deleted successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error deleting designation"),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      departmentId: "",
      grade: "",
      minimumSalary: "",
      maximumSalary: "",
    });
  };

  const handleEdit = (desig: any) => {
    setEditingId(desig.id);
    setFormData({
      code: desig.code || "",
      name: desig.name || "",
      departmentId: desig.departmentId || "",
      grade: desig.grade || "",
      minimumSalary: desig.minimumSalary?.toString() || "",
      maximumSalary: desig.maximumSalary?.toString() || "",
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

    const payload = {
      ...formData,
      departmentId: formData.departmentId || undefined,
      minimumSalary: formData.minimumSalary
        ? Number(formData.minimumSalary)
        : undefined,
      maximumSalary: formData.maximumSalary
        ? Number(formData.maximumSalary)
        : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 120 },
      { field: "name", headerName: "Name", flex: 1 },
      {
        field: "department",
        headerName: "Department",
        flex: 1,
        valueGetter: (params) => params.data.department?.name || "None",
      },
      {
        field: "grade",
        headerName: "Grade",
        width: 120,
        cellRenderer: (params: any) =>
          params.value ? <Badge variant="outline">{params.value}</Badge> : null,
      },
      {
        field: "minimumSalary",
        headerName: "Min",
        width: 150,
        valueFormatter: (params: any) =>
          params.value ? formatCurrency(params.value) : "-",
      },
      {
        field: "maximumSalary",
        headerName: "Max",
        width: 150,
        valueFormatter: (params: any) =>
          params.value ? formatCurrency(params.value) : "-",
      },
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
      {
        headerName: "",
        width: 60,
        sortable: false,
        filter: false,
        cellRenderer: GridDeleteCell,
        cellRendererParams: {
          onDelete: handleDelete,
        },
      },
    ],
    [],
  );

  const allDesignationsData = data?.data || [];
  const designationsData = allDesignationsData.filter(
    (d: any) =>
      !searchQuery ||
      d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <ListingCard>
        <ListingHeader
          title="Designations"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => {
            resetForm();
            setOpen(true);
          }}
          addButtonText="Add Designation"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["designations"] })
          }
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "designations.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Designations")
          }
          onPrint={() =>
            gridRef.current?.api &&
            gridPrint(gridRef.current.api, "Designations")
          }
        />
        <div className="h-[500px]">
          <DataGrid
            ref={gridRef}
            rowData={designationsData}
            columnDefs={columnDefs}
            gridOptions={{ onRowDoubleClicked: (e) => handleEdit(e.data) }}
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
            <DialogTitle>Designation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Designation Code
                </label>
                <Input
                  placeholder="e.g. DES-SE1"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Designation Name
                </label>
                <Input
                  placeholder="e.g. Software Engineer"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Department
                </label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(val) =>
                    setFormData((p) => ({ ...p, departmentId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Grade</label>
                <Input
                  placeholder="e.g. A, B, C"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, grade: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Min Salary
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 60000"
                  value={formData.minimumSalary}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      minimumSalary: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Max Salary
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 95000"
                  value={formData.maximumSalary}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      maximumSalary: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
