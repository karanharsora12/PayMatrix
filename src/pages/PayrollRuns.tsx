import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { usePayrollRuns } from "@/hooks/usePayroll"
import { payrollRuns as mockRuns } from "@/mock/data"

export default function PayrollRuns(){
  const nav=useNavigate()
  const { data, isLoading, isError } = usePayrollRuns({ page:1, pageSize:20 })
  const runs = isError || !data?.data?.length ? mockRuns : data.data
  const isMock = isError

  return <div className="space-y-4">
    <div className="flex justify-between"><div><h1 className="text-xl font-semibold">Payroll Runs</h1><p className="text-sm text-muted-foreground">{isMock ? "(mock — API unavailable)" : `${data?.meta?.total ?? runs.length} runs`}</p></div><Button onClick={()=>nav("/payroll/new")}><Plus className="h-4 w-4 mr-2"/>New Payroll Run</Button></div>
    <Card>
      {isLoading ? <div className="p-8 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-12 bg-muted animate-pulse rounded"/>)}</div> : (
      <Table><TableHeader><TableRow><TableHead>Payroll ID</TableHead><TableHead>Period</TableHead><TableHead>Employees</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{runs.map((p:any)=><TableRow key={p.id}>
        <TableCell className="font-mono text-xs">{p.payrollCode ?? p.id}</TableCell>
        <TableCell>{p.period ?? `${p.periodStart} → ${p.periodEnd}`}</TableCell>
        <TableCell>{p.employeeCount ?? p.employees}</TableCell>
        <TableCell>{formatCurrency(Number(p.grossAmount ?? p.gross ?? 0))}</TableCell>
        <TableCell>{formatCurrency(Number(p.totalDeductions ?? p.deductions ?? 0))}</TableCell>
        <TableCell className="font-semibold">{formatCurrency(Number(p.netAmount ?? p.net ?? 0))}</TableCell>
        <TableCell><Badge variant={p.status==="PAID"||p.status==="Paid"?"success":p.status==="APPROVED"||p.status==="Approved"?"info":p.status==="DRAFT"||p.status==="Draft"?"secondary":"warning"}>{p.status}</Badge></TableCell>
        <TableCell><Button variant="ghost" size="sm" onClick={()=>nav(`/payroll/${p.id}`)}><Eye className="h-3 w-3 mr-1"/>View</Button></TableCell></TableRow>)}</TableBody></Table>
      )}
    </Card>
  </div>
}
