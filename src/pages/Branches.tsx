import { branches } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Building2, MapPin } from "lucide-react"
export default function Branches(){
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Branches</h1><Button><Plus className="h-4 w-4 mr-2"/>Add Branch</Button></div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {branches.map(b=><Card key={b.code} className="p-4"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary"/><span className="font-medium text-sm">{b.name}</span></div><div className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="h-3 w-3"/>{b.city}, {b.state}</div><div className="text-xs mt-2">{b.employees} employees</div></Card>)}
    </div>
    <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>City</TableHead><TableHead>Manager</TableHead><TableHead>Employees</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody>{branches.map(b=><TableRow key={b.code}><TableCell className="font-mono text-xs">{b.code}</TableCell><TableCell>{b.name}</TableCell><TableCell>{b.city}</TableCell><TableCell>{b.manager}</TableCell><TableCell>{b.employees}</TableCell><TableCell><Badge variant="success">{b.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
  </div>
}
