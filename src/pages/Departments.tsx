import { departments } from "@/mock/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function Departments(){
  const [open,setOpen]=useState(false)
  return <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Departments</div><div className="text-2xl font-bold">8</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Active</div><div className="text-2xl font-bold">8</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">Total Employees</div><div className="text-2xl font-bold">1,248</div></CardContent></Card>
    </div>
    <div className="flex justify-between items-center"><h1 className="text-xl font-semibold">Departments</h1><Button onClick={()=>setOpen(true)}><Plus className="h-4 w-4 mr-2"/>Add Department</Button></div>
    <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Manager</TableHead><TableHead>Employees</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
      <TableBody>{departments.map(d=><TableRow key={d.code}><TableCell className="font-mono text-xs">{d.code}</TableCell><TableCell className="font-medium">{d.name}</TableCell><TableCell>{d.manager}</TableCell><TableCell>{d.employees}</TableCell><TableCell><Badge variant="success">{d.status}</Badge></TableCell><TableCell className="text-sm">{d.createdAt}</TableCell><TableCell><div className="flex gap-1"><Button variant="ghost" size="icon"><Pencil className="h-4 w-4"/></Button><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4"/></Button></div></TableCell></TableRow>)}</TableBody></Table></Card>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onClose={()=>setOpen(false)}><DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
      <div className="space-y-3"><Input placeholder="Department Code"/><Input placeholder="Department Name"/><Input placeholder="Manager"/><Button className="w-full" onClick={()=>{toast.success("Department created");setOpen(false)}}>Save</Button></div>
    </DialogContent></Dialog>
  </div>
}
