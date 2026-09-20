import { Card, CardContent, CardHeader,CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { employees } from "@/mock/data"

export default function PayrollDetails(){
  return <div className="space-y-4">
    <div className="flex justify-between items-start">
      <div><h1 className="text-xl font-semibold">September 2026 Payroll</h1><div className="flex gap-2 mt-1"><Badge variant="success">Approved</Badge><span className="text-sm text-muted-foreground">Employees: 1,248 • Gross: ₹9.25 Cr • Deductions: ₹1.24 Cr • Net: ₹8.01 Cr</span></div></div>
      <Button>Download Bank File</Button>
    </div>
    <Tabs defaultValue="summary"><TabsList><TabsTrigger value="summary">Summary</TabsTrigger><TabsTrigger value="employees">Employees</TabsTrigger><TabsTrigger value="earnings">Earnings</TabsTrigger><TabsTrigger value="deductions">Deductions</TabsTrigger><TabsTrigger value="audit">Audit Log</TabsTrigger></TabsList>
      <TabsContent value="summary">
        <div className="grid md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Gross Salary</div><div className="text-lg font-bold">{formatCurrency(9250000)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Deductions</div><div className="text-lg font-bold">{formatCurrency(1240000)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Net Payable</div><div className="text-lg font-bold">{formatCurrency(8010000)}</div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Employees</div><div className="text-lg font-bold">1,248</div></CardContent></Card>
        </div>
      </TabsContent>
      <TabsContent value="employees">
        <Card><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Gross</TableHead><TableHead>Deductions</TableHead><TableHead>Net</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{employees.slice(0,8).map(e=><TableRow key={e.id}><TableCell>{e.firstName} {e.lastName} — {e.employeeId}</TableCell><TableCell>{formatCurrency(75000)}</TableCell><TableCell>{formatCurrency(5000)}</TableCell><TableCell className="font-semibold">{formatCurrency(70000)}</TableCell><TableCell><Badge variant="success">Paid</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>
      <TabsContent value="earnings"><Card><CardContent className="p-8 text-center text-muted-foreground">Earnings breakdown by component</CardContent></Card></TabsContent>
      <TabsContent value="deductions"><Card><CardContent className="p-8 text-center text-muted-foreground">Deductions breakdown</CardContent></Card></TabsContent>
      <TabsContent value="audit"><Card><CardContent className="p-4 space-y-2 text-sm"><div>2026-09-18 10:32 — Created by Priya Sharma</div><div>2026-09-18 14:10 — Calculated — 1,248 employees</div><div>2026-09-19 09:00 — Approved by Admin</div></CardContent></Card></TabsContent>
    </Tabs>
  </div>
}
