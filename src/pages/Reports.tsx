import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download } from "lucide-react"

const categories=[
  {title:"Employee Reports",items:["Employee Master","Employee Directory","Joining Report"]},
  {title:"Attendance Reports",items:["Attendance Register","Late Report","Overtime Report","Absence Report"]},
  {title:"Payroll Reports",items:["Payroll Register","Salary Register","Payslip Report","Department Payroll","Bank Payment Report"]},
  {title:"Leave Reports",items:["Leave Register","Leave Balance","Leave Utilization"]},
  {title:"Compliance Reports",items:["PF Report","ESI Report","Tax Report","Professional Tax Report"]},
]

export default function Reports(){
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Reports</h1><Button variant="outline"><Download className="h-4 w-4 mr-2"/>Export</Button></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(c=><Card key={c.title}><CardHeader><CardTitle className="text-sm">{c.title}</CardTitle></CardHeader><CardContent className="space-y-2">
        {c.items.map(i=><div key={i} className="flex items-center justify-between border rounded-lg px-3 py-2 hover:bg-accent cursor-pointer"><span className="text-sm flex items-center gap-2"><FileText className="h-4 w-4"/>{i}</span><Button size="sm" variant="ghost">View</Button></div>)}
      </CardContent></Card>)}
    </div>
  </div>
}
