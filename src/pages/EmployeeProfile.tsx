import { useParams, Link } from "react-router-dom"
import { employees, salaryStructures } from "@/mock/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, CreditCard } from "lucide-react"

export default function EmployeeProfile(){
  const {id}=useParams()
  const e=employees.find(x=>x.id===id) || employees[0]
  const ss=salaryStructures[0]
  return <div className="space-y-4">
    <Link to="/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4 mr-1"/> Back to Employees</Link>
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-wrap gap-6">
          <img src={e.avatar} className="h-20 w-20 rounded-2xl object-cover"/>
          <div className="flex-1 min-w-[240px]">
            <div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold">{e.firstName} {e.lastName}</h1><Badge variant="success">{e.status}</Badge><span className="text-sm text-muted-foreground">{e.employeeId}</span></div>
            <div className="text-sm text-muted-foreground">{e.designation} • {e.department}</div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5"/>{e.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5"/>{e.phone}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{e.branch}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>Joined {formatDate(e.joiningDate)}</span>
            </div>
          </div>
          <div className="flex gap-2 self-start"><Button variant="outline">Edit</Button><Button>Salary</Button></div>
        </div>
      </CardContent>
    </Card>

    <Tabs defaultValue="overview">
      <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="personal">Personal</TabsTrigger><TabsTrigger value="employment">Employment</TabsTrigger><TabsTrigger value="salary">Salary</TabsTrigger><TabsTrigger value="attendance">Attendance</TabsTrigger><TabsTrigger value="leave">Leave</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger></TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-12 gap-4">
          <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Personal Details</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{e.gender}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{formatDate(e.dob)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{e.phone}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{e.email}</span></div>
          </CardContent></Card>
          <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Employment</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{e.department}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span>{e.designation}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{e.branch}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline">{e.employmentType}</Badge></div>
          </CardContent></Card>
          <Card className="col-span-12 lg:col-span-4"><CardHeader><CardTitle>Current Salary</CardTitle></CardHeader><CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ss.net)}</div><div className="text-xs text-muted-foreground">Net Salary • {ss.name}</div>
            <div className="mt-3 space-y-1 text-sm">
              {ss.earnings.map(x=><div key={x.code} className="flex justify-between"><span>{x.name}</span><span>{formatCurrency(x.amount)}</span></div>)}
              <div className="border-t pt-1 font-medium flex justify-between"><span>Gross</span><span>{formatCurrency(ss.gross)}</span></div>
            </div>
          </CardContent></Card>

          <Card className="col-span-12 lg:col-span-6"><CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader><CardContent className="grid grid-cols-3 gap-3 text-center">
            {[{l:"Casual",b:8,t:12},{l:"Sick",b:5,t:8},{l:"Privilege",b:10,t:15}].map(x=><div key={x.l} className="rounded-lg border p-3"><div className="text-lg font-bold">{x.b}/{x.t}</div><div className="text-xs text-muted-foreground">{x.l}</div><div className="h-1.5 bg-muted rounded-full mt-2"><div className="h-full bg-primary rounded-full" style={{width:`${x.b/x.t*100}%`}}/></div></div>)}
          </CardContent></Card>
          <Card className="col-span-12 lg:col-span-6"><CardHeader><CardTitle>Recent Payslips</CardTitle></CardHeader><CardContent className="space-y-2">
            {["Sep 2026","Aug 2026","Jul 2026"].map(p=><div key={p} className="flex items-center justify-between border rounded-lg px-3 py-2"><div className="text-sm font-medium">{p}</div><div className="text-sm">{formatCurrency(70000)}</div><Button size="sm" variant="outline">View</Button></div>)}
          </CardContent></Card>
        </div>
      </TabsContent>
      <TabsContent value="salary">
        <Card><CardHeader><CardTitle>Salary Breakdown — {ss.name}</CardTitle></CardHeader><CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div><div className="font-medium mb-2">Earnings</div>{ss.earnings.map(e=><div key={e.code} className="flex justify-between py-1 text-sm border-b"><span>{e.name}</span><span>{formatCurrency(e.amount)}</span></div>)}<div className="flex justify-between font-semibold pt-2"><span>Gross</span><span>{formatCurrency(ss.gross)}</span></div></div>
            <div><div className="font-medium mb-2">Deductions</div>{ss.deductions.map(d=><div key={d.code} className="flex justify-between py-1 text-sm border-b"><span>{d.name}</span><span>{formatCurrency(d.amount)}</span></div>)}<div className="flex justify-between font-semibold pt-2"><span>Total Deduction</span><span>{formatCurrency(ss.totalDeduction)}</span></div></div>
          </div>
          <div className="mt-6 rounded-lg bg-primary text-primary-foreground p-4 flex justify-between items-center"><span className="font-medium">Net Salary</span><span className="text-xl font-bold">{formatCurrency(ss.net)}</span></div>
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="personal"><Card><CardContent className="p-8 text-center text-muted-foreground">Personal info, bank, documents tabs — same fields as Add Employee form.</CardContent></Card></TabsContent>
      <TabsContent value="employment"><Card><CardContent className="p-8 text-center text-muted-foreground">Employment history & reporting structure.</CardContent></Card></TabsContent>
      <TabsContent value="attendance"><Card><CardContent className="p-8 text-center text-muted-foreground">Attendance summary chart & monthly table.</CardContent></Card></TabsContent>
      <TabsContent value="leave"><Card><CardContent className="p-8 text-center text-muted-foreground">Leave requests & calendar.</CardContent></Card></TabsContent>
      <TabsContent value="documents"><Card><CardContent className="p-8 text-center text-muted-foreground">Documents: ID proof, offer letter, etc.</CardContent></Card></TabsContent>
    </Tabs>
  </div>
}
