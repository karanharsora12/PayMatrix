import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const cards=[
  {title:"PF — Provident Fund",count:1248,employer:"₹11,20,000",employee:"₹11,20,000",due:"15 Oct 2026",status:"Pending"},
  {title:"ESI",count:340,employer:"₹1,02,000",employee:"₹24,000",due:"15 Oct 2026",status:"Pending"},
  {title:"Professional Tax",count:1248,employer:"—",employee:"₹2,49,600",due:"30 Oct 2026",status:"Paid"},
  {title:"Income Tax (TDS)",count:892,employer:"—",employee:"₹18,40,000",due:"07 Oct 2026",status:"Pending"},
]

export default function Compliance(){
  return <div className="space-y-4">
    <h1 className="text-xl font-semibold">Compliance Dashboard</h1>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c=><Card key={c.title}><CardHeader><CardTitle className="text-sm">{c.title}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Employees</span><span>{c.count}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Employer</span><span>{c.employer}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span>{c.employee}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Due</span><span>{c.due}</span></div>
        <Badge variant={c.status==="Paid"?"success":"warning"}>{c.status}</Badge>
        <Button size="sm" variant="outline" className="w-full mt-2">View Report</Button>
      </CardContent></Card>)}
    </div>
  </div>
}
