import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataGrid } from "@/components/common/DataGrid";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { designationApi } from "@/api/designations";
import { departmentApi } from "@/api/departments";
import { formatCurrency } from "@/lib/utils";
import type { ColDef } from "ag-grid-community";

export default function Designations() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    code: "", 
    name: "", 
    departmentId: "", 
    grade: "", 
    minimumSalary: "", 
    maximumSalary: "" 
  });
  
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
    onError: (err: any) => toast.error(err.response?.data?.message || "Error creating designation")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => designationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation updated successfully");
      setOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error updating designation")
  });

  const deleteMutation = useMutation({
    mutationFn: designationApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designations"] });
      toast.success("Designation deleted successfully");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Error deleting designation")
  });

  const resetForm = () => {
    setEditingId(null);
    setFormData({ code: "", name: "", departmentId: "", grade: "", minimumSalary: "", maximumSalary: "" });
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

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this designation?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    if (!formData.code || !formData.name) {
      toast.error("Code and Name are required");
      return;
    }
    
    const payload = {
      ...formData,
      departmentId: formData.departmentId || undefined,
      minimumSalary: formData.minimumSalary ? Number(formData.minimumSalary) : undefined,
      maximumSalary: formData.maximumSalary ? Number(formData.maximumSalary) : undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120, cellClass: "font-mono text-xs" },
    { field: "name", headerName: "Name", flex: 1, cellClass: "font-medium" },
    { 
      field: "department", 
      headerName: "Department", 
      flex: 1,
      valueGetter: (params) => params.data.department?.name || "None"
    },
    { 
      field: "grade", 
      headerName: "Grade", 
      width: 120,
      cellRenderer: (params: any) => params.value ? <Badge variant="outline">{params.value}</Badge> : null
    },
    { 
      field: "minimumSalary", 
      headerName: "Min", 
      width: 150,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-'
    },
    { 
      field: "maximumSalary", 
      headerName: "Max", 
      width: 150,
      valueFormatter: (params: any) => params.value ? formatCurrency(params.value) : '-'
    },
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
      headerName: "Actions",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => (
        <div className="flex gap-1 items-center justify-center h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(params.data)}>
            <Pencil className="h-4 w-4"/>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(params.data.id)}>
            <Trash2 className="h-4 w-4"/>
          </Button>
        </div>
      )
    }
  ], []);

  const designationsData = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Designations</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2"/>Add Designation
        </Button>
      </div>

      <div className="h-[500px]">
        <DataGrid rowData={designationsData} columnDefs={columnDefs} />
      </div>

      <Dialog open={open} onOpenChange={(v) => { if(!v) resetForm(); setOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? "Edit Designation" : "Add Designation"}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Designation Code</label>
                <Input 
                  placeholder="e.g. DES-SE1" 
                  value={formData.code} 
                  onChange={e => setFormData(p => ({ ...p, code: e.target.value }))} 
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Designation Name</label>
                <Input 
                  placeholder="e.g. Software Engineer" 
                  value={formData.name} 
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Department</label>
                <Select value={formData.departmentId} onValueChange={(val) => setFormData(p => ({ ...p, departmentId: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Grade</label>
                <Input 
                  placeholder="e.g. A, B, C" 
                  value={formData.grade} 
                  onChange={e => setFormData(p => ({ ...p, grade: e.target.value }))} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Min Salary</label>
                <Input 
                  type="number"
                  placeholder="e.g. 60000" 
                  value={formData.minimumSalary} 
                  onChange={e => setFormData(p => ({ ...p, minimumSalary: e.target.value }))} 
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Max Salary</label>
                <Input 
                  type="number"
                  placeholder="e.g. 95000" 
                  value={formData.maximumSalary} 
                  onChange={e => setFormData(p => ({ ...p, maximumSalary: e.target.value }))} 
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
