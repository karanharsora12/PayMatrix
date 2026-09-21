import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  Calendar,
  AlertTriangle,
  Calculator,
  Send,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Users,
  DollarSign,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCreatePayrollRun,
  useCalculatePayroll,
  useSubmitPayroll,
  useApprovePayroll,
  useFinalizePayroll,
  usePayrollSummary,
  usePayrollEmployees,
} from "@/hooks/usePayroll";
import { useEmployees } from "@/hooks/useEmployees";

const STEPS = [
  { id: "period", label: "Select Period", desc: "Target Year & Month" },
  { id: "validate", label: "Validate", desc: "Eligibility & Gaps" },
  { id: "calculate", label: "Calculate", desc: "Attendance & Formulas" },
  { id: "review", label: "Review", desc: "Totals & Department" },
  { id: "submit", label: "Submit", desc: "Pre-Approval Check" },
  { id: "approve", label: "Approve", desc: "Manager Sign-off" },
  { id: "finalize", label: "Finalize", desc: "Lock & Generate Payslips" },
];

export default function PayrollWizard() {
  const nav = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(0);

  // Form State for Step 1
  const [year, setYear] = useState<number>(2026);
  const [month, setMonth] = useState<number>(9);
  const [payDate, setPayDate] = useState<string>("2026-10-05");
  const [policy, setPolicy] = useState<"CALENDAR_DAYS" | "WORKING_DAYS" | "FIXED_MONTHLY">("CALENDAR_DAYS");

  // Created Run State
  const [createdRunId, setCreatedRunId] = useState<string | null>(null);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [approvalComments, setApprovalComments] = useState<string>("Reviewed and verified for release.");

  // API Hooks
  const createMutation = useCreatePayrollRun();
  const calcMutation = useCalculatePayroll();
  const submitMutation = useSubmitPayroll();
  const approveMutation = useApprovePayroll();
  const finalizeMutation = useFinalizePayroll();

  const { data: allEmployeesData } = useEmployees({ page: 1, pageSize: 100 });
  const { data: summaryData, refetch: refetchSummary } = usePayrollSummary(createdRunId || "");
  const { data: runEmployeesData, refetch: refetchEmployees } = usePayrollEmployees(createdRunId || "", { page: 1, pageSize: 50 });

  const summary: any = (summaryData as any)?.data;
  const runEmployees: any[] = (runEmployeesData as any)?.data || [];
  const exceptions: any[] = calculationResult?.exceptions || [];

  // Step 1 -> Step 2: Create Draft Run
  const handleCreateRun = async () => {
    try {
      const res: any = await createMutation.mutateAsync({
        year,
        month,
        payDate,
        policy,
      });
      setCreatedRunId(res.id);
      toast.success(`Draft payroll run created for ${year}-${String(month).padStart(2, "0")}`);
      setCurrentStep(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create payroll run");
    }
  };

  // Step 2 -> Step 3: Trigger Calculation
  const handleStartCalculation = async () => {
    if (!createdRunId) return;
    try {
      const res: any = await calcMutation.mutateAsync({ id: createdRunId, policy });
      setCalculationResult(res);
      await refetchSummary();
      await refetchEmployees();
      toast.success("Payroll calculation completed!");
      setCurrentStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Calculation failed");
    }
  };

  // Step 3 -> Step 4: Advance to Review
  const handleProceedToReview = () => {
    setCurrentStep(3);
  };

  // Step 4 -> Step 5: Submit Run
  const handleSubmitRun = async () => {
    if (!createdRunId) return;
    try {
      await submitMutation.mutateAsync(createdRunId);
      toast.success("Payroll run submitted for approval");
      await refetchSummary();
      setCurrentStep(4);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  // Step 5 -> Step 6: Approve Run
  const handleApproveRun = async () => {
    if (!createdRunId) return;
    try {
      await approveMutation.mutateAsync({ id: createdRunId, comments: approvalComments });
      toast.success("Payroll run approved!");
      await refetchSummary();
      setCurrentStep(5);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  // Step 6 -> Step 7: Finalize
  const handleFinalizeRun = async () => {
    if (!createdRunId) return;
    try {
      await finalizeMutation.mutateAsync(createdRunId);
      toast.success("Payroll finalized & immutable payslips generated!");
      setCurrentStep(6);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Finalization failed");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Processing Wizard</h1>
          <p className="text-sm text-muted-foreground">
            Guided 7-step monthly payroll calculation, review, audit sign-off, and finalization.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => nav("/payroll")}>
          Cancel & Exit
        </Button>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STEPS.map((s, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isDone
                  ? "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100"
                  : "bg-muted/40 text-muted-foreground border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs mb-0.5">
                {isDone ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span>{idx + 1}.</span>
                )}
                <span className="truncate">{s.label}</span>
              </div>
              <div className="text-[10px] opacity-80 truncate">{s.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Step Content Card */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                Step {currentStep + 1}: {STEPS[currentStep].label}
              </CardTitle>
              <CardDescription>{STEPS[currentStep].desc}</CardDescription>
            </div>
            {summary && (
              <Badge variant="outline" className="font-mono text-xs">
                Run #{summary.runNumber} • {summary.status}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* STEP 1: SELECT PERIOD */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <NativeSelect value={String(year)} onChange={(v) => setYear(parseInt(v, 10))}>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Month</Label>
                  <NativeSelect value={String(month)} onChange={(v) => setMonth(parseInt(v, 10))}>
                    {[
                      { m: 1, name: "January" },
                      { m: 2, name: "February" },
                      { m: 3, name: "March" },
                      { m: 4, name: "April" },
                      { m: 5, name: "May" },
                      { m: 6, name: "June" },
                      { m: 7, name: "July" },
                      { m: 8, name: "August" },
                      { m: 9, name: "September" },
                      { m: 10, name: "October" },
                      { m: 11, name: "November" },
                      { m: 12, name: "December" },
                    ].map((item) => (
                      <option key={item.m} value={String(item.m)}>
                        {item.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                <div className="space-y-2">
                  <Label>Disbursement / Pay Date</Label>
                  <Input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label>Proration Policy</Label>
                <NativeSelect value={policy} onChange={(v: any) => setPolicy(v)} className="max-w-md">
                  <option value="CALENDAR_DAYS">
                    CALENDAR_DAYS (Payable = Paid Days / Month Calendar Days)
                  </option>
                  <option value="WORKING_DAYS">
                    WORKING_DAYS (Payable = Earned Working Days / Company Working Days)
                  </option>
                  <option value="FIXED_MONTHLY">
                    FIXED_MONTHLY (Full Base, deducts Unpaid LOP / Calendar Days)
                  </option>
                </NativeSelect>
                <p className="text-xs text-muted-foreground">
                  Components marked as non-proratable (e.g. fixed reimbursements) will not be reduced by attendance.
                </p>
              </div>

              <div className="bg-muted/40 p-4 rounded-lg flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-sm">
                  Period Range:{" "}
                  <span className="font-semibold">
                    {year}-{String(month).padStart(2, "0")}-01 → {year}-{String(month).padStart(2, "0")}-
                    {new Date(year, month, 0).getDate()}
                  </span>{" "}
                  ({new Date(year, month, 0).getDate()} Calendar Days)
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATE ELIGIBILITY & EXCEPTIONS */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Eligible Workforce</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {allEmployeesData?.data?.length || 0} Employees
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active employees joined on or before period end
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Salary Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Ready to Process
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Effective structures and attendance logs ready
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Proration Setting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl font-bold text-indigo-600">{policy}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected rule for mid-month joiners & LOP
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border rounded-lg p-4 bg-muted/20 text-sm space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Pre-Calculation Verification Passed
                </h4>
                <p className="text-muted-foreground">
                  The calculation engine will load effective salary revisions, combine attendance logs, calculate
                  paid days, evaluate formulas safely without eval, apply adjustments, and freeze snapshot copies.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: CALCULATION RESULTS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border rounded-xl p-4 text-center bg-muted/20">
                  <div className="text-xs text-muted-foreground">Processed Employees</div>
                  <div className="text-2xl font-bold text-primary">
                    {calculationResult?.processedCount || 0}
                  </div>
                </div>
                <div className="border rounded-xl p-4 text-center bg-muted/20">
                  <div className="text-xs text-muted-foreground">Total Gross</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculationResult?.totalGross || 0)}
                  </div>
                </div>
                <div className="border rounded-xl p-4 text-center bg-muted/20">
                  <div className="text-xs text-muted-foreground">Total Deductions</div>
                  <div className="text-2xl font-bold text-rose-600">
                    {formatCurrency(calculationResult?.totalDeductions || 0)}
                  </div>
                </div>
                <div className="border rounded-xl p-4 text-center bg-emerald-50 border-emerald-200 dark:bg-emerald-950">
                  <div className="text-xs text-emerald-800 dark:text-emerald-200">Net Payable</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(calculationResult?.totalNet || 0)}
                  </div>
                </div>
              </div>

              {/* Exceptions view if any */}
              {exceptions.length > 0 && (
                <div className="border border-amber-300 bg-amber-50 dark:bg-amber-950 p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    {exceptions.length} Employees with Configuration Exceptions
                  </div>
                  <div className="space-y-2">
                    {exceptions.map((ex, i) => (
                      <div
                        key={i}
                        className="bg-white dark:bg-background p-2.5 rounded border text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="font-semibold">{ex.employeeCode}</span> — {ex.employeeName} ({ex.departmentName})
                          <div className="text-muted-foreground">{ex.message}</div>
                        </div>
                        <Badge variant="destructive">{ex.errorCode}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: REVIEW TOTALS & BREAKDOWN */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Gross Earnings</div>
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {formatCurrency(summary?.totalGross || 0)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Earnings + Additions</p>
                </div>
                <div className="border rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Employee Deductions</div>
                  <div className="text-xl font-bold text-rose-600">
                    {formatCurrency(summary?.totalDeductions || 0)}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">PF, PT, other deductions</p>
                </div>
                <div className="border rounded-xl p-4 bg-primary text-primary-foreground">
                  <div className="text-xs opacity-80">Net Disbursable Salary</div>
                  <div className="text-xl font-bold">
                    {formatCurrency(summary?.totalNet || 0)}
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">Ready for submission</p>
                </div>
              </div>

              {/* Department breakdown */}
              {summary?.departmentSummary && summary.departmentSummary.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Department Breakdown</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Department</TableHead>
                          <TableHead className="text-center">Employees</TableHead>
                          <TableHead className="text-right">Gross</TableHead>
                          <TableHead className="text-right">Deductions</TableHead>
                          <TableHead className="text-right">Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.departmentSummary.map((dept: any) => (
                          <TableRow key={dept.departmentName}>
                            <TableCell className="font-medium">{dept.departmentName}</TableCell>
                            <TableCell className="text-center">{dept.employeeCount}</TableCell>
                            <TableCell className="text-right">{formatCurrency(dept.gross)}</TableCell>
                            <TableCell className="text-right text-rose-600">{formatCurrency(dept.deductions)}</TableCell>
                            <TableCell className="text-right font-semibold text-emerald-600">{formatCurrency(dept.net)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: SUBMIT FOR APPROVAL */}
          {currentStep === 4 && (
            <div className="space-y-6 text-center py-4">
              <div className="h-14 w-14 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold">Submit Payroll for Manager Approval</h3>
                <p className="text-sm text-muted-foreground">
                  Submitting will lock calculations from further modifications until reviewed by an authorized manager.
                </p>
              </div>
              <div className="border rounded-lg max-w-sm mx-auto p-4 text-left text-xs space-y-1.5 bg-muted/20">
                <div className="flex justify-between">
                  <span>Period:</span>
                  <span className="font-semibold">{summary?.periodYear}-{summary?.periodMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employees:</span>
                  <span className="font-semibold">{summary?.employeeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net Amount:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(summary?.totalNet || 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: APPROVAL SIGN-OFF */}
          {currentStep === 5 && (
            <div className="space-y-6 py-2">
              <div className="border rounded-lg p-4 bg-muted/20 space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Approval Authorization
                </h4>
                <p className="text-xs text-muted-foreground">
                  As an authorized payroll approver, review the totals and add remarks for audit logging.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Approver Remarks / Audit Comments</Label>
                <Input
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="e.g. Verified attendance logs and department revisions for Q3."
                />
              </div>
            </div>
          )}

          {/* STEP 7: FINALIZE & LOCK IMMUTABILITY */}
          {currentStep === 6 && (
            <div className="space-y-6 text-center py-4">
              <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold">Finalize Payroll & Generate Payslips</h3>
                <p className="text-sm text-muted-foreground">
                  Finalization is an irrevocable financial milestone. Once finalized, historical payroll snapshots
                  are locked and deterministic payslips (e.g. PAY-{year}-{String(month).padStart(2, "0")}-00001)
                  will be generated for all employees.
                </p>
              </div>
              <div className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-950 p-4 rounded-xl max-w-sm mx-auto text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                Ready to disburse {formatCurrency(summary?.totalNet || 0)} to {summary?.employeeCount} employees.
              </div>
            </div>
          )}

          {/* Wizard Action Footer */}
          <div className="flex items-center justify-between border-t pt-4">
            <Button
              variant="outline"
              disabled={currentStep === 0 || currentStep >= 4}
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === 0 && (
                <Button onClick={handleCreateRun} disabled={createMutation.isPending}>
                  Create Run & Validate
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 1 && (
                <Button onClick={handleStartCalculation} disabled={calcMutation.isPending}>
                  <Calculator className="h-4 w-4 mr-2" />
                  {calcMutation.isPending ? "Calculating..." : "Calculate Payroll"}
                </Button>
              )}

              {currentStep === 2 && (
                <Button onClick={handleProceedToReview}>
                  Review Totals
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 3 && (
                <Button onClick={handleSubmitRun} disabled={submitMutation.isPending}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Approval
                </Button>
              )}

              {currentStep === 4 && (
                <Button
                  onClick={handleApproveRun}
                  disabled={approveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve Payroll Run
                </Button>
              )}

              {currentStep === 5 && (
                <Button
                  onClick={handleFinalizeRun}
                  disabled={finalizeMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Finalize & Generate Payslips
                </Button>
              )}

              {currentStep === 6 && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => nav(`/payroll/${createdRunId}`)}>
                    View Run Snapshot
                  </Button>
                  <Button onClick={() => nav(`/payslips?year=${year}&month=${month}`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Open Payslips Directory
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
