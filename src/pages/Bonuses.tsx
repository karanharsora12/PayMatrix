import { bonuses } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/common/DataGrid"
import type { ColDef } from "ag-grid-community"
import { useMemo } from "react"
import { Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Bonuses(){
  const bonusColDefs = useMemo<ColDef[]>(() => [
    { field: "employee", headerName: "Employee", flex: 1 },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "period", headerName: "Period", flex: 1 },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      cellRenderer: (p: any) => <Badge variant={p.value==="Approved"?"success":"warning"}>{p.value}</Badge> 
    }
  ], []);

  const deductionsColDefs = useMemo<ColDef[]>(() => [
    { field: "employee", headerName: "Employee", flex: 1 },
    { field: "type", headerName: "Type", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "recurring", headerName: "Recurring", flex: 1 },
    { field: "period", headerName: "Period", flex: 1 }
  ], []);

  const dummyDeductions = [
    { employee: "Sneha Kapoor", type: "Advance Recovery", amount: 5000, recurring: "Yes", period: "Sep-Nov 2026" }
  ];

  return <div className="space-y-4">
    <Tabs defaultValue="bonus"><div className="flex justify-between"><h1 className="text-xl font-semibold">Bonus & Deductions</h1><TabsList><TabsTrigger value="bonus">Bonuses</TabsTrigger><TabsTrigger value="deductions">Deductions</TabsTrigger></TabsList></div>
      <TabsContent value="bonus">
        <div className="flex justify-end mb-2"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>Add Bonus</Button></div>
        <Card>
          <div className="h-[400px]">
            <DataGrid rowData={bonuses} columnDefs={bonusColDefs} />
          </div>
        </Card>
      </TabsContent>
      <TabsContent value="deductions">
        <Card>
          <div className="h-[200px]">
            <DataGrid rowData={dummyDeductions} columnDefs={deductionsColDefs} />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
}
