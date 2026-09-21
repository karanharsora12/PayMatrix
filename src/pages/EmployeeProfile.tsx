import { useParams, Link } from "react-router-dom"
import { useEmployee } from "@/hooks/useEmployees"
import { useEmployeeSalary } from "@/hooks/useSalary"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, Mail, Phone, MapPin, Briefcase, Calendar, CreditCard, Layers, Plus } from "lucide-react"

export default function EmployeeProfile(){
  const { id } = useParams<{ id: string }>()
  const { data: empData, isLoading } = useEmployee(id || '')
  const { data: salaryResp, isLoading: isSalaryLoading } = useEmployeeSalary(id)

  const e: any = empData || {}
  const salary: any = (salaryResp as any)?.data || salaryResp

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading employee profile...</div>
  }

  return (
    <div className="space-y-4">
      <Link to="/employees" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1"/> Back to Employees
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
              {e.firstName?.[0]}{e.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-[240px]">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold">{e.firstName} {e.lastName}</h1>
                <Badge variant={e.status === 'ACTIVE' ? 'success' : 'secondary'}>{e.status || 'ACTIVE'}</Badge>
                <span className="text-sm font-mono text-muted-foreground">{e.employeeId}</span>
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">
                {e.designation?.name || 'Staff'} • {e.department?.name || 'General'}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5"/>{e.email}</span>
                {e.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5"/>{e.phone}</span>}
                {e.branch?.name && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5"/>{e.branch.name}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5"/>Joined {formatDate(e.joiningDate)}</span>
              </div>
            </div>
            <div className="flex gap-2 self-start">
              <Link to="/employee-salary">
                <Button>Manage Salary</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-12 lg:col-span-4">
              <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Gender</span><span>{e.gender || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">DOB</span><span>{e.dob ? formatDate(e.dob) : '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{e.phone || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{e.email}</span></div>
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-4">
              <CardHeader><CardTitle>Employment</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{e.department?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Designation</span><span>{e.designation?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Branch</span><span>{e.branch?.name || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline">{e.employmentType?.name || 'Full-time'}</Badge></div>
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Current Salary</CardTitle>
                {salary?.structure && (
                  <Badge variant="outline" className="text-[10px] font-mono">{salary.structure.code}</Badge>
                )}
              </CardHeader>
              <CardContent>
                {isSalaryLoading ? (
                  <div className="text-xs text-muted-foreground">Loading salary...</div>
                ) : salary ? (
                  <>
                    <div className="text-2xl font-bold text-foreground">{formatCurrency(salary.totals.net)}</div>
                    <div className="text-xs text-muted-foreground">Net Monthly • {salary.structure.name}</div>
                    <div className="mt-3 space-y-1 text-sm border-t pt-2">
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Gross Salary:</span><span className="font-medium">{formatCurrency(salary.totals.gross)}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-muted-foreground">Deductions:</span><span className="font-medium text-destructive">-{formatCurrency(salary.totals.deductions)}</span></div>
                      <div className="flex justify-between text-xs font-semibold pt-1 border-t"><span>Monthly CTC:</span><span>{formatCurrency(salary.totals.monthlyCtc)}</span></div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-muted-foreground">No salary structure currently active.</p>
                    <Link to="/employee-salary">
                      <Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1"/>Assign Structure</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-6">
              <CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-3 gap-3 text-center">
                {[{l:"Casual",b:8,t:12},{l:"Sick",b:5,t:8},{l:"Privilege",b:10,t:15}].map(x=>(
                  <div key={x.l} className="rounded-lg border p-3">
                    <div className="text-lg font-bold">{x.b}/{x.t}</div>
                    <div className="text-xs text-muted-foreground">{x.l}</div>
                    <div className="h-1.5 bg-muted rounded-full mt-2">
                      <div className="h-full bg-primary rounded-full" style={{width:`${x.b/x.t*100}%`}}/>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="col-span-12 lg:col-span-6">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Link to="/employee-salary">
                  <Button variant="outline" size="sm"><Layers className="h-3.5 w-3.5 mr-1"/>Salary Revision</Button>
                </Link>
                <Link to="/attendance">
                  <Button variant="outline" size="sm"><Calendar className="h-3.5 w-3.5 mr-1"/>Attendance Logs</Button>
                </Link>
                <Link to="/leave-requests">
                  <Button variant="outline" size="sm"><Calendar className="h-3.5 w-3.5 mr-1"/>Leave Management</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dedicated Salary Tab */}
        <TabsContent value="salary">
          {salary ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b">
                <div>
                  <CardTitle>Salary Breakdown — {salary.structure.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{salary.structure.code} • As of {salary.salaryDate}</p>
                </div>
                <Link to="/employee-salary">
                  <Button size="sm"><Layers className="h-3.5 w-3.5 mr-1"/>Revise Salary</Button>
                </Link>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="font-semibold text-sm mb-2 text-emerald-700">Earnings</div>
                    {salary.earnings.map((e: any) => (
                      <div key={e.componentId} className="flex justify-between py-1.5 text-sm border-b">
                        <div>
                          <span className="font-medium">{e.name}</span>
                          <span className="text-xs font-mono text-muted-foreground ml-1.5">({e.code})</span>
                        </div>
                        <span className="font-medium">{formatCurrency(e.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2.5 text-sm">
                      <span>Gross Salary</span>
                      <span>{formatCurrency(salary.totals.gross)}</span>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-sm mb-2 text-destructive">Deductions</div>
                    {salary.deductions.map((d: any) => (
                      <div key={d.componentId} className="flex justify-between py-1.5 text-sm border-b">
                        <div>
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs font-mono text-muted-foreground ml-1.5">({d.code})</span>
                        </div>
                        <span className="font-medium text-destructive">-{formatCurrency(d.amount)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-semibold pt-2.5 text-sm">
                      <span>Total Deductions</span>
                      <span className="text-destructive">-{formatCurrency(salary.totals.deductions)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-primary text-primary-foreground p-4 flex justify-between items-center">
                  <div>
                    <span className="font-medium text-sm">Net Monthly Take-Home</span>
                    <div className="text-xs text-primary-foreground/80">Monthly CTC: {formatCurrency(salary.totals.monthlyCtc)}</div>
                  </div>
                  <span className="text-2xl font-bold">{formatCurrency(salary.totals.net)}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <p className="text-base font-semibold text-foreground">No Salary Structure Assigned</p>
              <p className="text-sm mt-1">Assign an active salary structure to this employee to enable automated payroll calculation.</p>
              <Link to="/employee-salary">
                <Button className="mt-4"><Plus className="h-4 w-4 mr-1.5"/>Assign Salary</Button>
              </Link>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="personal"><Card><CardContent className="p-8 text-center text-muted-foreground">Personal information, addresses, bank accounts, and statutory records.</CardContent></Card></TabsContent>
        <TabsContent value="employment"><Card><CardContent className="p-8 text-center text-muted-foreground">Employment history, shifts, designations, and reporting hierarchy.</CardContent></Card></TabsContent>
        <TabsContent value="attendance"><Card><CardContent className="p-8 text-center text-muted-foreground">Attendance logs, biometric punches, and work hours.</CardContent></Card></TabsContent>
        <TabsContent value="leave"><Card><CardContent className="p-8 text-center text-muted-foreground">Leave allocations, leave balance records, and request history.</CardContent></Card></TabsContent>
        <TabsContent value="documents"><Card><CardContent className="p-8 text-center text-muted-foreground">Uploaded employee identity, tax, and employment documents.</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  )
}
