import { salaryComponents } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function SalaryComponents(){
  const earnings=salaryComponents.filter(c=>c.type==="Earning")
  const deductions=salaryComponents.filter(c=>c.type==="Deduction")
  return <div className="space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Salary Components</h1><Button><Plus className="h-4 w-4 mr-2"/>Add Component</Button></div>
    <Tabs defaultValue="all"><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="earnings">Earnings</TabsTrigger><TabsTrigger value="deductions">Deductions</TabsTrigger></TabsList>
      <TabsContent value="all"><ComponentTable data={salaryComponents}/></TabsContent>
      <TabsContent value="earnings"><ComponentTable data={earnings}/></TabsContent>
      <TabsContent value="deductions"><ComponentTable data={deductions}/></TabsContent>
    </Tabs>
  </div>
}
function ComponentTable({data}:{data:any[]}){
  return <Card><Table><TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Calculation</TableHead><TableHead>Value</TableHead><TableHead>Taxable</TableHead><TableHead>Statutory</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
  <TableBody>{data.map((c:any)=><TableRow key={c.code}><TableCell className="font-mono text-xs">{c.code}</TableCell><TableCell>{c.name}</TableCell><TableCell><Badge variant={c.type==="Earning"?"success":"destructive"}>{c.type}</Badge></TableCell><TableCell>{c.calculationType}</TableCell><TableCell>{c.percentage?`${c.percentage}%`:c.amount?`₹${c.amount}`:"-"}</TableCell><TableCell>{c.taxable?"Yes":"No"}</TableCell><TableCell>{c.statutory?"Yes":"No"}</TableCell><TableCell><Badge variant="success">Active</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
}
