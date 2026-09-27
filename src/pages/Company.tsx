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
import { companyApi } from "@/api/companies";
import type { ColDef } from "ag-grid-community";

export default function Company() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", email: "", city: "" });

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
    onError: (err: any) => toast.error(err.response?.data?.message || "Error creating company")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => companyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error updating company")
  });

  const deleteMutation = useMutation({
    mutationFn: companyApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting company")
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

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120, cellClass: "font-mono text-xs" },
    { field: "name", headerName: "Name", flex: 1, cellClass: "font-medium" },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "city", headerName: "City", width: 150 },
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

  const companies = data?.data || [];

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Companies</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Company
        </Button>
      </div>

      <div className="h-[500px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">Loading companies...</div>
        ) : (
          <DataGrid 
            rowData={companies} 
            columnDefs={columnDefs} 
            gridOptions={{
              onRowDoubleClicked: (e) => handleEdit(e.data)
            }}
          />
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Company" : "Add Company"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Company Code</label>
              <Input
                placeholder="e.g. PMX"
                value={formData.code}
                onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Company Name</label>
              <Input
                placeholder="e.g. PayMatrix Technologies"
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Email</label>
              <Input
                placeholder="e.g. contact@paymatrix.com"
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">City</label>
              <Input
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
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
