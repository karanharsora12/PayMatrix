import { payrollRuns } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Eye } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useNavigate } from "react-router-dom"

export default function PayrollRuns(){
  const nav=useNavigate()
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Payroll Runs</h1><Button onClick={()=>nav("/payroll/new")}><Plus className="h-4 w-4 mr-2"/>New Payroll Run</Button></div>
    <Card><Table><TableHeader><TableRow><TableHead>Payroll ID</TableHead><TableHead>Period</TableHead><TableHead>Employees</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
    <TableBody>{payrollRuns.map(p=><TableRow key={p.id}><TableCell className="font-mono text-xs">{p.id}</TableCell><TableCell>{p.period}</TableCell><TableCell>{p.employees}</TableCell><TableCell>{formatCurrency(p.gross)}</TableCell><TableCell>{formatCurrency(p.deductions)}</TableCell><TableCell className="font-semibold">{formatCurrency(p.net)}</TableCell><TableCell><Badge variant={p.status==="Paid"?"success":p.status==="Approved"?"info":p.status==="Draft"?"secondary":"warning"}>{p.status}</Badge></TableCell><TableCell><Button variant="ghost" size="sm" onClick={()=>nav(`/payroll/${p.id}`)}><Eye className="h-3 w-3 mr-1"/>View</Button></TableCell></TableRow>)}</TableBody></Table></Card>
  </div>
}
