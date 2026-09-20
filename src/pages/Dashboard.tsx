import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { payrollChart } from "@/mock/data"
import { formatCurrency } from "@/lib/utils"
import { Users, UserCheck, Palmtree, Wallet, Clock, AlertCircle, ArrowUpRight, Gift, Cake, Calendar } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts"

const kpis=[
  {label:"Total Employees", value:"1,248", change:"+4.8% vs last month", icon:Users, color:"text-blue-600 bg-blue-50"},
  {label:"Present Today", value:"1,086", change:"87% attendance", icon:UserCheck, color:"text-emerald-600 bg-emerald-50"},
  {label:"On Leave", value:"42", change:"3.4% of workforce", icon:Palmtree, color:"text-amber-600 bg-amber-50"},
  {label:"Payroll This Month", value:"₹80.1L", change:"Net payable", icon:Wallet, color:"text-violet-600 bg-violet-50"},
  {label:"Pending Payroll", value:"128", change:"Awaiting process", icon:Clock, color:"text-orange-600 bg-orange-50"},
  {label:"Net Salary Avg", value:"₹64,200", change:"+2.1% vs last", icon:ArrowUpRight, color:"text-zinc-600 bg-zinc-100"},
]
const donut=[{name:"Active",value:1120,color:"#2563eb"},{name:"On Leave",value:42,color:"#f59e0b"},{name:"Inactive",value:86,color:"#e5e7eb"}]
const attendanceData=[{name:"Present",value:1086},{name:"Absent",value:64},{name:"Late",value:56},{name:"Half Day",value:42}]
const deptData=[{dept:"Engineering",count:342},{dept:"Sales",count:210},{dept:"Marketing",count:124},{dept:"Support",count:98},{dept:"Finance",count:86},{dept:"Design",count:64}]

export default function Dashboard(){
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">Good Morning, Admin</h1><p className="text-sm text-muted-foreground">Here's what's happening with your workforce today.</p></div>
      <Button>Process Payroll</Button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map(k=><Card key={k.label} className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.color}`}><k.icon className="h-4 w-4"/></div>
            <span className="text-xs text-emerald-600 font-medium">{k.change}</span>
          </div>
          <div className="mt-3 text-2xl font-bold">{k.value}</div>
          <div className="text-xs text-muted-foreground">{k.label}</div>
        </CardContent>
      </Card>)}
    </div>

    <div className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 lg:col-span-8">
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Payroll Overview</CardTitle><Badge variant="outline">Last 6 months</Badge></CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={payrollChart}>
              <XAxis dataKey="month" fontSize={12}/>
              <YAxis fontSize={12}/>
              <Tooltip/>
              <Line type="monotone" dataKey="gross" stroke="#2563eb" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="deductions" stroke="#f59e0b" strokeWidth={2} dot={false}/>
              <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center text-xs mt-2"><span className="flex items-center gap-1"><span className="h-2 w-2 bg-blue-600 rounded-full"/>Gross</span><span className="flex items-center gap-1"><span className="h-2 w-2 bg-amber-500 rounded-full"/>Deductions</span><span className="flex items-center gap-1"><span className="h-2 w-2 bg-emerald-500 rounded-full"/>Net</span></div>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-4">
        <CardHeader><CardTitle>Employee Overview</CardTitle></CardHeader>
        <CardContent className="h-[300px] flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={donut} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={3}>{donut.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 w-full text-center text-sm">
            {donut.map(d=><div key={d.name}><div className="font-semibold">{d.value}</div><div className="text-xs text-muted-foreground">{d.name}</div></div>)}
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <CardHeader><CardTitle>Attendance Overview</CardTitle></CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceData}><XAxis dataKey="name" fontSize={12}/><YAxis fontSize={12}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[6,6,0,0]}/></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-6">
        <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
        <CardContent className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="dept" type="category" width={100} fontSize={12}/><Tooltip/><Bar dataKey="count" fill="#6366f1" radius={[0,6,6,0]}/></BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-4">
        <CardHeader><CardTitle>Payroll Status</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border p-4 bg-card">
            <div className="text-xs text-muted-foreground">Payroll Period</div><div className="font-semibold">September 2026</div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><div className="text-muted-foreground text-xs">Status</div><Badge variant="warning">Processing</Badge></div>
              <div><div className="text-muted-foreground text-xs">Employees</div><div className="font-medium">1,248</div></div>
              <div><div className="text-muted-foreground text-xs">Processed</div><div className="font-medium text-emerald-600">1,120</div></div>
              <div><div className="text-muted-foreground text-xs">Pending</div><div className="font-medium text-amber-600">128</div></div>
            </div>
            <div className="mt-3 w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{width:"89%"}}/></div>
            <Button className="w-full mt-4">Process Remaining</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="col-span-12 lg:col-span-8">
        <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 flex gap-3"><div className="h-9 w-9 rounded-full bg-pink-100 flex items-center justify-center"><Cake className="h-4 w-4 text-pink-600"/></div><div><div className="text-sm font-medium">Birthdays This Week</div><div className="text-xs text-muted-foreground">5 employees • Tomorrow: Priya Sharma</div></div></div>
          <div className="rounded-lg border p-3 flex gap-3"><div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center"><Gift className="h-4 w-4 text-blue-600"/></div><div><div className="text-sm font-medium">Work Anniversaries</div><div className="text-xs text-muted-foreground">3 employees • Aarav - 3 years</div></div></div>
          <div className="rounded-lg border p-3 flex gap-3"><div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center"><Calendar className="h-4 w-4 text-amber-600"/></div><div><div className="text-sm font-medium">Upcoming Holidays</div><div className="text-xs text-muted-foreground">Gandhi Jayanti • Oct 2</div></div></div>
          <div className="rounded-lg border p-3 flex gap-3"><div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center"><AlertCircle className="h-4 w-4 text-violet-600"/></div><div><div className="text-sm font-medium">Pending Leave Requests</div><div className="text-xs text-muted-foreground">7 requests awaiting approval</div></div></div>
        </CardContent>
      </Card>
    </div>
  </div>
}
