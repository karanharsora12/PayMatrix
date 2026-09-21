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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Plus,
  Eye,
  Calculator,
  RefreshCw,
  Send,
  CheckCircle2,
  Lock,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  usePayrollRuns,
  useCalculatePayroll,
  useSubmitPayroll,
  useApprovePayroll,
  useFinalizePayroll,
  useCancelPayroll,
} from "@/hooks/usePayroll";
import { toast } from "sonner";

export default function PayrollRuns() {
  const nav = useNavigate();
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const params: any = { page: 1, pageSize: 50 };
  if (yearFilter !== "ALL") params.year = parseInt(yearFilter, 10);
  if (statusFilter !== "ALL") params.status = statusFilter;

  const { data, isLoading, refetch } = usePayrollRuns(params);
  const runs: any[] = data?.data || [];

  const calcMutation = useCalculatePayroll();
  const submitMutation = useSubmitPayroll();
  const approveMutation = useApprovePayroll();
  const finalizeMutation = useFinalizePayroll();
  const cancelMutation = useCancelPayroll();

  const handleCalculate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await calcMutation.mutateAsync({ id });
      toast.success("Payroll calculated successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Calculation failed");
    }
  };

  const handleSubmit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await submitMutation.mutateAsync(id);
      toast.success("Payroll submitted for approval");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await approveMutation.mutateAsync({
        id,
        comments: "Approved via dashboard",
      });
      toast.success("Payroll approved");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Approval failed");
    }
  };

  const handleFinalize = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await finalizeMutation.mutateAsync(id);
      toast.success("Payroll finalized & payslips generated");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Finalization failed");
    }
  };

  const handleCancel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this payroll run?"))
      return;
    try {
      await cancelMutation.mutateAsync(id);
      toast.success("Payroll run cancelled");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancellation failed");
    }
  };

  const filteredRuns = runs.filter((r) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (r.runNumber && r.runNumber.toLowerCase().includes(term)) ||
      (r.payrollCode && r.payrollCode.toLowerCase().includes(term)) ||
      (r.periodStart && r.periodStart.includes(term))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "FINALIZED":
      case "PAID":
        return (
          <Badge variant="success" className="gap-1">
            <Lock className="h-3 w-3" />
            {status}
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="info" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            APPROVED
          </Badge>
        );
      case "PENDING_APPROVAL":
        return (
          <Badge variant="warning" className="gap-1">
            <Send className="h-3 w-3" />
            PENDING APPROVAL
          </Badge>
        );
      case "CALCULATED":
        return (
          <Badge
            variant="secondary"
            className="gap-1 border-primary text-primary"
          >
            <Calculator className="h-3 w-3" />
            CALCULATED
          </Badge>
        );
      case "CALCULATING":
        return (
          <Badge variant="outline" className="animate-pulse gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            CALCULATING
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            CANCELLED
          </Badge>
        );
      default:
        return <Badge variant="secondary">DRAFT</Badge>;
    }
  };

  // Top metric totals
  const totalRuns = runs.length;
  const finalizedRuns = runs.filter((r) =>
    ["FINALIZED", "PAID"].includes(r.status),
  ).length;
  const activeRuns = runs.filter(
    (r) => !["FINALIZED", "PAID", "CANCELLED"].includes(r.status),
  ).length;
  const totalDisbursed = runs
    .filter((r) => ["FINALIZED", "PAID"].includes(r.status))
    .reduce((acc, r) => acc + Number(r.totalNet || r.netAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Runs</h1>
          <p className="text-sm text-muted-foreground">
            Manage period-based payroll lifecycles, calculations, approvals, and
            immutable payslips.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => nav("/payslips")}>
            <FileText className="h-4 w-4 mr-2" />
            View Payslips
          </Button>
          <Button onClick={() => nav("/payroll/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Process New Payroll
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              All historical & active periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active In-Flight
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {activeRuns}
            </div>
            <p className="text-xs text-muted-foreground">
              Draft / Calculated / Pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Finalized Runs
            </CardTitle>
            <Lock className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {finalizedRuns}
            </div>
            <p className="text-xs text-muted-foreground">
              Locked immutable financial snapshots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Disbursed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalDisbursed)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net salary across finalized runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-3">
              <Input
                placeholder="Search run number or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <NativeSelect
                value={yearFilter}
                onChange={setYearFilter}
                className="w-32"
              >
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </NativeSelect>
              <NativeSelect
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-44"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CALCULATED">CALCULATED</option>
                <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                <option value="APPROVED">APPROVED</option>
                <option value="FINALIZED">FINALIZED</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </NativeSelect>
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredRuns.length} of {runs.length} runs
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payroll runs found matching current filters.</p>
              <Button
                variant="link"
                onClick={() => nav("/payroll/new")}
                className="mt-2"
              >
                Launch Payroll Wizard
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run Number</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-center">Employees</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Net Salary</TableHead>
                  <TableHead>CTC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRuns.map((p: any) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => nav(`/payroll/${p.id}`)}
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      {p.runNumber || p.payrollCode}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {p.periodYear && p.periodMonth
                          ? new Date(
                              p.periodYear,
                              p.periodMonth - 1,
                            ).toLocaleString("default", {
                              month: "long",
                              year: "numeric",
                            })
                          : `${p.periodStart} → ${p.periodEnd}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.periodStart} to {p.periodEnd}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {p.employeeCount}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        Number(p.totalGross || p.grossAmount || 0),
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(Number(p.totalDeductions || 0))}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-600">
                      {formatCurrency(Number(p.totalNet || p.netAmount || 0))}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {formatCurrency(Number(p.totalCtc || 0))}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => nav(`/payroll/${p.id}`)}
                          title="View Run Details"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>

                        {/* Lifecycle action buttons */}
                        {p.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => handleCalculate(p.id, e)}
                            disabled={calcMutation.isPending}
                          >
                            <Calculator className="h-3.5 w-3.5 mr-1 text-primary" />
                            Calculate
                          </Button>
                        )}

                        {p.status === "CALCULATED" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleCalculate(p.id, e)}
                              disabled={calcMutation.isPending}
                              title="Recalculate Run"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => handleSubmit(p.id, e)}
                              disabled={submitMutation.isPending}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Submit
                            </Button>
                          </>
                        )}

                        {p.status === "PENDING_APPROVAL" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={(e) => handleApprove(p.id, e)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                        )}

                        {p.status === "APPROVED" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-indigo-600 hover:bg-indigo-700"
                            onClick={(e) => handleFinalize(p.id, e)}
                            disabled={finalizeMutation.isPending}
                          >
                            <Lock className="h-3.5 w-3.5 mr-1" />
                            Finalize
                          </Button>
                        )}

                        {["FINALIZED", "PAID"].includes(p.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              nav(
                                `/payslips?year=${p.periodYear}&month=${p.periodMonth}`,
                              )
                            }
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Payslips
                          </Button>
                        )}

                        {!["FINALIZED", "PAID", "CANCELLED"].includes(
                          p.status,
                        ) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={(e) => handleCancel(p.id, e)}
                            title="Cancel Run"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
