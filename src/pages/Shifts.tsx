import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
const shifts=[
  {code:"SH-GEN",name:"General Shift",start:"09:30 AM",end:"06:30 PM",hours:8,grace:15,ot:true,status:"Active"},
  {code:"SH-MOR",name:"Morning Shift",start:"06:00 AM",end:"02:00 PM",hours:8,grace:10,ot:false,status:"Active"},
  {code:"SH-NGT",name:"Night Shift",start:"10:00 PM",end:"06:00 AM",hours:8,grace:15,ot:true,status:"Active"},
]
export default function Shifts(){
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Shift Management</h1><Button><Plus className="h-4 w-4 mr-2"/>Add Shift</Button></div>
    <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Hours</TableHead><TableHead>Grace</TableHead><TableHead>OT</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody>{shifts.map(s=><TableRow key={s.code}><TableCell className="font-mono text-xs">{s.code}</TableCell><TableCell>{s.name}</TableCell><TableCell>{s.start}</TableCell><TableCell>{s.end}</TableCell><TableCell>{s.hours}h</TableCell><TableCell>{s.grace}m</TableCell><TableCell><Badge variant={s.ot?"success":"secondary"}>{s.ot?"Yes":"No"}</Badge></TableCell><TableCell><Badge variant="success">{s.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
  </div>
}
