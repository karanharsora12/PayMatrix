import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calculator,
  RefreshCw,
  Send,
  CheckCircle2,
  Lock,
  XCircle,
  FileText,
  Calendar,
  Users,
  Eye,
  Plus,
  ArrowLeft,
  Trash2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  usePayrollRun,
  usePayrollSummary,
  usePayrollEmployees,
  usePayrollEmployeeComponents,
  useCalculatePayroll,
  useRecalculatePayroll,
  useSubmitPayroll,
  useApprovePayroll,
  useFinalizePayroll,
  useCancelPayroll,
  useAddPayrollAdjustment,
  useDeletePayrollAdjustment,
} from "@/hooks/usePayroll";

export default function PayrollDetails() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Adjustment Form Dialog State
  const [isAdjModalOpen, setIsAdjModalOpen] = useState<boolean>(false);
  const [adjType, setAdjType] = useState<"ARREAR" | "BONUS" | "RECOVERY" | "OTHER_EARNING" | "OTHER_DEDUCTION">("BONUS");
  const [adjName, setAdjName] = useState<string>("");
  const [adjAmount, setAdjAmount] = useState<string>("");
  const [adjReason, setAdjReason] = useState<string>("");

  // API Queries
  const { data: runData, isLoading: isRunLoading, refetch: refetchRun } = usePayrollRun(id || "");
  const { data: summaryData, refetch: refetchSummary } = usePayrollSummary(id || "");
  const { data: employeesData, isLoading: isEmpLoading, refetch: refetchEmployees } = usePayrollEmployees(id || "", {
    page: 1,
    pageSize: 100,
  });

  const { data: selectedComponentsData, refetch: refetchComp } = usePayrollEmployeeComponents(
    id || "",
    selectedEmployeeId || "",
  );

  const run = (runData as any)?.data ?? runData;
  const summary = (summaryData as any)?.data ?? summaryData;
  const employees: any[] = (employeesData as any)?.data || employeesData || [];
  const selectedDetails = (selectedComponentsData as any)?.data ?? selectedComponentsData;

  // Mutations
  const calcMutation = useCalculatePayroll();
  const recalcMutation = useRecalculatePayroll();
  const submitMutation = useSubmitPayroll();
  const approveMutation = useApprovePayroll();
  const finalizeMutation = useFinalizePayroll();
  const cancelMutation = useCancelPayroll();
  const addAdjMutation = useAddPayrollAdjustment();
  const deleteAdjMutation = useDeletePayrollAdjustment();

  const isLocked = ["FINALIZED", "PAID"].includes(run?.status);

  // Actions
  const handleCalculate = async () => {
    if (!id) return;
    try {
      await calcMutation.mutateAsync({ id });
      toast.success("Payroll calculated successfully");
      refetchRun();
      refetchSummary();
      refetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Calculation failed");
    }
  };

  const handleRecalculate = async () => {
    if (!id) return;
    try {
      await recalcMutation.mutateAsync({ id });
      toast.success("Payroll recalculated successfully");
      refetchRun();
      refetchSummary();
      refetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Recalculation failed");
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    try {
      await submitMutation.mutateAsync(id);
      toast.success("Submitted for approval");
      refetchRun();
      refetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    try {
      await approveMutation.mutateAsync({ id, comments: "Approved via run details" });
      toast.success("Payroll run approved");
      refetchRun();
      refetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    if (!window.confirm("Finalizing will freeze this payroll run and generate payslips. Proceed?")) return;
    try {
      await finalizeMutation.mutateAsync(id);
      toast.success("Payroll finalized & payslips generated");
      refetchRun();
      refetchSummary();
      refetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Finalization failed");
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to cancel this payroll run?")) return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Payroll run cancelled");
      refetchRun();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedEmployeeId) return;
    if (!adjName || !adjAmount || !adjReason) {
      toast.error("Please fill in name, amount, and reason");
      return;
    }
    const numAmount = parseFloat(adjAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    try {
      await addAdjMutation.mutateAsync({
        runId: id,
        employeeId: selectedEmployeeId,
        data: {
          type: adjType,
          name: adjName,
          amount: numAmount,
          reason: adjReason,
        },
      });
      toast.success("Adjustment added");
      setIsAdjModalOpen(false);
      setAdjName("");
      setAdjAmount("");
      setAdjReason("");
      refetchComp();
      refetchSummary();
      refetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add adjustment");
    }
  };

  const handleDeleteAdjustment = async (adjId: string) => {
    if (!id || !selectedEmployeeId) return;
    try {
      await deleteAdjMutation.mutateAsync({
        adjustmentId: adjId,
        runId: id,
        employeeId: selectedEmployeeId,
      });
      toast.success("Adjustment removed");
      refetchComp();
      refetchSummary();
      refetchEmployees();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete adjustment");
    }
  };

  if (isRunLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading payroll run details...</p>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Payroll Run Not Found</h2>
        <Button onClick={() => nav("/payroll")}>Return to Payroll Runs</Button>
      </div>
    );
  }

  // Filter employees
  const filteredEmployees = employees.filter((e) => {
    if (departmentFilter !== "ALL" && e.departmentName !== departmentFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (e.employeeName && e.employeeName.toLowerCase().includes(term)) ||
      (e.employeeCode && e.employeeCode.toLowerCase().includes(term))
    );
  });

  const departmentList = Array.from(new Set(employees.map((e) => e.departmentName).filter(Boolean)));

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => nav("/payroll")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                Run #{run.runNumber || run.payrollCode}
              </h1>
              <Badge
                variant={
                  isLocked
                    ? "success"
                    : run.status === "APPROVED"
                    ? "info"
                    : run.status === "PENDING_APPROVAL"
                    ? "warning"
                    : "secondary"
                }
              >
                {run.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Period: {run.periodStart} → {run.periodEnd} • Disbursed: {run.payDate || "TBD"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {run.status === "DRAFT" && (
            <Button size="sm" onClick={handleCalculate} disabled={calcMutation.isPending}>
              <Calculator className="h-4 w-4 mr-1.5" />
              Calculate Run
            </Button>
          )}

          {run.status === "CALCULATED" && (
            <>
              <Button size="sm" variant="outline" onClick={handleRecalculate} disabled={recalcMutation.isPending}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Recalculate
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitMutation.isPending}>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit
              </Button>
            </>
          )}

          {run.status === "PENDING_APPROVAL" && (
            <>
              <Button size="sm" variant="outline" onClick={handleRecalculate} disabled={recalcMutation.isPending}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Recalculate
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Approve
              </Button>
            </>
          )}

          {run.status === "APPROVED" && (
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
            >
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Finalize & Lock
            </Button>
          )}

          {isLocked && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => nav(`/payslips?year=${run.periodYear}&month=${run.periodMonth}`)}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              View Generated Payslips
            </Button>
          )}

          {!isLocked && run.status !== "CANCELLED" && (
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleCancel}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Employees</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              {run.employeeCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Gross Earnings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold">
              {formatCurrency(Number(run.totalGross || run.grossAmount || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Deductions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold text-rose-600">
              {formatCurrency(Number(run.totalDeductions || 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-emerald-800 dark:text-emerald-200">
              Net Payable
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(Number(run.totalNet || run.netAmount || 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Employer CTC</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl font-bold text-muted-foreground">
              {formatCurrency(Number(run.totalCtc || 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees">Employees ({employees.length})</TabsTrigger>
          <TabsTrigger value="departments">Department Summary</TabsTrigger>
          <TabsTrigger value="audit">Audit History</TabsTrigger>
        </TabsList>

        {/* EMPLOYEES TAB */}
        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-1 items-center gap-3">
                  <Input
                    placeholder="Search employee name or code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-xs"
                  />
                  <NativeSelect
                    value={departmentFilter}
                    onChange={setDepartmentFilter}
                    className="w-44"
                  >
                    <option value="ALL">All Departments</option>
                    {departmentList.map((d: any) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isEmpLoading ? (
                <div className="p-8 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  No employee snapshots found for this run.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Paid / Total Days</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead className="text-center">Adjustments</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((pe: any) => (
                      <TableRow key={pe.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="font-medium text-sm">{pe.employeeName}</div>
                          <div className="font-mono text-xs text-muted-foreground">{pe.employeeCode}</div>
                        </TableCell>
                        <TableCell className="text-xs">{pe.departmentName}</TableCell>
                        <TableCell className="text-center text-xs">
                          <span className="font-semibold text-primary">{pe.paidDays}</span> / {pe.calendarDays}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {formatCurrency(Number(pe.grossSalary || pe.grossEarnings))}
                        </TableCell>
                        <TableCell className="text-right text-xs text-rose-600">
                          {formatCurrency(Number(pe.totalDeductions))}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-xs text-emerald-600">
                          {formatCurrency(Number(pe.netSalary))}
                        </TableCell>
                        <TableCell className="text-center">
                          {pe.adjustments?.length > 0 ? (
                            <Badge variant="outline" className="text-[10px]">
                              {pe.adjustments.length} adjustment{pe.adjustments.length > 1 ? "s" : ""}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEmployeeId(pe.employeeId)}
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Breakdown
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEPARTMENT SUMMARY TAB */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Cost Breakdown</CardTitle>
              <CardDescription>Aggregate payroll expenditure categorized by department</CardDescription>
            </CardHeader>
            <CardContent>
              {summary?.departmentSummary?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-center">Headcount</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.departmentSummary.map((dept: any) => (
                      <TableRow key={dept.departmentName}>
                        <TableCell className="font-semibold">{dept.departmentName}</TableCell>
                        <TableCell className="text-center">{dept.employeeCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(dept.gross)}</TableCell>
                        <TableCell className="text-right text-rose-600">{formatCurrency(dept.deductions)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">
                          {formatCurrency(dept.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  No department breakdown available yet. Calculate the run to populate.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT TAB */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Approval & Lifecycle History</CardTitle>
              <CardDescription>Immutable record of payroll state transitions and actions</CardDescription>
            </CardHeader>
            <CardContent>
              {run.approvals?.length > 0 ? (
                <div className="space-y-3">
                  {run.approvals.map((ap: any) => (
                    <div
                      key={ap.id}
                      className="border p-3 rounded-lg flex items-start justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold">{ap.action}</div>
                        <div className="text-muted-foreground mt-0.5">{ap.remarks || ap.comments || "No remarks"}</div>
                      </div>
                      <div className="text-muted-foreground text-right">
                        {new Date(ap.performedAt || ap.approvedAt || ap.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No approval history recorded yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* EMPLOYEE BREAKDOWN MODAL */}
      <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => !open && setSelectedEmployeeId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-lg">
              <span>{selectedDetails?.employee?.name || "Employee Snapshot"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {selectedDetails?.employee?.code}
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedDetails?.employee?.department} • {selectedDetails?.employee?.designation}
            </DialogDescription>
          </DialogHeader>

          {selectedDetails && (
            <div className="space-y-5 py-2">
              {/* Attendance Mini Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                <div className="border rounded p-2 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Calendar</div>
                  <div className="font-bold">{selectedDetails.employee.calendarDays}</div>
                </div>
                <div className="border rounded p-2 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Working</div>
                  <div className="font-bold">{selectedDetails.employee.workingDays}</div>
                </div>
                <div className="border rounded p-2 bg-emerald-50 dark:bg-emerald-950 border-emerald-300">
                  <div className="text-emerald-700 dark:text-emerald-300 text-[10px]">Paid Days</div>
                  <div className="font-bold text-emerald-600">{selectedDetails.employee.paidDays}</div>
                </div>
                <div className="border rounded p-2 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Gross</div>
                  <div className="font-bold">{formatCurrency(selectedDetails.totals.grossSalary)}</div>
                </div>
                <div className="border rounded p-2 bg-muted/20">
                  <div className="text-muted-foreground text-[10px]">Deductions</div>
                  <div className="font-bold text-rose-600">{formatCurrency(selectedDetails.totals.totalDeductions)}</div>
                </div>
                <div className="border rounded p-2 bg-primary text-primary-foreground">
                  <div className="opacity-80 text-[10px]">Net Pay</div>
                  <div className="font-bold">{formatCurrency(selectedDetails.totals.netSalary)}</div>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Earnings</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs py-2">Component</TableHead>
                        <TableHead className="text-xs py-2">Type</TableHead>
                        <TableHead className="text-xs py-2 text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDetails.earnings.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs py-2 font-medium">{c.componentName || c.componentCode}</TableCell>
                          <TableCell className="text-xs py-2 text-muted-foreground">{c.calculationType}</TableCell>
                          <TableCell className="text-xs py-2 text-right font-semibold">{formatCurrency(Number(c.amount))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Deductions Table */}
              {selectedDetails.deductions.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Deductions</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs py-2">Component</TableHead>
                          <TableHead className="text-xs py-2">Type</TableHead>
                          <TableHead className="text-xs py-2 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDetails.deductions.map((c: any) => (
                          <TableRow key={c.id}>
                            <TableCell className="text-xs py-2 font-medium">{c.componentName || c.componentCode}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">{c.calculationType}</TableCell>
                            <TableCell className="text-xs py-2 text-right text-rose-600 font-semibold">
                              {formatCurrency(Number(c.amount))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Adjustments Section */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Manual Adjustments
                  </h4>
                  {!isLocked && (
                    <Button size="sm" variant="outline" onClick={() => setIsAdjModalOpen(true)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Adjustment
                    </Button>
                  )}
                </div>

                {selectedDetails.adjustments.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedDetails.adjustments.map((adj: any) => (
                      <div
                        key={adj.id}
                        className="border p-2 rounded text-xs flex items-center justify-between bg-muted/20"
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span>{adj.name}</span>
                            <Badge variant={adj.isAddition ? "success" : "destructive"} className="text-[9px]">
                              {adj.type || adj.adjustmentType}
                            </Badge>
                          </div>
                          <div className="text-muted-foreground text-[11px]">{adj.reason}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${adj.isAddition ? "text-emerald-600" : "text-rose-600"}`}>
                            {adj.isAddition ? "+" : "-"}
                            {formatCurrency(Number(adj.amount))}
                          </span>
                          {!isLocked && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteAdjustment(adj.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">No manual adjustments recorded.</div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedEmployeeId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD ADJUSTMENT MODAL */}
      <Dialog open={isAdjModalOpen} onOpenChange={setIsAdjModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payroll Adjustment</DialogTitle>
            <DialogDescription>
              Add pre-finalization Arrear, Bonus, or Recovery with a mandatory reason.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdjustment} className="space-y-4">
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <NativeSelect value={adjType} onChange={(v: any) => setAdjType(v)}>
                <option value="ARREAR">ARREAR (Addition)</option>
                <option value="BONUS">BONUS (Addition)</option>
                <option value="OTHER_EARNING">OTHER EARNING (Addition)</option>
                <option value="RECOVERY">RECOVERY (Deduction)</option>
                <option value="OTHER_DEDUCTION">OTHER DEDUCTION (Deduction)</option>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Title / Name</Label>
              <Input
                placeholder="e.g. Festival Bonus, Shift Arrear"
                value={adjName}
                onChange={(e) => setAdjName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="5000"
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Justification / Reason (Mandatory)</Label>
              <Input
                placeholder="e.g. Approved by department head for Q3 special delivery"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAdjModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addAdjMutation.isPending}>
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
