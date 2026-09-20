import { designations } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
export default function Designations(){
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Designations</h1><Button><Plus className="h-4 w-4 mr-2"/>Add Designation</Button></div>
    <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Department</TableHead><TableHead>Grade</TableHead><TableHead>Min</TableHead><TableHead>Max</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
    <TableBody>{designations.map(d=><TableRow key={d.code}><TableCell className="font-mono text-xs">{d.code}</TableCell><TableCell>{d.name}</TableCell><TableCell>{d.department}</TableCell><TableCell><Badge variant="outline">{d.grade}</Badge></TableCell><TableCell>{formatCurrency(d.minSalary)}</TableCell><TableCell>{formatCurrency(d.maxSalary)}</TableCell><TableCell><Badge variant="success">{d.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
  </div>
}
