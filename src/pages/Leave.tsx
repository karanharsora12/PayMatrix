import { leaveTypes, leaveRequests } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

export default function Leave(){
  return <div className="space-y-4">
    <Tabs defaultValue="requests">
      <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Leave Management</h1><TabsList><TabsTrigger value="types">Leave Types</TabsTrigger><TabsTrigger value="requests">Requests</TabsTrigger><TabsTrigger value="balances">Balances</TabsTrigger><TabsTrigger value="calendar">Calendar</TabsTrigger></TabsList></div>

      <TabsContent value="types">
        <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Paid</TableHead><TableHead>Allowance</TableHead><TableHead>Carry Forward</TableHead><TableHead>Max Days</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{leaveTypes.map(l=><TableRow key={l.code}><TableCell className="font-mono text-xs">{l.code}</TableCell><TableCell>{l.name}</TableCell><TableCell><Badge variant={l.paid?"success":"secondary"}>{l.paid?"Paid":"Unpaid"}</Badge></TableCell><TableCell>{l.allowance}</TableCell><TableCell>{l.carryForward?"Yes":"No"}</TableCell><TableCell>{l.maxConsecutive}</TableCell><TableCell><Badge variant="success">{l.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>

      <TabsContent value="requests">
        <Card><Table><TableHeader><TableRow><TableHead>Request ID</TableHead><TableHead>Employee</TableHead><TableHead>Leave Type</TableHead><TableHead>From</TableHead><TableHead>To</TableHead><TableHead>Days</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
        <TableBody>{leaveRequests.map(r=><TableRow key={r.id}><TableCell className="font-mono text-xs">{r.id}</TableCell><TableCell><div className="text-sm font-medium">{r.employee}</div><div className="text-xs text-muted-foreground">{r.employeeId}</div></TableCell><TableCell>{r.leaveType}</TableCell><TableCell>{r.from}</TableCell><TableCell>{r.to}</TableCell><TableCell>{r.days}</TableCell><TableCell><Badge variant={r.status==="Approved"?"success":r.status==="Pending"?"warning":"destructive"}>{r.status}</Badge></TableCell><TableCell><div className="flex gap-1">{r.status==="Pending"&&<><Button size="sm" variant="outline" onClick={()=>toast.success("Approved")}>Approve</Button><Button size="sm" variant="ghost" onClick={()=>toast.success("Rejected")}>Reject</Button></>}<Button size="sm" variant="ghost">View</Button></div></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>

      <TabsContent value="balances">
        <Card><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Casual</TableHead><TableHead>Sick</TableHead><TableHead>Privilege</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
        <TableBody>{Array.from({length:8}).map((_,i)=><TableRow key={i}><TableCell>Employee {i+1} • EMP-{10000+i}</TableCell><TableCell>8/12</TableCell><TableCell>5/8</TableCell><TableCell>10/15</TableCell><TableCell>23/35</TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>

      <TabsContent value="calendar"><Card><div className="p-8 text-center"><Calendar className="h-8 w-8 mx-auto text-muted-foreground"/><p className="text-sm text-muted-foreground mt-2">Leave Calendar — monthly view with leave overlays</p><div className="grid grid-cols-7 gap-2 mt-6 text-sm">{Array.from({length:30}).map((_,i)=><div key={i} className={`h-16 border rounded-lg p-1 ${i===10?"bg-amber-50 border-amber-200":""}`}>{i+1}{i===10&&<div className="text-xs bg-amber-500 text-white rounded px-1 mt-1">3 on leave</div>}</div>)}</div></div></Card></TabsContent>
    </Tabs>
  </div>
}
