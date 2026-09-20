import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/select"
import { toast } from "sonner"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"

const steps=["Personal","Contact","Employment","Bank","Statutory","Documents"]

export default function AddEmployee(){
  const nav=useNavigate()
  const [step,setStep]=useState(0)
  const [form,setForm]=useState({firstName:"",lastName:"",email:"",department:"Engineering",designation:"Software Engineer"})
  return <div className="max-w-4xl mx-auto space-y-4">
    <Link to="/employees" className="inline-flex items-center text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-1"/> Back</Link>
    <div><h1 className="text-xl font-semibold">Add Employee</h1><p className="text-sm text-muted-foreground">Create a new employee record • Step {step+1} of {steps.length}</p></div>
    <div className="flex gap-2 overflow-auto">
      {steps.map((s,i)=><div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap ${i===step?"bg-primary text-primary-foreground":i<step?"bg-emerald-100 text-emerald-700":"bg-muted"}`}>{i<step?<Check className="h-3 w-3"/>:i+1} {s}</div>)}
    </div>
    <Card>
      <CardHeader><CardTitle>{steps[step]} Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {step===0 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Employee ID" defaultValue="EMP-10051"/>
          <NativeSelect value={form.department} onChange={v=>setForm({...form,department:v})} className="h-9">
            <option>Engineering</option><option>Finance</option><option>Marketing</option>
          </NativeSelect>
          <Input placeholder="First Name" value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})}/>
          <Input placeholder="Last Name" value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})}/>
          <NativeSelect placeholder="Gender"><option>Male</option><option>Female</option></NativeSelect>
          <Input type="date"/>
          <NativeSelect><option>Single</option><option>Married</option></NativeSelect>
          <Input placeholder="Blood Group"/>
        </div>}
        {step===1 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
          <Input placeholder="Mobile"/>
          <Input placeholder="Alternate Mobile"/>
          <Input placeholder="Address" className="md:col-span-2"/>
          <Input placeholder="City"/><Input placeholder="State"/><Input placeholder="Country"/><Input placeholder="Postal Code"/>
        </div>}
        {step===2 && <div className="grid md:grid-cols-2 gap-4">
          <Input type="date" placeholder="Joining Date"/><NativeSelect><option>Engineering</option><option>Finance</option></NativeSelect>
          <NativeSelect><option>Software Engineer</option><option>Senior Engineer</option></NativeSelect><NativeSelect><option>Mumbai</option><option>Bengaluru</option></NativeSelect>
          <NativeSelect><option>Full-time</option><option>Contract</option></NativeSelect><Input placeholder="Reporting Manager"/>
        </div>}
        {step===3 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Bank Name"/><Input placeholder="Account Number"/><Input placeholder="IFSC"/><Input placeholder="Account Holder Name"/>
          <NativeSelect><option>Savings</option><option>Current</option></NativeSelect>
        </div>}
        {step===4 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="PAN"/><Input placeholder="Aadhaar / National ID"/><Input placeholder="PF Number"/><Input placeholder="ESI Number"/>
        </div>}
        {step===5 && <div className="space-y-3">
          {["ID Proof","Address Proof","Offer Letter","Joining Documents"].map(d=><div key={d} className="border-2 border-dashed rounded-lg p-6 flex justify-between items-center"><span className="text-sm">{d}</span><Button variant="outline" size="sm">Upload</Button></div>)}
        </div>}

        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>toast.success("Draft saved")}>Save Draft</Button>
            {step<steps.length-1? <Button onClick={()=>setStep(s=>s+1)}>Next</Button> : <Button onClick={()=>{toast.success("Employee created"); nav("/employees")}}>Create Employee</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
}
