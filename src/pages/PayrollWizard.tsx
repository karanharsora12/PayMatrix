import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { employees } from "@/mock/data"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import { Check } from "lucide-react"

const steps=["Period","Employees","Attendance","Calculation","Review","Approval","Finalize"]

export default function PayrollWizard(){
  const [step,setStep]=useState(0)
  const nav=useNavigate()
  const [selected,setSelected]=useState<string[]>(employees.slice(0,5).map(e=>e.id))
  return <div className="max-w-5xl mx-auto space-y-4">
    <h1 className="text-xl font-semibold">Payroll Processing Wizard</h1>
    <div className="flex gap-1 overflow-auto">
      {steps.map((s,i)=><div key={s} className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1 ${i===step?"bg-primary text-primary-foreground":i<step?"bg-emerald-500 text-white":"bg-muted"}`}>{i<step&&<Check className="h-3 w-3"/>}{i+1}. {s}</div>)}
    </div>
    <Card>
      <CardHeader><CardTitle>Step {step+1}: {steps[step]}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {step===0 && <div className="grid md:grid-cols-3 gap-4"><Input defaultValue="September 2026"/><Input type="date" defaultValue="2026-09-01"/><Input type="date" defaultValue="2026-09-30"/></div>}
        {step===1 && <div className="space-y-2 max-h-[300px] overflow-auto border rounded-lg">
          {employees.slice(0,12).map(e=><label key={e.id} className="flex items-center gap-3 p-2 border-b hover:bg-accent"><input type="checkbox" checked={selected.includes(e.id)} onChange={x=> setSelected(s=> x.target.checked ? [...s,e.id]: s.filter(id=>id!==e.id))}/><img src={e.avatar} className="h-7 w-7 rounded-full"/><span className="text-sm flex-1">{e.firstName} {e.lastName} — {e.employeeId}</span><span className="text-xs text-muted-foreground">{e.department}</span></label>)}
          <div className="p-2 text-sm text-muted-foreground">{selected.length} employees selected</div>
        </div>}
        {step===2 && <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            {l:"Working Days",v:22},{l:"Present Days",v:20},{l:"Leave Days",v:2},{l:"Unpaid Leave",v:0},{l:"Overtime (hrs)",v:12},
          ].map(x=><div key={x.l} className="border rounded-lg p-3"><div className="text-muted-foreground text-xs">{x.l}</div><div className="font-bold text-lg">{x.v}</div></div>)}
        </div>}
        {step===3 && <div className="grid md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 text-center"><div className="text-sm text-muted-foreground">Gross Earnings</div><div className="text-xl font-bold">{formatCurrency(9250000)}</div></div>
          <div className="border rounded-xl p-4 text-center"><div className="text-sm text-muted-foreground">Total Deductions</div><div className="text-xl font-bold">{formatCurrency(1240000)}</div></div>
          <div className="border rounded-xl p-4 text-center bg-primary text-primary-foreground"><div className="text-sm opacity-80">Net Payroll</div><div className="text-xl font-bold">{formatCurrency(8010000)}</div></div>
        </div>}
        {step===4 && <div className="border rounded-lg overflow-auto"><table className="w-full text-sm"><thead className="bg-muted"><tr><th className="p-2 text-left">Employee</th><th className="p-2 text-right">Gross</th><th className="p-2 text-right">Deductions</th><th className="p-2 text-right">Net</th></tr></thead><tbody>{employees.slice(0,5).map(e=><tr key={e.id} className="border-t"><td className="p-2">{e.firstName} {e.lastName}</td><td className="p-2 text-right">{formatCurrency(75000)}</td><td className="p-2 text-right">{formatCurrency(5000)}</td><td className="p-2 text-right font-semibold">{formatCurrency(70000)}</td></tr>)}</tbody></table></div>}
        {step===5 && <div className="space-y-3 text-sm"><div className="flex justify-between border rounded-lg p-3"><span>Prepared By</span><span>HR Manager — Priya Sharma</span></div><div className="flex justify-between border rounded-lg p-3"><span>Reviewed By</span><span>Finance — Rahul Verma</span></div><div className="flex justify-between border rounded-lg p-3"><span>Approved By</span><span>Admin — Pending</span></div></div>}
        {step===6 && <div className="text-center py-8"><div className="text-lg font-semibold">Ready to finalize September 2026 payroll?</div><p className="text-sm text-muted-foreground">8010000 will be disbursed to 1248 employees.</p></div>}

        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>toast.success("Draft saved")}>Save Draft</Button>
            {step<steps.length-1 ? <Button onClick={()=>setStep(s=>s+1)}>{step===3?"Calculate Payroll": step===5?"Approve Payroll":"Next"}</Button> : <Button onClick={()=>{toast.success("Payroll finalized"); nav("/payroll")}}>Finalize Payroll</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
}
