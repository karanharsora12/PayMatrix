import { attendance } from "@/mock/data"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

export default function Attendance(){
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Attendance</h1><Button>Mark Attendance</Button></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {[{l:"Present",v:1086,c:"bg-emerald-50 text-emerald-700"},{l:"Absent",v:64,c:"bg-red-50 text-red-700"},{l:"Late",v:56,c:"bg-amber-50 text-amber-700"},{l:"Half Day",v:42,c:"bg-blue-50 text-blue-700"},{l:"On Leave",v:42,c:"bg-violet-50 text-violet-700"}].map(x=><Card key={x.l}><CardContent className="p-4"><div className={`text-xs px-2 py-1 rounded-full inline-block ${x.c}`}>{x.l}</div><div className="text-xl font-bold mt-2">{x.v}</div></CardContent></Card>)}
    </div>
    <Tabs defaultValue="list"><TabsList><TabsTrigger value="list">List View</TabsTrigger><TabsTrigger value="calendar">Calendar View</TabsTrigger></TabsList>
      <TabsContent value="list">
        <Card><div className="p-3 flex gap-2"><Input placeholder="Search employee" className="max-w-sm"/><Input type="date" className="w-[160px]"/><Button variant="outline">Filter</Button></div>
        <Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Check In</TableHead><TableHead>Check Out</TableHead><TableHead>Hours</TableHead><TableHead>OT</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{attendance.map(a=><TableRow key={a.id}><TableCell><div className="font-medium text-sm">{a.employee}</div><div className="text-xs text-muted-foreground">{a.employeeId}</div></TableCell><TableCell>{a.date}</TableCell><TableCell>{a.checkIn}</TableCell><TableCell>{a.checkOut}</TableCell><TableCell>{a.hours}h</TableCell><TableCell>{a.overtime}h</TableCell><TableCell><Badge variant={a.status==="Present"?"success":a.status==="Late"?"warning":"secondary"}>{a.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>
      <TabsContent value="calendar"><Card><CardContent className="p-8 text-center text-muted-foreground">Calendar view — month grid with attendance dots. (UI placeholder - full calendar in next iteration)</CardContent></Card></TabsContent>
    </Tabs>
  </div>
}
