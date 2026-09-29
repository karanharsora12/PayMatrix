import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { GridDeleteCell, GridDateFloatingFilter } from "@/components/common";
import { ListingCard } from "@/components/common/ListingCard";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { companyApi } from "@/api/companies";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";

export default function Company() {
  const gridRef = useRef<AgGridReact>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    city: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: () => companyApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error creating company"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      companyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error updating company"),
  });

  const deleteMutation = useMutation({
    mutationFn: companyApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error deleting company"),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", email: "", city: "" });
  };

  const handleEdit = (company: any) => {
    setEditingId(company.id);
    setFormData({
      code: company.code || "",
      name: company.name || "",
      email: company.email || "",
      city: company.city || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      deleteMutation.mutate(id);
    }
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
      { field: "email", headerName: "Email", flex: 1 },
      { field: "city", headerName: "City", width: 150 },
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

  const allCompanies = data?.data || [];
  const companies = allCompanies.filter(
    (c: any) =>
      !searchQuery ||
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Companies"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => {
            resetForm();
            setOpen(true);
          }}
          addButtonText="Add Company"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["companies"] })
          }
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "companies.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Companies")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Companies")
          }
        />

        <div className="h-[500px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Loading companies...
            </div>
          ) : (
            <DataGrid
              ref={gridRef}
              rowData={companies}
              columnDefs={columnDefs}
              gridOptions={{ onRowDoubleClicked: (e) => handleEdit(e.data) }}
            />
          )}
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
            <DialogTitle>Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Company Code
              </label>
              <Input
                placeholder="e.g. PMX"
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Company Name
              </label>
              <Input
                placeholder="e.g. PayMatrix Technologies"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input
                placeholder="e.g. contact@paymatrix.com"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">City</label>
              <Input
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, city: e.target.value }))
                }
              />
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
    </div>
  );
}
