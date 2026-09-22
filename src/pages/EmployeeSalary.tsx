import { useState, useMemo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import {
  useEmployeeSalary,
  useEmployeeSalaryHistory,
  useAssignEmployeeSalary,
  useCancelEmployeeSalary,
  useSalaryPreview,
  useSalaryStructures,
} from '@/hooks/useSalary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { NativeSelect } from '@/components/ui/select';
import { DataGrid } from '@/components/common/DataGrid';
import type { ColDef } from 'ag-grid-community';
import {
  TrendingUp,
  History,
  Calendar,
  Layers,
  ArrowRight,
  Calculator,
  AlertCircle,
  XCircle,
  Clock,
  CheckCircle2,
  CalendarDays,
  Plus,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EmployeeSalary() {
  const { data: employeesResp, isLoading: isEmpLoading } = useEmployees({ pageSize: 100 });
  const employees = employeesResp?.data || [];

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7),
  );
  const [selectedPolicy, setSelectedPolicy] = useState<string>('CALENDAR_DAYS');

  // Set default employee when loaded
  const currentEmployee = useMemo(() => {
    if (selectedEmpId) return employees.find((e) => e.id === selectedEmpId);
    return employees[0] || null;
  }, [employees, selectedEmpId]);

  const activeEmpId = currentEmployee?.id;

  // Salary Queries
  const { data: currentSalaryResp, isLoading: isSalLoading } = useEmployeeSalary(activeEmpId);
  const { data: historyResp = [] } = useEmployeeSalaryHistory(activeEmpId);
  const historyData: any[] = (historyResp as any)?.data || historyResp || [];
  const { data: rawPreviewData } = useSalaryPreview(activeEmpId, {
    month: selectedMonth,
    policy: selectedPolicy,
  });
  const previewData: any = (rawPreviewData as any)?.data || rawPreviewData;
  const { data: structuresResp } = useSalaryStructures({ limit: 100 });

  const structures = structuresResp?.data || [];
  const currentSalary: any = (currentSalaryResp as any)?.data !== undefined
    ? (currentSalaryResp as any).data
    : currentSalaryResp;

  // Revision Modal State
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionStructureId, setRevisionStructureId] = useState('');
  const [revisionEffectiveFrom, setRevisionEffectiveFrom] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [revisionReason, setRevisionReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');

  // Cancel Modal State
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Mutations
  const assignMutation = useAssignEmployeeSalary();
  const cancelMutation = useCancelEmployeeSalary();

  // Selected structure for revision comparison
  const previewStructure = useMemo(() => {
    return structures.find((s) => s.id === revisionStructureId);
  }, [structures, revisionStructureId]);

  const handleOpenRevision = () => {
    setRevisionStructureId(currentSalary?.structure?.id || structures[0]?.id || '');
    setRevisionEffectiveFrom(new Date().toISOString().slice(0, 10));
    setRevisionReason('');
    setRevisionNotes('');
    setIsRevisionOpen(true);
  };

  const handleSaveRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmpId || !revisionStructureId) return;

    await assignMutation.mutateAsync({
      employeeId: activeEmpId,
      data: {
        salaryStructureId: revisionStructureId,
        effectiveFrom: revisionEffectiveFrom,
        reason: revisionReason.trim() || undefined,
        notes: revisionNotes.trim() || undefined,
      },
    });

    setIsRevisionOpen(false);
  };

  const handleCancelAssignment = async () => {
    if (!activeEmpId || !cancelTargetId) return;
    await cancelMutation.mutateAsync({
      employeeId: activeEmpId,
      salaryId: cancelTargetId,
      reason: cancelReason.trim() || undefined,
    });
    setCancelTargetId(null);
    setCancelReason('');
  };

  const earningsColDefs = useMemo<ColDef[]>(() => [
    {
      field: "name",
      headerName: "Component",
      flex: 1,
      cellRenderer: (p: any) => (
        <div className="flex flex-col justify-center h-full">
          <div className="font-medium text-sm leading-tight">{p.value}</div>
          <div className="text-xs font-mono text-muted-foreground leading-tight">{p.data.code}</div>
        </div>
      )
    },
    {
      field: "calculationType",
      headerName: "Calculation",
      width: 200,
      cellClass: "text-xs text-muted-foreground",
      valueGetter: (p) => p.value === 'PERCENTAGE' ? `${p.data.percentage}% of ${p.data.percentageOf || 'BASIC'}` : p.value
    },
    {
      field: "amount",
      headerName: "Monthly Amount",
      width: 150,
      cellClass: "text-right font-medium text-sm flex justify-end",
      valueFormatter: (p) => formatCurrency(p.value)
    }
  ], []);

  const deductionsColDefs = useMemo<ColDef[]>(() => [
    {
      field: "name",
      headerName: "Component",
      flex: 1,
      cellRenderer: (p: any) => (
        <div className="flex flex-col justify-center h-full">
          <div className="font-medium text-sm leading-tight">{p.value}</div>
          <div className="text-xs font-mono text-muted-foreground leading-tight">{p.data.code}</div>
        </div>
      )
    },
    {
      field: "type",
      headerName: "Type",
      width: 150,
      cellRenderer: (p: any) => (
        <Badge variant={p.data.isEmployerContribution ? "secondary" : "destructive"} className="text-[10px]">
          {p.data.isEmployerContribution ? "Employer PF/ESI" : "Deduction"}
        </Badge>
      )
    },
    {
      field: "amount",
      headerName: "Monthly Amount",
      width: 150,
      cellClass: (p) => p.data.isEmployerContribution ? "text-right font-medium text-sm text-muted-foreground flex justify-end" : "text-right font-medium text-sm text-destructive flex justify-end",
      valueFormatter: (p) => p.data.isEmployerContribution ? formatCurrency(p.value) : `-${formatCurrency(p.value)}`
    }
  ], []);

  const combinedDeductions = useMemo(() => {
    if (!currentSalary) return [];
    const deds = (currentSalary.deductions || []).map((d: any) => ({ ...d, isEmployerContribution: false }));
    const emps = (currentSalary.employerContributions || []).map((c: any) => ({ ...c, isEmployerContribution: true }));
    return [...deds, ...emps];
  }, [currentSalary]);

  const historyColDefs = useMemo<ColDef[]>(() => [
    {
      field: "effectiveFrom",
      headerName: "Effective Period",
      width: 220,
      cellClass: "text-xs font-medium",
      cellRenderer: (p: any) => (
        <div className="flex items-center gap-1.5 h-full">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          {p.value} {p.data.effectiveTo ? `→ ${p.data.effectiveTo}` : '→ Present'}
        </div>
      )
    },
    {
      field: "salaryStructure",
      headerName: "Structure",
      flex: 1,
      cellRenderer: (p: any) => (
        <div className="flex flex-col justify-center h-full">
          <div className="font-medium text-sm leading-tight">{p.value?.name}</div>
          <div className="font-mono text-xs text-muted-foreground leading-tight">{p.value?.code}</div>
        </div>
      )
    },
    {
      field: "grossSalary",
      headerName: "Gross Salary",
      width: 150,
      cellClass: "font-medium text-sm",
      valueFormatter: (p) => p.value ? formatCurrency(Number(p.value)) : '—'
    },
    {
      field: "annualCtc",
      headerName: "Annual CTC",
      width: 150,
      cellClass: "font-medium text-sm",
      valueFormatter: (p) => p.value ? formatCurrency(Number(p.value)) : '—'
    },
    {
      field: "reason",
      headerName: "Reason / Notes",
      flex: 1,
      cellClass: "text-xs text-muted-foreground truncate",
      valueGetter: (p) => p.data.reason || p.data.notes || '—'
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      cellRenderer: (p: any) => (
        <Badge
          variant={
            p.value === 'ACTIVE'
              ? 'success'
              : p.value === 'HISTORICAL'
              ? 'secondary'
              : 'destructive'
          }
          className="text-xs"
        >
          {p.value}
        </Badge>
      )
    },
    {
      headerName: "Actions",
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => {
        if (p.data.status === 'CANCELLED') return null;
        return (
          <div className="flex justify-end h-full items-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:bg-destructive/10"
              onClick={() => setCancelTargetId(p.data.id)}
            >
              Cancel
            </Button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-6">
      {/* Header & Employee Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Salary Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage versioned employee salary assignments, view CTC breakdowns, and preview attendance-linked payouts.
          </p>
        </div>

        {/* Employee Switcher */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Label className="text-xs font-semibold whitespace-nowrap text-muted-foreground">
            Select Employee:
          </Label>
          <NativeSelect
            value={currentEmployee?.id || ''}
            onChange={(id) => setSelectedEmpId(id)}
            className="w-full sm:w-72 bg-card font-medium text-xs"
          >
            {employees.map((em) => (
              <option key={em.id} value={em.id}>
                {em.firstName} {em.lastName} ({em.employeeCode || (em as any).employeeId})
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      {/* Employee Quick Banner */}
      {currentEmployee && (
        <Card className="border bg-muted/20 shadow-xs">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base">
                {currentEmployee.firstName[0]}
                {currentEmployee.lastName[0]}
              </div>
              <div>
                <div className="font-semibold text-base flex items-center gap-2">
                  {currentEmployee.firstName} {currentEmployee.lastName}
                  <Badge variant="outline" className="text-xs font-mono">
                    {currentEmployee.employeeCode || (currentEmployee as any).employeeId}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {currentEmployee.designation?.name || currentEmployee.designation || 'Designation'} •{' '}
                  {currentEmployee.department?.name || currentEmployee.department || 'Department'} • Joined{' '}
                  {formatDate(currentEmployee.joiningDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={handleOpenRevision} className="shadow-xs">
                <TrendingUp className="h-4 w-4 mr-1.5" /> Revise Salary
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="current" className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" /> Current Salary & Breakdown
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-1.5">
            <Calculator className="h-4 w-4" /> Attendance & Leave Preview
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5">
            <History className="h-4 w-4" /> Salary History & Versions ({historyData.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Current Salary */}
        <TabsContent value="current" className="space-y-6 m-0">
          {isSalLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading salary configuration...</div>
          ) : !currentSalary ? (
            <Card className="p-12 text-center text-muted-foreground border-dashed">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-40 text-amber-500" />
              <h3 className="font-semibold text-foreground text-base">No Active Salary Structure</h3>
              <p className="text-sm mt-1">This employee has not been assigned a salary structure yet.</p>
              <Button onClick={handleOpenRevision} className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Assign Salary Structure
              </Button>
            </Card>
          ) : (
            <>
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border shadow-xs">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground font-medium">Monthly Gross</div>
                    <div className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(currentSalary.totals.gross)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Annual: {formatCurrency(currentSalary.totals.annualGross)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground font-medium">Monthly Deductions</div>
                    <div className="text-2xl font-bold text-destructive mt-1">
                      {formatCurrency(currentSalary.totals.deductions)}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Statutory & company deductions
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs bg-emerald-50/50 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="text-xs text-emerald-700 font-medium">Net Take-Home</div>
                    <div className="text-2xl font-bold text-emerald-900 mt-1">
                      {formatCurrency(currentSalary.totals.net)}
                    </div>
                    <div className="text-[11px] text-emerald-600 mt-1">
                      Estimated base net salary
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="text-xs text-primary font-medium">Total CTC (Cost to Co.)</div>
                    <div className="text-2xl font-bold text-primary mt-1">
                      {formatCurrency(currentSalary.totals.monthlyCtc)}
                    </div>
                    <div className="text-[11px] text-primary/70 mt-1">
                      Annual: {formatCurrency(currentSalary.totals.annualCtc)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Breakdown Details */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Earnings Card */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-emerald-700 font-semibold">Earnings</CardTitle>
                    <Badge variant="outline" className="text-xs font-semibold">
                      Total: {formatCurrency(currentSalary.totals.gross)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[300px]">
                      <DataGrid rowData={currentSalary.earnings || []} columnDefs={earningsColDefs} />
                    </div>
                  </CardContent>
                </Card>

                {/* Deductions & Contributions Card */}
                <Card className="border shadow-sm">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-destructive font-semibold">
                      Deductions & Employer Contributions
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-semibold">
                      Ded: {formatCurrency(currentSalary.totals.deductions)}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[300px]">
                      <DataGrid rowData={combinedDeductions} columnDefs={deductionsColDefs} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Attendance & Leave Salary Preview */}
        <TabsContent value="preview" className="space-y-6 m-0">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" /> Monthly Attendance Payout Preview
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calculates estimated payable salary based on real recorded working days, approved paid leaves, and loss of pay.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground">Payroll Month</Label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-8 text-xs w-36"
                  />
                </div>

                <div>
                  <Label className="text-[11px] text-muted-foreground">Calculation Policy</Label>
                  <NativeSelect
                    value={selectedPolicy}
                    onChange={(p) => setSelectedPolicy(p)}
                    className="h-8 text-xs w-40"
                  >
                    <option value="CALENDAR_DAYS">Calendar Days Basis</option>
                    <option value="WORKING_DAYS">Working Days Basis</option>
                    <option value="FIXED_MONTHLY">Fixed Monthly Basis</option>
                  </NativeSelect>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {previewData ? (
                <>
                  {/* Attendance & Leave Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <div className="p-3 bg-muted/40 rounded-xl border">
                      <div className="text-[11px] text-muted-foreground">Calendar Days</div>
                      <div className="text-xl font-bold">{previewData.attendanceSummary.calendarDays}</div>
                    </div>

                    <div className="p-3 bg-muted/40 rounded-xl border">
                      <div className="text-[11px] text-muted-foreground">Working Days</div>
                      <div className="text-xl font-bold text-primary">
                        {previewData.attendanceSummary.workingDays}
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="text-[11px] text-emerald-700">Present Days</div>
                      <div className="text-xl font-bold text-emerald-900">
                        {previewData.attendanceSummary.presentDays}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-[11px] text-blue-700">Paid Leaves</div>
                      <div className="text-xl font-bold text-blue-900">
                        {previewData.leaveSummary.paidLeaveDays}
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                      <div className="text-[11px] text-rose-700">Unpaid / LOP</div>
                      <div className="text-xl font-bold text-rose-900">
                        {previewData.leaveSummary.unpaidLeaveDays}
                      </div>
                    </div>

                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="text-[11px] text-primary font-semibold">Total Paid Days</div>
                      <div className="text-xl font-bold text-primary">
                        {previewData.paidDays} / {previewData.attendanceSummary.calendarDays}
                      </div>
                    </div>
                  </div>

                  {/* Payout Comparison Banner */}
                  <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-semibold text-sm">Estimated Payout ({selectedMonth})</h4>
                        <p className="text-xs text-muted-foreground">
                          Payable Factor: {(previewData.payableFactor * 100).toFixed(1)}% applied
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono">
                        Policy: {previewData.salaryPolicy}
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Base Gross Salary</div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {formatCurrency(previewData.baseSalary.gross)}
                        </div>
                        <div className="text-xs text-muted-foreground pt-1">Estimated Payable Gross:</div>
                        <div className="text-xl font-bold text-foreground">
                          {formatCurrency(previewData.estimatedPayable.payableGross)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Base Deductions</div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {formatCurrency(previewData.baseSalary.deductions)}
                        </div>
                        <div className="text-xs text-muted-foreground pt-1">Estimated Deductions:</div>
                        <div className="text-xl font-bold text-destructive">
                          {formatCurrency(previewData.estimatedPayable.payableDeductions)}
                        </div>
                      </div>

                      <div className="space-y-1 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                        <div className="text-xs text-emerald-700 font-semibold">Estimated Net Payout</div>
                        <div className="text-2xl font-extrabold text-emerald-900">
                          {formatCurrency(previewData.estimatedPayable.payableNet)}
                        </div>
                        <div className="text-[11px] text-emerald-600">
                          Ready to be processed by Payroll
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  Computing monthly attendance simulation...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Salary History */}
        <TabsContent value="history" className="space-y-4 m-0">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Salary Version History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {historyData.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No salary history found for this employee.
                </div>
              ) : (
                <div className="h-[400px]">
                  <DataGrid rowData={historyData} columnDefs={historyColDefs} />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Salary Revision Dialog with Before / After Comparison */}
      <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
        <DialogContent className="max-w-2xl" onClose={() => setIsRevisionOpen(false)}>
          <DialogHeader>
            <DialogTitle>Revise Employee Salary</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveRevision} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>New Salary Structure *</Label>
                <NativeSelect
                  value={revisionStructureId}
                  onChange={(val) => setRevisionStructureId(val)}
                  required
                >
                  {structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="effDate">Effective From *</Label>
                <Input
                  id="effDate"
                  type="date"
                  value={revisionEffectiveFrom}
                  onChange={(e) => setRevisionEffectiveFrom(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="revReason">Revision Reason</Label>
                <Input
                  id="revReason"
                  placeholder="e.g. Annual Appraisal, Promotion"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="revNotes">Notes / Remarks</Label>
                <Input
                  id="revNotes"
                  placeholder="Optional internal remarks"
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Before vs After Comparison Card */}
            <div className="rounded-xl border bg-muted/20 p-4 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>Salary Impact Comparison</span>
                <Badge variant="outline" className="text-[10px]">
                  Effective {revisionEffectiveFrom}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-card rounded-lg border space-y-1">
                  <div className="text-xs text-muted-foreground">Current Gross Salary</div>
                  <div className="text-lg font-bold">
                    {currentSalary ? formatCurrency(currentSalary.totals.gross) : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Current CTC:{' '}
                    <strong>
                      {currentSalary ? formatCurrency(currentSalary.totals.monthlyCtc) : '—'}
                    </strong>
                  </div>
                </div>

                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-1">
                  <div className="text-xs text-primary font-medium">Selected Structure</div>
                  <div className="text-sm font-semibold text-foreground truncate">
                    {previewStructure?.name || 'New Structure'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Contains {(previewStructure?.components || []).length} configured components
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRevisionOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignMutation.isPending}>
                {assignMutation.isPending ? 'Saving Revision...' : 'Confirm & Save Revision'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Cancel Salary Dialog */}
      <Dialog open={Boolean(cancelTargetId)} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent className="max-w-md" onClose={() => setCancelTargetId(null)}>
          <DialogHeader>
            <DialogTitle>Cancel Salary Assignment</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            <p className="text-muted-foreground">
              Are you sure you want to cancel this salary assignment version? The status will be set to CANCELLED and any previously closed predecessor will be restored to ACTIVE.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="cancelReason">Cancellation Reason</Label>
              <Input
                id="cancelReason"
                placeholder="Reason for cancellation"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTargetId(null)}>
              Keep Assignment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelAssignment}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
