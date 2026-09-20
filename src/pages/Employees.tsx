import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search, Plus, Upload, Download, MoreHorizontal, Eye, Pencil } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { NativeSelect } from "@/components/ui/select"
import { Dropdown, DropdownItem } from "@/components/ui/dropdown"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useEmployees } from "@/hooks/useEmployees"
import { employees as mockEmployees } from "@/mock/data"

export default function Employees(){
  const nav=useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('search') ?? ""
  const dept = searchParams.get('department') ?? ""
  const status = searchParams.get('status') ?? ""
  const page = Number(searchParams.get('page') ?? 1)
  const pageSize = 10

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value); else next.delete(key)
    if (key !== 'page') next.set('page','1')
    setSearchParams(next)
  }

  const filters = useMemo(()=>({
    page,
    pageSize,
    search: q || undefined,
    departmentId: dept || undefined,
    status: status || undefined,
  }),[q,dept,status,page])

  const { data, isLoading, isError, error } = useEmployees(filters)

  // Fallback to mock if API not reachable (dev without backend)
  const useMock = isError && !data
  const employees = useMock ? mockEmployees.filter(e=>{
    if(q && !(`${e.firstName} ${e.lastName} ${e.employeeId} ${e.email}`.toLowerCase().includes(q.toLowerCase()))) return false
    if(dept && e.department!==dept) return false
    if(status && e.status!==status) return false
    return true
  }) : []
  const list = useMock ? employees.slice((page-1)*pageSize, page*pageSize) : (data?.data ?? [])
  const total = useMock ? employees.length : (data?.meta?.total ?? 0)
  const totalPages = Math.ceil(total / pageSize)
  const [showImport,setShowImport]=useState(false)

  return <div className="space-y-4">
    <div className="flex flex-wrap justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Employees</h1><p className="text-sm text-muted-foreground">Manage your workforce • {total} employees {useMock && <span className="text-amber-600">(mock data — API unavailable)</span>}</p></div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={()=>setShowImport(true)}><Upload className="h-4 w-4 mr-2"/>Import</Button>
        <Button variant="outline" onClick={()=>toast.success("Exported to Excel")}><Download className="h-4 w-4 mr-2"/>Export</Button>
        <Button onClick={()=>nav("/employees/new")}><Plus className="h-4 w-4 mr-2"/>Add Employee</Button>
      </div>
    </div>

    <Card>
      <CardContent className="p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input placeholder="Search by name, ID, email" className="pl-9" value={q} onChange={e=> setParam('search', e.target.value)}/></div>
        <NativeSelect value={dept} onChange={(v)=> setParam('department', v)} placeholder="All Departments" className="w-[180px]">
          <option value="">All Departments</option>
          <option>Engineering</option><option>Finance</option><option>Marketing</option><option>Sales</option><option>Human Resources</option>
        </NativeSelect>
        <NativeSelect value={status} onChange={(v)=> setParam('status', v)} placeholder="All Status" className="w-[160px]">
          <option value="">All Status</option><option>Active</option><option>On Leave</option><option>Probation</option><option>Inactive</option>
        </NativeSelect>
      </CardContent>
    </Card>

    <Card>
      {isLoading ? (
        <div className="p-8 space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 bg-muted animate-pulse rounded"/> )}</div>
      ) : isError && !useMock ? (
        <div className="p-8 text-center text-sm text-red-600">Failed to load employees: {(error as any)?.normalizedError?.message ?? (error as any)?.message}<br/><span className="text-muted-foreground">Check that backend is running at VITE_API_URL</span></div>
      ) : (
      <>
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
          {list.length===0 ? <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No employees found</TableCell></TableRow> :
          list.map((e:any)=> {
            const firstName = e.firstName ?? e.first_name ?? ''
            const lastName = e.lastName ?? e.last_name ?? ''
            const code = e.employeeCode ?? e.employee_code ?? e.employeeId ?? ''
            const email = e.email ?? ''
            const deptName = e.department?.name ?? e.department ?? '—'
            const desig = e.designation?.name ?? e.designation ?? '—'
            const branch = e.branch?.name ?? e.branch ?? '—'
            const salary = e.salary ?? 0
            return <TableRow key={e.id}>
            <TableCell><input type="checkbox"/></TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <img src={e.avatar ?? `https://i.pravatar.cc/150?img=1`} className="h-8 w-8 rounded-full"/>
                <div><div className="font-medium text-sm">{firstName} {lastName}</div><div className="text-xs text-muted-foreground">{code} • {email}</div></div>
              </div>
            </TableCell>
            <TableCell className="text-sm">{deptName}</TableCell>
            <TableCell className="text-sm">{desig}</TableCell>
            <TableCell className="text-sm">{branch}</TableCell>
            <TableCell><Badge variant="outline">{e.employmentType ?? e.employment_status ?? 'Full-time'}</Badge></TableCell>
            <TableCell className="font-medium">{formatCurrency(Number(salary))}</TableCell>
            <TableCell><Badge variant={ (e.status==="Active"||e.employmentStatus==="CONFIRMED") ?"success":e.status==="On Leave"?"warning":"secondary"}>{e.status ?? e.employmentStatus ?? 'Active'}</Badge></TableCell>
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
          </TableRow>
          })}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between p-4 border-t text-sm">
        <div className="text-muted-foreground">Showing {(page-1)*pageSize+1}-{Math.min(page*pageSize, total)} of {total}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page===1} onClick={()=> setParam('page', String(page-1))}>Previous</Button>
          <span className="px-2 py-1 text-sm">Page {page} of {totalPages || 1}</span>
          <Button variant="outline" size="sm" disabled={page===totalPages || totalPages===0} onClick={()=> setParam('page', String(page+1))}>Next</Button>
        </div>
      </div>
      </>
      )}
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
