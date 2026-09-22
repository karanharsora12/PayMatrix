import { branches } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Building2, MapPin } from "lucide-react"
import { DataGrid } from "@/components/common/DataGrid"
import { useMemo } from "react"
import type { ColDef } from "ag-grid-community"

export default function Branches(){
  const columnDefs = useMemo<ColDef[]>(() => [
    { field: "code", headerName: "Code", width: 120, cellClass: "font-mono text-xs" },
    { field: "name", headerName: "Name", flex: 1 },
    { field: "city", headerName: "City", flex: 1 },
    { field: "manager", headerName: "Manager", flex: 1 },
    { field: "employees", headerName: "Employees", width: 150 },
    { field: "status", headerName: "Status", width: 150, cellRenderer: (params: any) => <Badge variant="success">{params.value}</Badge> }
  ], []);

  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Branches</h1><Button><Plus className="h-4 w-4 mr-2"/>Add Branch</Button></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {branches.map(b=><Card key={b.code} className="p-4"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary"/><span className="font-medium text-sm">{b.name}</span></div><div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3"/>{b.city}, {b.state}</div><div className="text-xs mt-2">{b.employees} employees</div></Card>)}
    </div>
    <div className="h-[500px]">
      <DataGrid rowData={branches} columnDefs={columnDefs} />
    </div>
  </div>
}
