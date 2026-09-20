import { loans } from "@/mock/data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency } from "@/lib/utils"
import { Plus } from "lucide-react"

export default function Loans(){
  return <div className="space-y-4">
    <Tabs defaultValue="loans"><div className="flex justify-between"><h1 className="text-xl font-semibold">Loans & Advances</h1><TabsList><TabsTrigger value="loans">Loans</TabsTrigger><TabsTrigger value="advances">Advances</TabsTrigger><TabsTrigger value="types">Loan Types</TabsTrigger></TabsList></div>
      <TabsContent value="loans">
        <div className="flex justify-end mb-3"><Button size="sm"><Plus className="h-4 w-4 mr-1"/>New Loan</Button></div>
        <Card><Table><TableHeader><TableRow><TableHead>Loan ID</TableHead><TableHead>Employee</TableHead><TableHead>Loan Type</TableHead><TableHead>Amount</TableHead><TableHead>EMI</TableHead><TableHead>Outstanding</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>{loans.map(l=><TableRow key={l.id}><TableCell className="font-mono text-xs">{l.id}</TableCell><TableCell>{l.employee}</TableCell><TableCell>{l.loanType}</TableCell><TableCell>{formatCurrency(l.amount)}</TableCell><TableCell>{formatCurrency(l.emi)}</TableCell><TableCell className="font-medium">{formatCurrency(l.outstanding)}</TableCell><TableCell><Badge variant="success">{l.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
      </TabsContent>
      <TabsContent value="advances">
        <Card><Table><TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Recovery Month</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody><tr><td className="p-3">Rahul Verma</td><td className="p-3">{formatCurrency(30000)}</td><td className="p-3">2026-09-05</td><td className="p-3">Oct 2026</td><td className="p-3"><Badge variant="warning">Pending</Badge></td></tr></TableBody></Table></Card>
      </TabsContent>
      <TabsContent value="types">
        <Card><Table><TableHeader><TableRow><TableHead>Loan Name</TableHead><TableHead>Max Amount</TableHead><TableHead>Interest</TableHead><TableHead>Tenure</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody><tr><td className="p-3">Personal Loan</td><td className="p-3">{formatCurrency(500000)}</td><td className="p-3">10%</td><td className="p-3">24 months</td><td className="p-3"><Badge variant="success">Active</Badge></td></tr><tr><td className="p-3">Vehicle Loan</td><td className="p-3">{formatCurrency(1000000)}</td><td className="p-3">9%</td><td className="p-3">60 months</td><td className="p-3"><Badge variant="success">Active</Badge></td></tr></TableBody></Table></Card>
      </TabsContent>
    </Tabs>
  </div>
}
