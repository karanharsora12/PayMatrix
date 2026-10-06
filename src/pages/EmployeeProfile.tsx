import { useParams, Link } from "react-router-dom";
import { useEmployee } from "@/hooks/useEmployees";
import { useCanAssignDocument } from "@/hooks/useUserParameters";
import { useEmployeeSalary } from "@/hooks/useSalary";
import { EmployeePreference } from "@/components/employee/EmployeePreference";
import { AssignDocumentModal } from "@/components/employee/AssignDocumentModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  CreditCard,
  Layers,
  Plus,
} from "lucide-react";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { FormFooter } from "@/components/common/FormFooter";
import { useNavigate } from "react-router-dom";

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const { data: empData, isLoading } = useEmployee(id || "");
  const { data: salaryResp, isLoading: isSalaryLoading } =
    useEmployeeSalary(id);

  const e: any = empData || {};
  const salary: any = (salaryResp as any)?.data || salaryResp;

  const nav = useNavigate();
  const canAssignDocument = useCanAssignDocument();

  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        Loading employee profile...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
        <ListingCard>
          <ListingHeader title="Employee Profile" />
          <div className="p-4 space-y-4">
            <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <div className="h-32 bg-gradient-to-r from-primary/80 via-primary to-primary/60 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              </div>
              <CardContent className="p-6 pt-0 relative">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="-mt-12 h-24 w-24 rounded-2xl bg-background border-4 border-background text-primary flex items-center justify-center font-bold text-4xl shadow-xl z-10 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors"></div>
                    {e.firstName?.[0]}
                    {e.lastName?.[0]}
                  </div>
                  <div className="flex-1 mt-2 md:mt-4 min-w-[240px]">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-bold tracking-tight">
                        {e.firstName} {e.lastName}
                      </h1>
                      <Badge
                        variant={
                          e.status === "ACTIVE" ? "success" : "secondary"
                        }
                        className="shadow-sm"
                      >
                        {e.status || "ACTIVE"}
                      </Badge>
                      <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        {e.employeeId || e.employeeCode}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-primary/80 mt-1">
                      {e.designation?.name || "Staff"} •{" "}
                      {e.department?.name || "General"}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                        <Mail className="h-4 w-4" />
                        {e.email}
                      </span>
                      {e.phone && (
                        <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                          <Phone className="h-4 w-4" />
                          {e.phone}
                        </span>
                      )}
                      {e.branch?.name && (
                        <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
                          <MapPin className="h-4 w-4" />
                          {e.branch.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Joined {formatDate(e.joiningDate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 self-start mt-4 md:mt-4 md:self-end">
                    {canAssignDocument && <AssignDocumentModal employeeId={e.id} />}
                    <Link to="/employee-salary">
                      <Button className="shadow-md hover:shadow-lg transition-all">
                        Manage Salary
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="preference">Preference</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-12 gap-4">
                  <Card className="col-span-12 lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender</span>
                        <span>{e.gender || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DOB</span>
                        <span>{e.dob ? formatDate(e.dob) : "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span>{e.phone || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email</span>
                        <span>{e.email}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-4">
                    <CardHeader>
                      <CardTitle>Employment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Department
                        </span>
                        <span>{e.department?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Designation
                        </span>
                        <span>{e.designation?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Branch</span>
                        <span>{e.branch?.name || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <Badge variant="outline">
                          {e.employmentType?.name || "Full-time"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle>Current Salary</CardTitle>
                      {salary?.structure && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          {salary.structure.code}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isSalaryLoading ? (
                        <div className="text-xs text-muted-foreground">
                          Loading salary...
                        </div>
                      ) : salary ? (
                        <>
                          <div className="text-2xl font-bold text-foreground">
                            {formatCurrency(salary.totals.net)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Net Monthly • {salary.structure.name}
                          </div>
                          <div className="mt-3 space-y-1 text-sm border-t pt-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Gross Salary:
                              </span>
                              <span className="font-medium">
                                {formatCurrency(salary.totals.gross)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">
                                Deductions:
                              </span>
                              <span className="font-medium text-destructive">
                                -{formatCurrency(salary.totals.deductions)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold pt-1 border-t">
                              <span>Monthly CTC:</span>
                              <span>
                                {formatCurrency(salary.totals.monthlyCtc)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 space-y-2">
                          <p className="text-xs text-muted-foreground">
                            No salary structure currently active.
                          </p>
                          <Link to="/employee-salary">
                            <Button size="sm" variant="outline">
                              <Plus className="h-3 w-3 mr-1" />
                              Assign Structure
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader>
                      <CardTitle>Leave Balance</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-3 text-center">
                      {[
                        { l: "Casual", b: 8, t: 12 },
                        { l: "Sick", b: 5, t: 8 },
                        { l: "Privilege", b: 10, t: 15 },
                      ].map((x) => (
                        <div key={x.l} className="rounded-lg border p-3">
                          <div className="text-lg font-bold">
                            {x.b}/{x.t}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {x.l}
                          </div>
                          <div className="h-1.5 bg-muted rounded-full mt-2">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(x.b / x.t) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="col-span-12 lg:col-span-6">
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Link to="/employee-salary">
                        <Button variant="outline" size="sm">
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          Salary Revision
                        </Button>
                      </Link>
                      <Link to="/attendance">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Attendance Logs
                        </Button>
                      </Link>
                      <Link to="/leave-requests">
                        <Button variant="outline" size="sm">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          Leave Management
                        </Button>
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
                        <CardTitle>
                          Salary Breakdown — {salary.structure.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {salary.structure.code} • As of {salary.salaryDate}
                        </p>
                      </div>
                      <Link to="/employee-salary">
                        <Button size="sm">
                          <Layers className="h-3.5 w-3.5 mr-1" />
                          Revise Salary
                        </Button>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="font-semibold text-sm mb-2 text-emerald-700">
                            Earnings
                          </div>
                          {salary.earnings.map((e: any) => (
                            <div
                              key={e.componentId}
                              className="flex justify-between py-1.5 text-sm border-b"
                            >
                              <div>
                                <span className="font-medium">{e.name}</span>
                                <span className="text-xs font-mono text-muted-foreground ml-1.5">
                                  ({e.code})
                                </span>
                              </div>
                              <span className="font-medium">
                                {formatCurrency(e.amount)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold pt-2.5 text-sm">
                            <span>Gross Salary</span>
                            <span>{formatCurrency(salary.totals.gross)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="font-semibold text-sm mb-2 text-destructive">
                            Deductions
                          </div>
                          {salary.deductions.map((d: any) => (
                            <div
                              key={d.componentId}
                              className="flex justify-between py-1.5 text-sm border-b"
                            >
                              <div>
                                <span className="font-medium">{d.name}</span>
                                <span className="text-xs font-mono text-muted-foreground ml-1.5">
                                  ({d.code})
                                </span>
                              </div>
                              <span className="font-medium text-destructive">
                                -{formatCurrency(d.amount)}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold pt-2.5 text-sm">
                            <span>Total Deductions</span>
                            <span className="text-destructive">
                              -{formatCurrency(salary.totals.deductions)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl bg-primary text-primary-foreground p-4 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-sm">
                            Net Monthly Take-Home
                          </span>
                          <div className="text-xs text-primary-foreground/80">
                            Monthly CTC:{" "}
                            {formatCurrency(salary.totals.monthlyCtc)}
                          </div>
                        </div>
                        <span className="text-2xl font-bold">
                          {formatCurrency(salary.totals.net)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="p-12 text-center text-muted-foreground border-dashed">
                    <p className="text-base font-semibold text-foreground">
                      No Salary Structure Assigned
                    </p>
                    <p className="text-sm mt-1">
                      Assign an active salary structure to this employee to
                      enable automated payroll calculation.
                    </p>
                    <Link to="/employee-salary">
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-1.5" />
                        Assign Salary
                      </Button>
                    </Link>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="personal">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">
                        Statutory Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">
                          PAN Number
                        </span>
                        <span className="font-medium">
                          {e.panNumber || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">
                          National ID / Aadhar
                        </span>
                        <span className="font-medium">
                          {e.nationalIdNumber || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">UAN (PF)</span>
                        <span className="font-medium">
                          {e.uanNumber || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-muted-foreground">
                          ESI Number
                        </span>
                        <span className="font-medium">
                          {e.esiNumber || "-"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">Bank Name</span>
                        <span className="font-medium">{e.bankName || "-"}</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">
                          Account Holder
                        </span>
                        <span className="font-medium">
                          {e.accountHolder || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span className="text-muted-foreground">
                          Account Number
                        </span>
                        <span className="font-medium">
                          {e.accountNumber || "-"}
                        </span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-muted-foreground">IFSC Code</span>
                        <span className="font-medium">{e.ifscCode || "-"}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">
                        Demographics & Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between border-b pb-1 mb-2">
                            <span className="text-muted-foreground">
                              Gender
                            </span>
                            <span className="font-medium">
                              {e.gender || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between border-b pb-1">
                            <span className="text-muted-foreground">
                              Blood Group
                            </span>
                            <span className="font-medium">
                              {e.bloodGroup || "-"}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">
                            Current Address
                          </div>
                          <div className="font-medium p-2 bg-muted/30 rounded-md border">
                            {e.address || "No address provided"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="employment">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-md">
                      Employment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm max-w-xl">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Employee ID</span>
                      <span className="font-medium">
                        {e.employeeId || e.employeeCode || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">
                        Date of Joining
                      </span>
                      <span className="font-medium">
                        {e.joiningDate ? formatDate(e.joiningDate) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">
                        {e.department?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Designation</span>
                      <span className="font-medium">
                        {e.designation?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-muted-foreground">Branch</span>
                      <span className="font-medium">
                        {e.branch?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-medium">{e.status || "-"}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="attendance">
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Attendance module integration pending...
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="leave">
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    Leave management integration pending...
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="preference">
                <EmployeePreference employee={e} />
              </TabsContent>
            </Tabs>
          </div>
        </ListingCard>
      </div>
      <FormFooter
        onCancel={() => nav("/employees")}
        cancelLabel="Back to Employees"
        hideSave={true}
      />
    </div>
  );
}
