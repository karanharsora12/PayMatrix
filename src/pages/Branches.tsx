import { branchApi } from "@/api/branches";
import { useAlert } from "@/components/common/AlertProvider";
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
import { toast } from "@/components/ui/use-toast";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import { Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Branches() {
  const gridRef = useRef<AgGridReact>(null);
  const { hasPermission } = useAuth();
  const canAdd = hasPermission("branches.create") || hasPermission("branches.add");
  const canEdit = hasPermission("branches.edit") || hasPermission("branches.update");
  const canDelete = hasPermission("branches.delete") || hasPermission("branches.remove");
  const canExport = hasPermission("branches.export") || hasPermission("branches.view");
  const { confirm } = useAlert();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    city: "",
    state: "",
    email: "",
    phone: "",
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: branchApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error creating branch"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      branchApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error updating branch"),
  });

  const deleteMutation = useMutation({
    mutationFn: branchApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Branch deleted successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error deleting branch"),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      city: "",
      state: "",
      email: "",
      phone: "",
    });
  };

  const handleEdit = (branch: any) => {
    setEditingId(branch.id);
    setFormData({
      code: branch.code || "",
      name: branch.name || "",
      city: branch.city || "",
      state: branch.state || "",
      email: branch.email || "",
      phone: branch.phone || "",
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      await confirm({ message: "Are you sure you want to delete this branch?" })
    ) {
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
      { field: "city", headerName: "City", width: 150 },
      { field: "state", headerName: "State", width: 150 },
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
      ...(canDelete
        ? [
            {
              headerName: "",
              width: 80,
              sortable: false,
              filter: false,
              cellRenderer: (params: any) => (
                <div className="flex gap-1 items-center justify-center h-full">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(params.data.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [canDelete],
  );

  const allBranches = data?.data || [];
  const branches = allBranches.filter(
    (b: any) =>
      !searchQuery ||
      b.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Branches"
          module="branches"
          canAdd={canAdd}
          canExport={canExport}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => {
            resetForm();
            setOpen(true);
          }}
          addButtonText="Add Branch"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["branches"] })
          }
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "branches.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Branches")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Branches")
          }
        />
        <div className="h-[500px]">
          <DataGrid
            ref={gridRef}
            rowData={branches}
            columnDefs={columnDefs}
            gridOptions={{
              onRowDoubleClicked: canEdit ? (e) => handleEdit(e.data) : undefined,
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
            <DialogTitle>Branch</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Branch Code
              </label>
              <Input
                placeholder="e.g. BR-HQ"
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">
                Branch Name
              </label>
              <Input
                placeholder="e.g. Headquarters"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="text-xs font-medium mb-1 block">State</label>
                <Input
                  placeholder="e.g. Maharashtra"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, state: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Email</label>
                <Input
                  placeholder="Branch email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Phone</label>
                <Input
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, phone: e.target.value }))
                  }
                />
              </div>
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
    </div>
  );
}
