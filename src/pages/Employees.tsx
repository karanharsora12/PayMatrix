import { useMemo, useState } from "react"
import { employees } from "@/mock/data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search, Plus, Upload, Download, MoreHorizontal, Eye, Pencil } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { NativeSelect } from "@/components/ui/select"
import { Dropdown, DropdownItem } from "@/components/ui/dropdown"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

export default function Employees(){
  const nav=useNavigate()
  const [q,setQ]=useState("")
  const [dept,setDept]=useState("")
  const [status,setStatus]=useState("")
  const [page,setPage]=useState(1)
  const pageSize=10
  const filtered=useMemo(()=> employees.filter(e=>{
    if(q && !(`${e.firstName} ${e.lastName} ${e.employeeId} ${e.email}`.toLowerCase().includes(q.toLowerCase()))) return false
    if(dept && e.department!==dept) return false
    if(status && e.status!==status) return false
    return true
  }),[q,dept,status])
  const paged=filtered.slice((page-1)*pageSize, page*pageSize)
  const totalPages=Math.ceil(filtered.length/pageSize)
  const [showImport,setShowImport]=useState(false)
  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Employees</h1><p className="text-sm text-muted-foreground">Manage your workforce • {filtered.length} employees</p></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={()=>setShowImport(true)}><Upload className="h-4 w-4 mr-2"/>Import</Button>
        <Button variant="outline" onClick={()=>toast.success("Exported to Excel")}><Download className="h-4 w-4 mr-2"/>Export</Button>
        <Button onClick={()=>nav("/employees/new")}><Plus className="h-4 w-4 mr-2"/>Add Employee</Button>
      </div>
    </div>

    <Card>
      <CardContent className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by name, ID, email" className="pl-9" value={q} onChange={e=>{setQ(e.target.value); setPage(1)}}/></div>
        <NativeSelect value={dept} onChange={setDept} placeholder="All Departments" className="w-[180px]">
          <option value="">All Departments</option>
          <option>Engineering</option><option>Finance</option><option>Marketing</option><option>Sales</option><option>Human Resources</option>
        </NativeSelect>
        <NativeSelect value={status} onChange={setStatus} placeholder="All Status" className="w-[160px]">
          <option value="">All Status</option><option>Active</option><option>On Leave</option><option>Probation</option><option>Inactive</option>
        </NativeSelect>
      </CardContent>
    </Card>

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><input type="checkbox"/></TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.map(e=><TableRow key={e.id}>
            <TableCell><input type="checkbox"/></TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <img src={e.avatar} className="h-8 w-8 rounded-full"/>
                <div><div className="font-medium text-sm">{e.firstName} {e.lastName}</div><div className="text-xs text-muted-foreground">{e.employeeId} • {e.email}</div></div>
              </div>
            </TableCell>
            <TableCell className="text-sm">{e.department}</TableCell>
            <TableCell className="text-sm">{e.designation}</TableCell>
            <TableCell className="text-sm">{e.branch}</TableCell>
            <TableCell><Badge variant="outline">{e.employmentType}</Badge></TableCell>
            <TableCell className="font-medium">{formatCurrency(e.salary)}</TableCell>
            <TableCell><Badge variant={e.status==="Active"?"success":e.status==="On Leave"?"warning":"secondary"}>{e.status}</Badge></TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={()=>nav(`/employees/${e.id}`)}><Eye className="h-4 w-4"/></Button>
                <Button variant="ghost" size="icon" onClick={()=>nav(`/employees/${e.id}`)}><Pencil className="h-4 w-4"/></Button>
                <Dropdown trigger={<Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4"/></Button>}>
                  <DropdownItem>View Salary</DropdownItem>
                  <DropdownItem>Attendance</DropdownItem>
                  <DropdownItem>Documents</DropdownItem>
                </Dropdown>
              </div>
            </TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between p-4 border-t text-sm">
        <div className="text-muted-foreground">Showing {(page-1)*pageSize+1}-{Math.min(page*pageSize, filtered.length)} of {filtered.length}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page===1} onClick={()=>setPage(p=>p-1)}>Previous</Button>
          <span className="px-2 py-1 text-sm">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>Next</Button>
        </div>
      </div>
    </Card>

    <Dialog open={showImport} onOpenChange={setShowImport}>
      <DialogContent onClose={()=>setShowImport(false)}>
        <DialogHeader><DialogTitle>Import Employees</DialogTitle></DialogHeader>
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-sm text-muted-foreground">Drop Excel file here or click to browse</div>
        <div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={()=>setShowImport(false)}>Cancel</Button><Button onClick={()=>{toast.success("Imported 12 employees");setShowImport(false)}}>Import</Button></div>
      </DialogContent>
    </Dialog>
  </div>
}
