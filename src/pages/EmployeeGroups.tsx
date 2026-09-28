import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { ListingCard } from "@/components/common/ListingCard";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { employeeGroupApi } from "@/api/employeeGroups";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";

export default function EmployeeGroups() {
  const gridRef = useRef<AgGridReact>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["employeeGroups"],
    queryFn: () => employeeGroupApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: employeeGroupApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeGroups"] });
      toast.success("Group created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error creating group")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => employeeGroupApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeGroups"] });
      toast.success("Group updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error updating group")
  });

  const deleteMutation = useMutation({
    mutationFn: employeeGroupApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employeeGroups"] });
      toast.success("Group deleted successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting group")
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", description: "" });
  };

  const handleEdit = (group: any) => {
    setEditingId(group.id);
    setFormData({
      code: group.code || "",
      name: group.name || "",
      description: group.description || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this group?")) {
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

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120 },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "isActive",
      headerName: "Status",
      width: 120,
      cellRenderer: (p: any) => (
        <div className="flex items-center h-full">
          <div className={`h-2.5 w-2.5 rounded-full ${p.value ? "bg-emerald-500" : "bg-red-500"}`} title={p.value ? "Active" : "Inactive"} />
        </div>
      )
    },
    {
      headerName: "",
      width: 80,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex gap-1 items-center justify-center h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(params.data.id); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ], []);

  const allGroups = data?.data || [];
  const groups = allGroups.filter(
    (g: any) =>
      !searchQuery ||
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Employee Groups"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => { resetForm(); setOpen(true); }}
          addButtonText="Add Group"
          onRefresh={() => queryClient.invalidateQueries({ queryKey: ["employeeGroups"] })}
          onExportExcel={() => gridRef.current?.api && gridExportExcel(gridRef.current.api, "groups.csv")}
          onExportPdf={() => gridRef.current?.api && gridExportPdf(gridRef.current.api, "Employee Groups")}
          onPrint={() => gridRef.current?.api && gridPrint(gridRef.current.api, "Employee Groups")}
        />
        <div className="h-[500px]">
          <DataGrid 
            ref={gridRef}
            rowData={groups} 
            columnDefs={columnDefs} 
            gridOptions={{ onRowDoubleClicked: (e) => handleEdit(e.data) }}
          />
        </div>
      </ListingCard>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Group" : "Add Group"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Group Code</label>
              <Input
                placeholder="e.g. GRP-A"
                value={formData.code}
                onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Group Name</label>
              <Input
                placeholder="e.g. Senior Management"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Description</label>
              <Input
                placeholder="Brief description"
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <Button
              className="w-full mt-4"
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
