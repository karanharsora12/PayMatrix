import { employees, salaryStructures } from "@/mock/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { NativeSelect } from "@/components/ui/select"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function EmployeeSalary(){
  const [emp,setEmp]=useState(employees[0].id)
  const [struct,setStruct]=useState(salaryStructures[0].id)
  const e=employees.find(x=>x.id===emp)!
  const ss=salaryStructures.find(s=>s.id===struct)!
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">Employee Salary</h1>
    <Card><CardContent className="p-4 flex flex-wrap gap-4">
      <NativeSelect value={emp} onChange={setEmp} className="w-[260px]">
        {employees.slice(0,20).map(em=><option key={em.id} value={em.id}>{em.firstName} {em.lastName} — {em.employeeId}</option>)}
      </NativeSelect>
      <NativeSelect value={struct} onChange={setStruct} className="w-[260px]">
        {salaryStructures.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
      </NativeSelect>
      <Button>Assign Structure</Button>
      <Button variant="outline">Override Component</Button>
    </CardContent></Card>

    <div className="grid lg:grid-cols-3 gap-4">
      <Card><CardHeader><CardTitle>Assignment</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{e.firstName} {e.lastName}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Structure</span><span>{ss.name}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Effective From</span><span>01 Sep 2026</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{e.department}</span></div>
      </CardContent></Card>
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Salary Breakdown</CardTitle></CardHeader><CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>{ss.earnings.map(x=><div key={x.code} className="flex justify-between py-1 text-sm border-b"><span>{x.name}</span><span>{formatCurrency(x.amount)}</span></div>)}<div className="flex justify-between font-semibold pt-2"><span>Gross</span><span>{formatCurrency(ss.gross)}</span></div></div>
          <div>{ss.deductions.map(x=><div key={x.code} className="flex justify-between py-1 text-sm border-b"><span>{x.name}</span><span>{formatCurrency(x.amount)}</span></div>)}<div className="flex justify-between font-semibold pt-2"><span>Deductions</span><span>{formatCurrency(ss.totalDeduction)}</span></div></div>
        </div>
        <div className="mt-4 rounded-lg bg-primary text-primary-foreground p-3 flex justify-between"><span>Net Payable</span><span className="font-bold">{formatCurrency(ss.net)}</span></div>
      </CardContent></Card>
    </div>

    <Card><CardHeader><CardTitle>Salary History</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Period</TableHead><TableHead>Structure</TableHead><TableHead>Gross</TableHead><TableHead>Net</TableHead><TableHead>Effective From</TableHead></TableRow></TableHeader>
      <TableBody><TableRow><TableCell>Sep 2026</TableCell><TableCell>{ss.name}</TableCell><TableCell>{formatCurrency(ss.gross)}</TableCell><TableCell>{formatCurrency(ss.net)}</TableCell><TableCell>01 Sep 2026</TableCell></TableRow><TableRow><TableCell>Aug 2026</TableCell><TableCell>{ss.name}</TableCell><TableCell>{formatCurrency(ss.gross)}</TableCell><TableCell>{formatCurrency(ss.net)}</TableCell><TableCell>01 Aug 2026</TableCell></TableRow></TableBody></Table></CardContent></Card>
  </div>
}
