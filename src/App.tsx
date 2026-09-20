import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { AppShell } from "@/components/layout/AppShell"
import Dashboard from "@/pages/Dashboard"
import Employees from "@/pages/Employees"
import EmployeeProfile from "@/pages/EmployeeProfile"
import AddEmployee from "@/pages/AddEmployee"
import Departments from "@/pages/Departments"
import Designations from "@/pages/Designations"
import Branches from "@/pages/Branches"
import Attendance from "@/pages/Attendance"
import Shifts from "@/pages/Shifts"
import Leave from "@/pages/Leave"
import SalaryComponents from "@/pages/SalaryComponents"
import SalaryStructures from "@/pages/SalaryStructures"
import EmployeeSalary from "@/pages/EmployeeSalary"
import PayrollRuns from "@/pages/PayrollRuns"
import PayrollWizard from "@/pages/PayrollWizard"
import PayrollDetails from "@/pages/PayrollDetails"
import Payslip from "@/pages/Payslip"
import Loans from "@/pages/Loans"
import Bonuses from "@/pages/Bonuses"
import Compliance from "@/pages/Compliance"
import Reports from "@/pages/Reports"
import UsersRoles from "@/pages/UsersRoles"
import Settings from "@/pages/Settings"
import Placeholder from "@/pages/Placeholder"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { employees } from "@/mock/data"
import { Search } from "lucide-react"

function CommandPalette({open,onOpenChange}:{open:boolean,onOpenChange:(v:boolean)=>void}){
  const [q,setQ]=useState("")
  const results = q ? employees.filter(e=> `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(q.toLowerCase())).slice(0,5) : []
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-xl" onClose={()=>onOpenChange(false)}>
      <DialogHeader><DialogTitle>Search PayMatrix</DialogTitle></DialogHeader>
      <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search employees, payroll, reports..." className="pl-9" value={q} onChange={e=>setQ(e.target.value)}/></div>
      <div className="space-y-1 max-h-[300px] overflow-auto">
        {results.map(r=><div key={r.id} className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"><img src={r.avatar} className="h-8 w-8 rounded-full"/><div><div className="text-sm font-medium">{r.firstName} {r.lastName}</div><div className="text-xs text-muted-foreground">{r.employeeId} • {r.designation}</div></div></div>)}
        {!q && <div className="text-sm text-muted-foreground p-2">Try: "John", "EMP-1002", "Payroll", "Salary Register"</div>}
      </div>
    </DialogContent>
  </Dialog>
}

export default function App(){
  const [cmd,setCmd]=useState(false)
  return <BrowserRouter>
    <CommandPalette open={cmd} onOpenChange={setCmd}/>
    <Routes>
      <Route element={<AppShell onOpenCommand={()=>setCmd(true)}/>}>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/employees" element={<Employees/>}/>
        <Route path="/employees/new" element={<AddEmployee/>}/>
        <Route path="/employees/:id" element={<EmployeeProfile/>}/>
        <Route path="/departments" element={<Departments/>}/>
        <Route path="/designations" element={<Designations/>}/>
        <Route path="/branches" element={<Branches/>}/>
        <Route path="/attendance" element={<Attendance/>}/>
        <Route path="/attendance-register" element={<Attendance/>}/>
        <Route path="/shifts" element={<Shifts/>}/>
        <Route path="/holidays" element={<Placeholder title="Holidays"/>}/>
        <Route path="/overtime" element={<Placeholder title="Overtime"/>}/>
        <Route path="/leave-types" element={<Leave/>}/>
        <Route path="/leave-requests" element={<Leave/>}/>
        <Route path="/leave-balances" element={<Leave/>}/>
        <Route path="/leave-calendar" element={<Leave/>}/>
        <Route path="/salary-components" element={<SalaryComponents/>}/>
        <Route path="/salary-structures" element={<SalaryStructures/>}/>
        <Route path="/employee-salary" element={<EmployeeSalary/>}/>
        <Route path="/payroll" element={<PayrollRuns/>}/>
        <Route path="/payroll/new" element={<PayrollWizard/>}/>
        <Route path="/payroll/:id" element={<PayrollDetails/>}/>
        <Route path="/payslips" element={<Payslip/>}/>
        <Route path="/loans" element={<Loans/>}/>
        <Route path="/advances" element={<Loans/>}/>
        <Route path="/bonuses" element={<Bonuses/>}/>
        <Route path="/deductions" element={<Bonuses/>}/>
        <Route path="/compliance/:type" element={<Compliance/>}/>
        <Route path="/reports" element={<Reports/>}/>
        <Route path="/users" element={<UsersRoles/>}/>
        <Route path="/roles" element={<UsersRoles/>}/>
        <Route path="/audit-logs" element={<Placeholder title="Audit Logs"/>}/>
        <Route path="/settings" element={<Settings/>}/>
        <Route path="/organization/company" element={<Placeholder title="Company"/>}/>
        <Route path="/locations" element={<Placeholder title="Locations"/>}/>
        <Route path="/employee-groups" element={<Placeholder title="Employee Groups"/>}/>
        <Route path="/documents" element={<Placeholder title="Employee Documents"/>}/>
        <Route path="/bank-accounts" element={<Placeholder title="Bank Accounts"/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Route>
    </Routes>
  </BrowserRouter>
}
