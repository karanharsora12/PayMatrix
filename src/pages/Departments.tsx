import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { departmentApi } from "@/api/departments";
import type { ColDef } from "ag-grid-community";

export default function Departments() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });

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
    onError: (err: any) => toast.error(err.response?.data?.message || "Error creating department")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => departmentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error updating department")
  });

  const deleteMutation = useMutation({
    mutationFn: departmentApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting department")
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this department?")) {
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
    { field: "code", headerName: "Code", width: 120, cellClass: "font-mono text-xs" },
    { field: "name", headerName: "Name", flex: 1, cellClass: "font-medium" },
    { field: "description", headerName: "Description", flex: 1 },
    {
      field: "isActive",
      headerName: "Status",
      width: 120,
      cellRenderer: (params: any) => (
        <Badge variant={params.value ? "success" : "secondary"}>
          {params.value ? "Active" : "Inactive"}
        </Badge>
      )
    },
    { field: "createdAt", headerName: "Created", width: 150, cellClass: "text-sm", valueFormatter: (params) => new Date(params.value).toLocaleDateString() },
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

  const departments = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Departments</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Department
        </Button>
      </div>

      <div className="h-[500px]">
        <DataGrid 
          rowData={departments} 
          columnDefs={columnDefs} 
          gridOptions={{
            onRowDoubleClicked: (e) => handleEdit(e.data)
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Department Code</label>
              <Input
                placeholder="e.g. ENG"
                value={formData.code}
                onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Department Name</label>
              <Input
                placeholder="e.g. Engineering"
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
