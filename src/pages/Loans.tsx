import { loans } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataGrid } from "@/components/common/DataGrid"
import type { ColDef } from "ag-grid-community"
import { useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { Plus } from "lucide-react"

export default function Loans(){
  const loansColDefs = useMemo<ColDef[]>(() => [
    { field: "id", headerName: "Loan ID", width: 120, cellClass: "font-mono text-xs" },
    { field: "employee", headerName: "Employee", flex: 1 },
    { field: "loanType", headerName: "Loan Type", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "emi", headerName: "EMI", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "outstanding", headerName: "Outstanding", flex: 1, cellClass: "font-medium", valueFormatter: p => formatCurrency(p.value) },
    { field: "status", headerName: "Status", width: 120, cellRenderer: (p: any) => <Badge variant="success">{p.value}</Badge> }
  ], []);

  const advancesColDefs = useMemo<ColDef[]>(() => [
    { field: "employee", headerName: "Employee", flex: 1 },
    { field: "amount", headerName: "Amount", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "date", headerName: "Date", flex: 1 },
    { field: "recoveryMonth", headerName: "Recovery Month", flex: 1 },
    { field: "status", headerName: "Status", width: 120, cellRenderer: (p: any) => <Badge variant="warning">{p.value}</Badge> }
  ], []);

  const dummyAdvances = [
    { employee: "Rahul Verma", amount: 30000, date: "2026-09-05", recoveryMonth: "Oct 2026", status: "Pending" }
  ];

  const typesColDefs = useMemo<ColDef[]>(() => [
    { field: "loanName", headerName: "Loan Name", flex: 1 },
    { field: "maxAmount", headerName: "Max Amount", flex: 1, valueFormatter: p => formatCurrency(p.value) },
    { field: "interest", headerName: "Interest", flex: 1 },
    { field: "tenure", headerName: "Tenure", flex: 1 },
    { field: "status", headerName: "Status", width: 120, cellRenderer: (p: any) => <Badge variant="success">{p.value}</Badge> }
  ], []);

  const dummyTypes = [
    { loanName: "Personal Loan", maxAmount: 500000, interest: "10%", tenure: "24 months", status: "Active" },
    { loanName: "Vehicle Loan", maxAmount: 1000000, interest: "9%", tenure: "60 months", status: "Active" }
  ];

  return <div className="space-y-4">
    <Tabs defaultValue="loans"><div className="flex justify-between"><h1 className="text-xl font-semibold">Loans & Advances</h1><TabsList><TabsTrigger value="loans">Loans</TabsTrigger><TabsTrigger value="advances">Advances</TabsTrigger><TabsTrigger value="types">Loan Types</TabsTrigger></TabsList></div>
      <TabsContent value="loans">
        <div className="flex justify-end mb-3"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>New Loan</Button></div>
        <Card>
          <div className="h-[400px]">
            <DataGrid rowData={loans} columnDefs={loansColDefs} />
          </div>
        </Card>
      </TabsContent>
      <TabsContent value="advances">
        <Card>
          <div className="h-[200px]">
            <DataGrid rowData={dummyAdvances} columnDefs={advancesColDefs} />
          </div>
        </Card>
      </TabsContent>
      <TabsContent value="types">
        <Card>
          <div className="h-[200px]">
            <DataGrid rowData={dummyTypes} columnDefs={typesColDefs} />
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
}
