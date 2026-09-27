import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { locationApi } from "@/api/locations";
import type { ColDef } from "ag-grid-community";

export default function Locations() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "", address: "", city: "", state: "", country: "", postalCode: "" });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: () => locationApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: locationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location created successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error creating location")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => locationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error updating location")
  });

  const deleteMutation = useMutation({
    mutationFn: locationApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting location")
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", address: "", city: "", state: "", country: "", postalCode: "" });
  };

  const handleEdit = (loc: any) => {
    setEditingId(loc.id);
    setFormData({
      code: loc.code || "",
      name: loc.name || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      country: loc.country || "",
      postalCode: loc.postalCode || "",
    });
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
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
    { field: "city", headerName: "City", width: 130 },
    { field: "state", headerName: "State", width: 130 },
    { field: "country", headerName: "Country", width: 130 },
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

  const locations = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Locations</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />Add Location
        </Button>
      </div>
      <div className="h-[500px]">
        <DataGrid 
          rowData={locations} 
          columnDefs={columnDefs} 
          gridOptions={{
            onRowDoubleClicked: (e) => handleEdit(e.data)
          }}
        />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Location" : "Add Location"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Location Code</label>
                <Input
                  placeholder="e.g. LOC-01"
                  value={formData.code}
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Location Name</label>
                <Input
                  placeholder="e.g. South Office"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Address</label>
              <Input
                placeholder="Street address"
                value={formData.address}
                onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">State</label>
                <Input
                  placeholder="State/Province"
                  value={formData.state}
                  onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Country</label>
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Postal Code</label>
                <Input
                  placeholder="ZIP / PIN code"
                  value={formData.postalCode}
                  onChange={e => setFormData(p => ({ ...p, postalCode: e.target.value }))}
                />
              </div>
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
