import { departments } from "@/mock/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/common/DataGrid"
import { useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function Departments(){
  const [open,setOpen]=useState(false)
  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120, cellClass: "font-mono text-xs" },
    { field: "name", headerName: "Name", flex: 1, cellClass: "font-medium" },
    { field: "manager", headerName: "Manager", flex: 1 },
    { field: "employees", headerName: "Employees", width: 150 },
    { field: "status", headerName: "Status", width: 150, cellRenderer: (params: any) => <Badge variant="success">{params.value}</Badge> },
    { field: "createdAt", headerName: "Created", width: 150, cellClass: "text-sm" },
    {
      headerName: "Actions",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: () => (
        <div className="flex gap-1 items-center justify-center h-full">
          <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil className="h-4 w-4"/></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4"/></Button>
        </div>
      )
    }
  ], []);

  return <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Departments</div><div className="text-2xl font-bold">8</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Active</div><div className="text-2xl font-bold">8</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Employees</div><div className="text-2xl font-bold">1,248</div></CardContent></Card>
    </div>
    <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Departments</h1><Button onClick={()=>setOpen(true)}><Plus className="h-4 w-4 mr-2"/>Add Department</Button></div>
    <div className="h-[500px]">
      <DataGrid rowData={departments} columnDefs={columnDefs} />
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onClose={()=>setOpen(false)}><DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
      <div className="space-y-3"><Input placeholder="Department Code"/><Input placeholder="Department Name"/><Input placeholder="Manager"/><Button className="w-full" onClick={()=>{toast.success("Department created");setOpen(false)}}>Save</Button></div>
    </DialogContent></Dialog>
  </div>
}
