import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { employees } from "@/mock/data"
import { Printer, Download, Mail } from "lucide-react"

export default function Payslip(){
  const e=employees[0]
  return <div className="max-w-3xl mx-auto space-y-4">
    <div className="flex justify-between"><h1 className="text-xl font-semibold">Payslip</h1><div className="flex gap-2"><Button variant="outline" size="sm"><Printer className="h-4 w-4 mr-1"/>Print</Button><Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1"/>PDF</Button><Button size="sm"><Mail className="h-4 w-4 mr-1"/>Email</Button></div></div>
    <Card className="overflow-hidden">
      <div className="bg-primary text-primary-foreground p-6 flex justify-between">
        <div><div className="text-lg font-bold">PayMatrix Technologies Pvt Ltd</div><div className="text-sm opacity-80">Bandra Kurla Complex, Mumbai 400051 • CIN: U12345MH2021PTC123456</div></div>
        <div className="text-right"><div className="text-sm opacity-80">Payslip for</div><div className="font-semibold">September 2026</div></div>
      </div>
      <CardContent className="p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1"><div className="font-semibold">{e.firstName} {e.lastName}</div><div className="text-muted-foreground">{e.employeeId} • {e.designation}</div><div>{e.department} • {e.branch}</div><div>Joining: 12 Mar 2022</div></div>
          <div className="space-y-1 text-right"><div>Bank: HDFC • **** 1234</div><div>PAN: ABCDE1234F</div><div>PF: MH/12345/678</div><div>Pay Days: 30 / 30</div></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div><div className="font-semibold border-b pb-2">Earnings</div>
            {[
              ["Basic",40000],["HRA",20000],["Special Allowance",10000],["Conveyance",5000],["Overtime",2500],["Bonus",5000]
            ].map(([n,a])=><div key={n as string} className="flex justify-between py-1.5 text-sm border-b"><span>{n}</span><span>{formatCurrency(a as number)}</span></div>)}
            <div className="flex justify-between font-semibold pt-2"><span>Gross Earnings</span><span>{formatCurrency(82500)}</span></div>
          </div>
          <div><div className="font-semibold border-b pb-2">Deductions</div>
            {[
              ["Provident Fund",4800],["Professional Tax",200],["Income Tax",3500],["Loan Deduction",3200]
            ].map(([n,a])=><div key={n as string} className="flex justify-between py-1.5 text-sm border-b"><span>{n}</span><span>{formatCurrency(a as number)}</span></div>)}
            <div className="flex justify-between font-semibold pt-2"><span>Total Deductions</span><span>{formatCurrency(11700)}</span></div>
          </div>
        </div>
        <div className="rounded-xl bg-zinc-900 text-white p-4 flex justify-between items-center dark:bg-zinc-800"><span>Net Salary Payable</span><span className="text-xl font-bold">{formatCurrency(70800)}</span></div>
        <div className="text-xs text-muted-foreground">This is a computer generated payslip and does not require signature. Amount in words: Seventy Thousand Eight Hundred Rupees Only.</div>
      </CardContent>
    </Card>
  </div>
}
