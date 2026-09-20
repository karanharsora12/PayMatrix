import { salaryStructures } from "@/mock/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, GripVertical, Trash2 } from "lucide-react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function SalaryStructures(){
  const [selected,setSelected]=useState(salaryStructures[0])
  const [open,setOpen]=useState(false)
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Salary Structures</h1><Button onClick={()=>setOpen(true)}><Plus className="h-4 w-4 mr-2"/>Create Structure</Button></div>
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="space-y-3">
        {salaryStructures.map(s=><Card key={s.id} onClick={()=>setSelected(s)} className={`cursor-pointer ${selected.id===s.id?"ring-2 ring-primary":""}`}><CardContent className="p-4"><div className="font-medium text-sm">{s.name}</div><div className="text-xs text-muted-foreground">Grade {s.grade} • {formatCurrency(s.net)} net</div><div className="flex gap-2 mt-2"><Badge variant="outline">Gross {formatCurrency(s.gross)}</Badge><Badge variant="secondary">Ded {formatCurrency(s.totalDeduction)}</Badge></div></CardContent></Card>)}
      </div>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>{selected.name} — Live Preview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="font-medium text-sm mb-2 flex justify-between">Earnings <Button size="sm" variant="outline" onClick={()=>toast.success("Component added")}><Plus className="h-3 w-3 mr-1"/>Add</Button></div>
            {selected.earnings.map(e=><div key={e.code} className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-2"><GripVertical className="h-4 w-4 text-muted-foreground"/><span className="flex-1 text-sm">{e.name}</span><span className="text-sm font-medium">{formatCurrency(e.amount)}</span><Button variant="ghost" size="icon"><Trash2 className="h-3 w-3"/></Button></div>)}
            <div className="flex justify-between font-semibold border-t pt-2"><span>Gross Salary</span><span>{formatCurrency(selected.gross)}</span></div>
          </div>
          <div>
            <div className="font-medium text-sm mb-2">Deductions</div>
            {selected.deductions.map(d=><div key={d.code} className="flex items-center gap-2 border rounded-lg px-3 py-2 mb-2"><GripVertical className="h-4 w-4 text-muted-foreground"/><span className="flex-1 text-sm">{d.name}</span><span className="text-sm font-medium">{formatCurrency(d.amount)}</span><Button variant="ghost" size="icon"><Trash2 className="h-3 w-3"/></Button></div>)}
            <div className="flex justify-between font-semibold border-t pt-2"><span>Total Deduction</span><span>{formatCurrency(selected.totalDeduction)}</span></div>
          </div>
          <div className="rounded-xl bg-primary text-primary-foreground p-4 flex justify-between items-center"><span>Net Salary</span><span className="text-xl font-bold">{formatCurrency(selected.net)}</span></div>
        </CardContent>
      </Card>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent onClose={()=>setOpen(false)}><DialogHeader><DialogTitle>Create Salary Structure</DialogTitle></DialogHeader><div className="space-y-3"><Input placeholder="Structure Name"/><Input placeholder="Grade"/><Button className="w-full" onClick={()=>{toast.success("Structure created");setOpen(false)}}>Create</Button></div></DialogContent></Dialog>
  </div>
}
