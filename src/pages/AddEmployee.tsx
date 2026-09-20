import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/select"
import { toast } from "sonner"
import { useNavigate, Link } from "react-router-dom"
import { ArrowLeft, Check } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useCreateEmployee } from "@/hooks/useEmployees"
import { useQuery } from "@tanstack/react-query"
import { departmentApi } from "@/api/departments"
import { branchApi } from "@/api/branches"
import { designationApi } from "@/api/designations"

const schema = z.object({
  employeeCode: z.string().min(2, "Required"),
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  joiningDate: z.string().min(1, "Required"),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  panNumber: z.string().optional(),
  nationalIdNumber: z.string().optional(),
});

type FormValues = z.infer<typeof schema>
const steps=["Personal","Contact","Employment","Bank","Statutory","Documents"]

export default function AddEmployee(){
  const nav=useNavigate()
  const [step,setStep]=useState(0)
  const { register, handleSubmit, formState:{errors}, trigger, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeCode:"EMP-10051", firstName:"", lastName:"", email:"", joiningDate: new Date().toISOString().slice(0,10) }
  })
  const createMut = useCreateEmployee()
  const { data: depts } = useQuery({ queryKey:['departments','list'], queryFn:()=> departmentApi.list({page:1,pageSize:100}).catch(()=>({data:[]})) })
  const { data: branches } = useQuery({ queryKey:['branches','list'], queryFn:()=> branchApi.list({page:1,pageSize:100}).catch(()=>({data:[]})) })
  const { data: desigs } = useQuery({ queryKey:['designations','list'], queryFn:()=> designationApi.list({page:1,pageSize:100}).catch(()=>({data:[]})) })

  const onSubmit = async (values: FormValues) => {
    try {
      await createMut.mutateAsync({
        employeeCode: values.employeeCode,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email || undefined,
        phone: values.phone,
        joiningDate: values.joiningDate,
        branchId: values.branchId || undefined,
        departmentId: values.departmentId || undefined,
        designationId: values.designationId || undefined,
        gender: values.gender || undefined,
        panNumber: values.panNumber || undefined,
        nationalIdNumber: values.nationalIdNumber || undefined,
      })
      toast.success("Employee created")
      nav("/employees")
    } catch (e:any) {
      const msg = e?.normalizedError?.message ?? e?.response?.data?.error?.message ?? e.message ?? "Failed to create"
      toast.error(msg)
    }
  }

  const next = async () => {
    const fieldsByStep: Record<number, (keyof FormValues)[]> = {
      0: ["employeeCode","firstName","lastName"],
      1: ["email","phone"],
      2: ["joiningDate","branchId","departmentId","designationId"],
      3: [],
      4: ["panNumber","nationalIdNumber"],
      5: [],
    }
    const ok = await trigger(fieldsByStep[step] ?? [])
    if (ok) setStep(s=>s+1)
  }

  return <div className="max-w-4xl mx-auto space-y-4">
    <Link to="/employees" className="inline-flex items-center text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-1"/> Back</Link>
    <div><h1 className="text-xl font-semibold">Add Employee</h1><p className="text-sm text-muted-foreground">Create a new employee record • Step {step+1} of {steps.length}</p></div>
    <div className="flex gap-2 overflow-auto">
      {steps.map((s,i)=><div key={s} className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap ${i===step?"bg-primary text-primary-foreground":i<step?"bg-emerald-100 text-emerald-700":"bg-muted"}`}>{i<step?<Check className="h-3 w-3"/>:i+1} {s}</div>)}
    </div>
    <Card>
      <CardHeader><CardTitle>{steps[step]} Information</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)}>
        {step===0 && <div className="grid md:grid-cols-2 gap-4">
          <div><Input placeholder="Employee Code *" {...register("employeeCode")}/>{errors.employeeCode && <p className="text-xs text-red-500 mt-1">{errors.employeeCode.message}</p>}</div>
          <div><Input placeholder="Joining Date *" type="date" {...register("joiningDate")}/>{errors.joiningDate && <p className="text-xs text-red-500">{errors.joiningDate.message}</p>}</div>
          <div><Input placeholder="First Name *" {...register("firstName")}/>{errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}</div>
          <div><Input placeholder="Last Name *" {...register("lastName")}/>{errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}</div>
          <NativeSelect {...register("gender")}><option value="">Gender</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></NativeSelect>
          <Input placeholder="Blood Group" {...register("bloodGroup")}/>
        </div>}
        {step===1 && <div className="grid md:grid-cols-2 gap-4">
          <div><Input placeholder="Email" {...register("email")}/>{errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}</div>
          <Input placeholder="Mobile" {...register("phone")}/>
          <Input placeholder="Address" className="md:col-span-2"/>
        </div>}
        {step===2 && <div className="grid md:grid-cols-2 gap-4">
          <select {...register("departmentId")} className="h-9 rounded-md border px-3 text-sm"><option value="">Department</option>{(depts as any)?.data?.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select {...register("designationId")} className="h-9 rounded-md border px-3 text-sm"><option value="">Designation</option>{(desigs as any)?.data?.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select {...register("branchId")} className="h-9 rounded-md border px-3 text-sm"><option value="">Branch</option>{(branches as any)?.data?.map((b:any)=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
        </div>}
        {step===3 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="Bank Name"/><Input placeholder="Account Number"/><Input placeholder="IFSC"/><Input placeholder="Account Holder"/>
        </div>}
        {step===4 && <div className="grid md:grid-cols-2 gap-4">
          <Input placeholder="PAN" {...register("panNumber")}/><Input placeholder="Aadhaar / National ID" {...register("nationalIdNumber")}/>
        </div>}
        {step===5 && <div className="space-y-3">
          {["ID Proof","Address Proof","Offer Letter"].map(d=><div key={d} className="border-2 border-dashed rounded-lg p-6 flex justify-between items-center"><span className="text-sm">{d}</span><Button type="button" variant="outline" size="sm">Upload</Button></div>)}
        </div>}

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" disabled={step===0} onClick={()=>setStep(s=>s-1)}>Previous</Button>
          <div className="flex gap-2">
            {step<steps.length-1? <Button type="button" onClick={next}>Next</Button> : <Button type="submit" disabled={createMut.isPending}>{createMut.isPending ? "Saving..." : "Create Employee"}</Button>}
          </div>
        </div>
        </form>
      </CardContent>
    </Card>
  </div>
}
