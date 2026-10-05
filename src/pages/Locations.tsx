import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingHeader } from "@/components/common/ListingHeader";
import { ListingCard } from "@/components/common/ListingCard";
import { Trash2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { locationApi } from "@/api/locations";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";

export default function Locations() {
  const gridRef = useRef<AgGridReact>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postalCode: "",
  });

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
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error creating location"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      locationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error updating location"),
  });

  const deleteMutation = useMutation({
    mutationFn: locationApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || "Error deleting location"),
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      code: "",
      name: "",
      address: "",
      city: "",
      state: "",
      country: "",
      postalCode: "",
    });
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

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: "code", headerName: "Code", width: 120 },
      { field: "name", headerName: "Name", flex: 1 },
      { field: "city", headerName: "City", width: 130 },
      { field: "state", headerName: "State", width: 130 },
      { field: "country", headerName: "Country", width: 130 },
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
        headerName: "",
        width: 80,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => (
          <div className="flex gap-1 items-center justify-center h-full">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600"
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
    ],
    [],
  );

  const allLocations = data?.data || [];
  const locations = allLocations.filter(
    (l: any) =>
      !searchQuery ||
      l.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <ListingCard>
        <ListingHeader
          title="Locations"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          onAddNew={() => {
            resetForm();
            setOpen(true);
          }}
          addButtonText="Add Location"
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["locations"] })
          }
          onExportExcel={() =>
            gridRef.current?.api &&
            gridExportExcel(gridRef.current.api, "locations.csv")
          }
          onExportPdf={() =>
            gridRef.current?.api &&
            gridExportPdf(gridRef.current.api, "Locations")
          }
          onPrint={() =>
            gridRef.current?.api && gridPrint(gridRef.current.api, "Locations")
          }
        />
        <div className="h-[500px]">
          <DataGrid
            ref={gridRef}
            rowData={locations}
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
            <DialogTitle>Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Location Code
                </label>
                <Input
                  placeholder="e.g. LOC-01"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, code: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Location Name
                </label>
                <Input
                  placeholder="e.g. South Office"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Address</label>
              <Input
                placeholder="Street address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, address: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">City</label>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">State</label>
                <Input
                  placeholder="State/Province"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, state: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Country
                </label>
                <Input
                  placeholder="Country"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, country: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">
                  Postal Code
                </label>
                <Input
                  placeholder="ZIP / PIN code"
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, postalCode: e.target.value }))
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
    </div>
  );
}
