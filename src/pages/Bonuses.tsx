import { bonuses } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Bonuses(){
  return <div className="space-y-4">
    <Tabs defaultValue="bonus"><div className="flex justify-between"><h1 className="text-xl font-semibold">Bonus & Deductions</h1><TabsList><TabsTrigger value="bonus">Bonuses</TabsTrigger><TabsTrigger value="deductions">Deductions</TabsTrigger></TabsList></div>
      <TabsContent value="bonus">
        <div className="flex justify-end mb-2"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>Add Bonus</Button></div>
        <Card><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Period</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{bonuses.map(b=><TableRow key={b.id}><TableCell>{b.employee}</TableCell><TableCell>{b.type}</TableCell><TableCell>{formatCurrency(b.amount)}</TableCell><TableCell>{b.date}</TableCell><TableCell>{b.period}</TableCell><TableCell><Badge variant={b.status==="Approved"?"success":"warning"}>{b.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>
      <TabsContent value="deductions">
        <Card><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Recurring</TableHead><TableHead>Period</TableHead></TableRow></TableHeader>
        <TableBody><tr><td className="p-3">Sneha Kapoor</td><td className="p-3">Advance Recovery</td><td className="p-3">{formatCurrency(5000)}</td><td className="p-3">Yes</td><td className="p-3">Sep-Nov 2026</td></tr></TableBody></Table></Card>
      </TabsContent>
    </Tabs>
  </div>
}
