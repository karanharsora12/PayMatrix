import { payslipsApi } from "@/api/payslips";
import { ActionMenu } from "@/components/common/ActionMenu";
import { DataGrid } from "@/components/common/DataGrid";
import { ListingCard } from "@/components/common/ListingCard";
import { ListingHeader } from "@/components/common/ListingHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useCalculatePayslipPreview,
  useGenerateSinglePayslip,
  usePayslip,
  usePayslips,
  useRetryPayslipEmail,
} from "@/hooks/usePayslips";
import { gridExportExcel, gridExportPdf, gridPrint } from "@/lib/gridExport";
import { formatCurrency } from "@/lib/utils";
import type { ColDef } from "ag-grid-community";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Lock,
  Mail,
  Printer,
  RefreshCw,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

// Helper to convert number to words for financial slip
function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 !== 0 ? " and " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
    );
  }

  const intPart = Math.floor(num);
  return `${inWords(intPart)} Rupees Only`;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Payslip() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(
    id || null,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>(
    searchParams.get("year") || "ALL",
  );
  const [monthFilter, setMonthFilter] = useState<string>(
    searchParams.get("month") || "ALL",
  );

  // Modal State for Generating/Previewing Payslip
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [targetEmployeeId, setTargetEmployeeId] = useState<string>("");
  const [targetYear, setTargetYear] = useState<number>(
    new Date().getFullYear(),
  );
  const [targetMonth, setTargetMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [targetPolicy, setTargetPolicy] = useState<string>("CALENDAR_DAYS");
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<"salary" | "timeline">("salary");
  const [showVoucherTimeline, setShowVoucherTimeline] = useState(false);

  // Queries & Mutations
  const queryParams: any = { page: 1, limit: 100 };
  if (yearFilter !== "ALL") queryParams.year = parseInt(yearFilter, 10);
  if (monthFilter !== "ALL") queryParams.month = parseInt(monthFilter, 10);

  const {
    data: listData,
    isLoading: isListLoading,
    refetch,
  } = usePayslips(queryParams);
  const { data: detailData, isLoading: isDetailLoading } = usePayslip(
    selectedPayslipId || "",
  );
  const gridRef = useRef<any>(null);
  const { data: employeesData } = useEmployees({ pageSize: 200, page: 1 });

  const calculatePreviewMutation = useCalculatePayslipPreview();
  const generateSingleMutation = useGenerateSinglePayslip();
  const retryEmailMutation = useRetryPayslipEmail();

  const payslipsList: any[] = (listData as any)?.data || listData || [];
  const payslip = (detailData as any)?.data ?? detailData;
  const employees: any[] = (employeesData as any)?.data || employeesData || [];

  const handleDownloadPdf = async (payslipId: string, filename?: string) => {
    try {
      toast.info("Generating PDF", {
        description: "Preparing official payslip PDF document...",
      });
      await payslipsApi.downloadPdf(payslipId, filename);
      toast.success("Download Complete", {
        description: "Payslip PDF downloaded successfully.",
      });
    } catch (err: any) {
      toast.error("Download Failed", {
        description: err.message || "Failed to download payslip PDF",
      });
    }
  };

  const handleCalculatePreview = async () => {
    if (!targetEmployeeId) {
      toast.error("Missing Selection", {
        description: "Please select an employee to calculate.",
      });
      return;
    }
    try {
      const res = await calculatePreviewMutation.mutateAsync({
        employeeId: targetEmployeeId,
        year: targetYear,
        month: targetMonth,
        policy: targetPolicy,
      });
      setPreviewData(res);
      setPreviewTab("salary");
    } catch {
      // Error handled by hook toast
    }
  };

  const handleSaveAndFinalize = async () => {
    if (!targetEmployeeId) return;
    try {
      const res = await generateSingleMutation.mutateAsync({
        employeeId: targetEmployeeId,
        year: targetYear,
        month: targetMonth,
        policy: targetPolicy,
      });
      setIsGenerateModalOpen(false);
      setPreviewData(null);
      if (res?.id) {
        setSelectedPayslipId(res.id);
      }
    } catch {
      // Error handled by hook toast
    }
  };

  const filteredList = payslipsList.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.payslipNumber && p.payslipNumber.toLowerCase().includes(term)) ||
      (p.employeeName && p.employeeName.toLowerCase().includes(term)) ||
      (p.employeeCode && p.employeeCode.toLowerCase().includes(term)) ||
      (p.departmentName && p.departmentName.toLowerCase().includes(term))
    );
  });

  const payslipColDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "payslipNumber",
        headerName: "Payslip Number",
        width: 150,
      },
      {
        field: "employeeName",
        headerName: "Employee",
        width: 150,
      },
      {
        field: "period",
        headerName: "Period",
        width: 100,
        valueGetter: (p) =>
          p.data.periodYear && p.data.periodMonth
            ? `${MONTH_NAMES[p.data.periodMonth - 1]?.slice(0, 3)} ${p.data.periodYear}`
            : "—",
      },
      {
        field: "grossSalary",
        headerName: "Gross Salary",
        width: 130,
        cellClass: "text-right flex items-center justify-end",
        valueFormatter: (p) => formatCurrency(Number(p.value)),
      },
      {
        field: "totalDeductions",
        headerName: "Deductions",
        width: 130,
        cellClass: "text-right text-rose-600 flex items-center justify-end",
        valueFormatter: (p) => formatCurrency(Number(p.value)),
      },
      {
        field: "netSalary",
        headerName: "Net Salary",
        width: 140,
        cellClass: "text-right text-emerald-600 flex items-center justify-end",
        valueFormatter: (p) => formatCurrency(Number(p.value)),
      },
      {
        field: "status",
        headerName: "Snapshot Status",
        width: 140,
        cellClass: "text-center flex items-center justify-center",
        cellRenderer: (p: any) => (
          <Badge
            variant={
              p.value === "PUBLISHED" || p.value === "SENT"
                ? "default"
                : "outline"
            }
            className={`text-[10px] gap-1 ${
              p.value === "PUBLISHED" || p.value === "SENT"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "border-slate-300 text-slate-700 dark:text-slate-300"
            }`}
          >
            {p.value === "PUBLISHED" || p.value === "SENT" ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Lock className="h-2.5 w-2.5" />
            )}
            {p.value === "PUBLISHED" || p.value === "SENT"
              ? "Email Sent"
              : "Locked Snapshot"}
          </Badge>
        ),
      },
      {
        headerName: "Actions",
        width: 80,
        sortable: false,
        filter: false,
        cellClass: "flex items-center justify-center",
        cellRenderer: (p: any) => (
          <ActionMenu
            orientation="horizontal"
            items={[
              {
                label: "View Slip",
                icon: <Eye className="h-3.5 w-3.5" />,
                onClick: () => setSelectedPayslipId(p.data.id),
              },
              {
                label: "Download PDF",
                icon: <Download className="h-3.5 w-3.5" />,
                onClick: () =>
                  handleDownloadPdf(
                    p.data.id,
                    `Payslip_${p.data.employeeCode}_${p.data.periodMonth}_${p.data.periodYear}.pdf`,
                  ),
              },
              {
                label:
                  p.data.status === "PUBLISHED" || p.data.status === "SENT"
                    ? "Resend Email"
                    : "Send Email",
                icon: <Mail className="h-3.5 w-3.5" />,
                onClick: () => retryEmailMutation.mutate(p.data.id),
                disabled: retryEmailMutation.isPending,
              },
            ]}
          />
        ),
      },
    ],
    [retryEmailMutation.isPending],
  );

  const handlePrint = () => {
    window.print();
  };

  // ================= VIEW: INDIVIDUAL PAYSLIP SNAPSHOT =================
  if (selectedPayslipId && payslip) {
    const monthName = new Date(
      payslip.periodYear,
      payslip.periodMonth - 1,
    ).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="max-w-4xl mx-auto space-y-4 pb-12 print:max-w-none print:p-0 print:m-0">
        {/* Top Control Bar (hidden on print) */}
        <div className="flex items-center justify-between gap-2 print:hidden bg-card p-3 rounded-lg border shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedPayslipId(null)}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Payslip List
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => retryEmailMutation.mutate(selectedPayslipId)}
              disabled={retryEmailMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-1.5" />
              {retryEmailMutation.isPending
                ? "Sending..."
                : payslip.status === "PUBLISHED" || payslip.status === "SENT"
                  ? "Resend Email"
                  : "Send Email"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleDownloadPdf(
                  selectedPayslipId,
                  `Payslip_${payslip.employee?.code || "EMP"}_${payslip.periodMonth}_${payslip.periodYear}.pdf`,
                )
              }
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <Card className="overflow-hidden shadow-lg border border-border print:border-none print:shadow-none bg-card print:bg-white print:text-black">
          {/* Company & Period Header */}
          <div className="bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {payslip.company?.legalName ||
                  payslip.company?.name ||
                  "PayMatrix Technologies Pvt Ltd"}
              </div>
              <div className="text-xs opacity-80 mt-1 max-w-md">
                {payslip.company?.address ||
                  "Headquarters • Corporate Financial Division"}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs uppercase tracking-wider opacity-80">
                Salary Slip for
              </div>
              <div className="text-lg font-bold">{monthName}</div>
              <div className="font-mono text-xs opacity-90 mt-0.5">
                {payslip.payslipNumber}
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Employee Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20 text-xs">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-foreground">
                  {payslip.employee?.name}
                </div>
                <div className="text-muted-foreground">
                  Employee Code:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {payslip.employee?.code}
                  </span>
                </div>
                <div>
                  Department:{" "}
                  <span className="font-medium">
                    {payslip.employee?.department || "General"}
                  </span>
                </div>
                <div>
                  Designation:{" "}
                  <span className="font-medium">
                    {payslip.employee?.designation || "Staff"}
                  </span>
                </div>
                {payslip.employee?.joiningDate && (
                  <div>
                    Joining Date:{" "}
                    <span className="font-medium">
                      {payslip.employee.joiningDate}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 md:text-right">
                {payslip.employee?.bankAccount ? (
                  <div>
                    Bank:{" "}
                    <span className="font-medium">
                      {payslip.employee.bankAccount.bankName} •{" "}
                      {payslip.employee.bankAccount.accountNumber}
                    </span>
                    <div className="text-[11px] text-muted-foreground">
                      IFSC: {payslip.employee.bankAccount.ifscCode}
                    </div>
                  </div>
                ) : (
                  <div>
                    Bank: <span className="font-medium">Direct Deposit</span>
                  </div>
                )}
                {payslip.employee?.statutory?.panNumber && (
                  <div>
                    PAN:{" "}
                    <span className="font-mono font-medium">
                      {payslip.employee.statutory.panNumber}
                    </span>
                  </div>
                )}
                {payslip.employee?.statutory?.uanNumber && (
                  <div>
                    UAN:{" "}
                    <span className="font-mono font-medium">
                      {payslip.employee.statutory.uanNumber}
                    </span>
                  </div>
                )}
                <div className="text-emerald-600 font-semibold">
                  Paid Days: {payslip.attendance?.paidDays} /{" "}
                  {payslip.attendance?.calendarDays}
                </div>
              </div>
            </div>

            {/* Attendance Snapshot Summary Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs border p-3 rounded-lg bg-muted/10">
              <div>
                <div className="text-[10px] text-muted-foreground">
                  Working Days
                </div>
                <div className="font-bold">
                  {payslip.attendance?.workingDays || 22}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Present</div>
                <div className="font-bold">
                  {payslip.attendance?.presentDays || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">
                  Paid Leave
                </div>
                <div className="font-bold">
                  {payslip.attendance?.paidLeaveDays || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">
                  Unpaid LOP
                </div>
                <div className="font-bold text-rose-600">
                  {payslip.attendance?.unpaidLeaveDays || 0}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Absent</div>
                <div className="font-bold text-rose-600">
                  {payslip.attendance?.absentDays || 0}
                </div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded p-0.5 border border-emerald-300">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300">
                  Total Paid Days
                </div>
                <div className="font-bold text-emerald-600">
                  {payslip.attendance?.paidDays || 0}
                </div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Column */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-bold text-sm border-b pb-2 flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-2 text-xs">
                  {payslip.earnings?.map((e: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 border-b border-muted/50 last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {e.componentName ||
                          e.salaryComponent?.name ||
                          e.componentCode}
                      </span>
                      <span className="font-medium font-mono">
                        {formatCurrency(Number(e.amount))}
                      </span>
                    </div>
                  ))}
                  {(!payslip.earnings || payslip.earnings.length === 0) && (
                    <div className="text-muted-foreground text-center py-4 text-xs">
                      No earnings configured
                    </div>
                  )}
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-xs bg-muted/20 p-2 rounded">
                  <span>Total Gross Earnings</span>
                  <span className="font-mono">
                    {formatCurrency(payslip.totals?.grossSalary || 0)}
                  </span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-bold text-sm border-b pb-2 flex justify-between text-rose-600">
                  <span>Deduction Component</span>
                  <span>Amount</span>
                </div>
                <div className="space-y-2 text-xs">
                  {payslip.deductions?.map((d: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 border-b border-muted/50 last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {d.componentName ||
                          d.salaryComponent?.name ||
                          d.componentCode}
                      </span>
                      <span className="font-medium font-mono text-rose-600">
                        {formatCurrency(Number(d.amount))}
                      </span>
                    </div>
                  ))}
                  {(!payslip.deductions || payslip.deductions.length === 0) && (
                    <div className="text-muted-foreground text-center py-4 text-xs">
                      No deductions applied
                    </div>
                  )}
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-xs bg-muted/20 p-2 rounded text-rose-600">
                  <span>Total Deductions</span>
                  <span className="font-mono">
                    {formatCurrency(payslip.totals?.totalDeductions || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Payable Banner */}
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Net Salary Payable
                </div>
                <div className="text-xs text-muted-foreground italic mt-0.5">
                  {numberToWords(payslip.totals?.netSalary || 0)}
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(payslip.totals?.netSalary || 0)}
              </div>
            </div>

            {/* Snapshot Locking Disclaimer */}
            <div className="text-center text-[11px] text-muted-foreground border-t pt-4 space-y-1">
              <div className="flex items-center justify-center gap-1 text-slate-500">
                <Lock className="h-3 w-3" />
                This payslip is an immutable snapshot locked on{" "}
                {new Date(payslip.generatedAt).toLocaleDateString("en-IN")}.
              </div>
              <div>
                Electronically generated statement • Official record for
                PayMatrix Technologies
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ListingCard>
      <ListingHeader
        title="Payslips"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={() => {
          setIsGenerateModalOpen(true);
          setPreviewData(null);
        }}
        addButtonText="Generate Payslip"
        onRefresh={refetch}
        onExportExcel={() =>
          gridRef.current?.api &&
          gridExportExcel(gridRef.current.api, "payslips.csv")
        }
        onExportPdf={() =>
          gridRef.current?.api && gridExportPdf(gridRef.current.api, "Payslips")
        }
        onPrint={() =>
          gridRef.current?.api && gridPrint(gridRef.current.api, "Payslips")
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <NativeSelect
          value={yearFilter}
          onChange={(val) => setYearFilter(val)}
          className="w-32 h-8 text-xs bg-background border-input"
        >
          <option value="ALL">All Years</option>
          <option value="2027">2027</option>
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </NativeSelect>

        <NativeSelect
          value={monthFilter}
          onChange={(val) => setMonthFilter(val)}
          className="w-36 h-8 text-xs bg-background border-input"
        >
          <option value="ALL">All Months</option>
          {MONTH_NAMES.map((m, idx) => (
            <option key={idx + 1} value={String(idx + 1)}>
              {m}
            </option>
          ))}
        </NativeSelect>

        {(yearFilter !== "ALL" || monthFilter !== "ALL" || searchTerm) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearchTerm("");
              setYearFilter("ALL");
              setMonthFilter("ALL");
            }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      <div className="h-[600px] w-full">
        <DataGrid
          ref={gridRef}
          rowData={filteredList}
          columnDefs={payslipColDefs}
        />
      </div>

      {/* ================= INTERACTIVE GENERATE / PREVIEW MODAL ================= */}
      <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5 text-primary" />
              Generate Employee Payslip
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select an employee and payroll period to calculate live
              attendance, leave proration, and salary components before
              finalization.
            </DialogDescription>
          </DialogHeader>

          {/* Form Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-muted/20 p-4 rounded-lg border">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Select Employee *
              </label>
              <NativeSelect
                value={targetEmployeeId}
                onChange={(val) => {
                  setTargetEmployeeId(val);
                  setPreviewData(null);
                }}
                className="text-xs h-9 w-full"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.employeeCode} - {emp.firstName} {emp.lastName} (
                    {emp.department?.name || "Staff"})
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Payroll Year *
              </label>
              <NativeSelect
                value={String(targetYear)}
                onChange={(val) => {
                  setTargetYear(Number(val));
                  setPreviewData(null);
                }}
                className="text-xs h-9 w-full"
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </NativeSelect>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                Payroll Month *
              </label>
              <NativeSelect
                value={String(targetMonth)}
                onChange={(val) => {
                  setTargetMonth(Number(val));
                  setPreviewData(null);
                }}
                className="text-xs h-9 w-full"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleCalculatePreview}
                disabled={
                  !targetEmployeeId || calculatePreviewMutation.isPending
                }
                className="w-full h-9 text-xs gap-1.5 shadow-sm"
              >
                {calculatePreviewMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Calculator className="h-3.5 w-3.5" />
                )}
                {calculatePreviewMutation.isPending
                  ? "Calculating..."
                  : "Calculate Preview"}
              </Button>
            </div>
          </div>

          {/* Live Preview Display */}
          {previewData && (
            <div className="space-y-4 pt-2">
              {/* Duplicate / Finalized Alert Banner */}
              {previewData.alreadyFinalized && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-amber-900 dark:text-amber-200 p-3 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                  <div>
                    A finalized payslip (
                    <strong>{previewData.existingPayslipNumber}</strong>)
                    already exists for this employee for{" "}
                    {previewData.period?.monthName}. To protect historical
                    payroll accuracy, duplicate payslips cannot be finalized.
                  </div>
                </div>
              )}

              {/* KPI Summary Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-center text-xs">
                <div className="border p-2 rounded-lg bg-card shadow-sm">
                  <div className="text-[10px] text-muted-foreground">
                    Calendar Days
                  </div>
                  <div className="text-sm font-bold">
                    {previewData.attendance?.calendarDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm">
                  <div className="text-[10px] text-muted-foreground">
                    Present Days
                  </div>
                  <div className="text-sm font-bold text-primary">
                    {previewData.attendance?.presentDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm">
                  <div className="text-[10px] text-muted-foreground">
                    Paid Leaves
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    {previewData.attendance?.paidLeaveDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm">
                  <div className="text-[10px] text-muted-foreground">
                    Unpaid LOP
                  </div>
                  <div className="text-sm font-bold text-rose-600">
                    {previewData.attendance?.unpaidLeaveDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm">
                  <div className="text-[10px] text-muted-foreground">
                    Absent
                  </div>
                  <div className="text-sm font-bold text-rose-600">
                    {previewData.attendance?.absentDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                    Payable Days
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    {previewData.attendance?.paidDays}
                  </div>
                </div>
                <div className="border p-2 rounded-lg bg-card shadow-sm border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40">
                  <div className="text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                    Net Salary
                  </div>
                  <div className="text-sm font-bold text-emerald-600 font-mono">
                    {formatCurrency(previewData.totals?.netSalary || 0)}
                  </div>
                </div>
              </div>

              {/* View Tabs: Salary Breakdown vs Daily Reconciliation Timeline */}
              <div className="flex border-b text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab("salary")}
                  className={`pb-2 px-4 font-semibold border-b-2 transition-colors ${
                    previewTab === "salary"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Salary Components Breakdown
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("timeline")}
                  className={`pb-2 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                    previewTab === "timeline"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Attendance & Leave Daily Audit (
                  {previewData.attendance?.dailyTimeline?.length || 0} Days)
                </button>
              </div>

              {/* TAB 1: SALARY BREAKDOWN */}
              {previewTab === "salary" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border rounded-lg p-3 space-y-2 bg-card">
                    <div className="text-xs font-bold border-b pb-1.5 flex justify-between">
                      <span>Earnings Component</span>
                      <span>Prorated Amount</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {previewData.earnings?.map((e: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between py-0.5 border-b border-muted/40 last:border-0"
                        >
                          <span className="text-muted-foreground">
                            {e.componentName}
                            {e.isProratable && (
                              <span className="text-[10px] text-slate-400 ml-1">
                                (prorated)
                              </span>
                            )}
                          </span>
                          <span className="font-mono font-medium">
                            {formatCurrency(e.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-1.5 flex justify-between font-bold text-xs bg-muted/20 p-1.5 rounded">
                      <span>Total Gross Earnings</span>
                      <span className="font-mono">
                        {formatCurrency(previewData.totals?.grossSalary || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border rounded-lg p-3 space-y-2 bg-card">
                    <div className="text-xs font-bold border-b pb-1.5 flex justify-between text-rose-600">
                      <span>Deduction Component</span>
                      <span>Amount</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {previewData.deductions?.map((d: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between py-0.5 border-b border-muted/40 last:border-0"
                        >
                          <span className="text-muted-foreground">
                            {d.componentName}
                          </span>
                          <span className="font-mono font-medium text-rose-600">
                            {formatCurrency(d.amount)}
                          </span>
                        </div>
                      ))}
                      {(!previewData.deductions ||
                        previewData.deductions.length === 0) && (
                        <div className="text-muted-foreground text-center py-4 text-xs">
                          No deductions applicable
                        </div>
                      )}
                    </div>
                    <div className="border-t pt-1.5 flex justify-between font-bold text-xs bg-muted/20 p-1.5 rounded text-rose-600">
                      <span>Total Deductions</span>
                      <span className="font-mono">
                        {formatCurrency(
                          previewData.totals?.totalDeductions || 0,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DAILY RECONCILIATION AUDIT */}
              {previewTab === "timeline" && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead className="bg-muted text-muted-foreground sticky top-0 border-b">
                        <tr>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Day</th>
                          <th className="p-2 text-center">Attendance</th>
                          <th className="p-2 text-center">Approved Leave</th>
                          <th className="p-2 text-left">
                            Final Payroll Status
                          </th>
                          <th className="p-2 text-center">Payable?</th>
                          <th className="p-2 text-left">Audit Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/40">
                        {previewData.attendance?.dailyTimeline?.map(
                          (item: any, idx: number) => {
                            const isWeekend = item.isWeekend;
                            const isHoliday = item.isHoliday;
                            return (
                              <tr
                                key={idx}
                                className={
                                  !item.isPayable
                                    ? "bg-rose-50/50 dark:bg-rose-950/20"
                                    : isWeekend || isHoliday
                                      ? "bg-muted/20"
                                      : ""
                                }
                              >
                                <td className="p-2 font-mono font-medium">
                                  {item.date}
                                </td>
                                <td className="p-2 text-muted-foreground">
                                  {item.dayOfWeek}
                                </td>
                                <td className="p-2 text-center">
                                  {item.attendanceStatus ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {item.attendanceStatus}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {item.leaveStatus ? (
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${
                                        item.leaveStatus === "PAID_LEAVE"
                                          ? "border-emerald-500 text-emerald-600"
                                          : "border-rose-500 text-rose-600"
                                      }`}
                                    >
                                      {item.leaveStatus}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="p-2">
                                  <Badge
                                    className={`text-[10px] font-semibold ${
                                      item.finalStatus === "PRESENT" ||
                                      item.finalStatus === "PAID_LEAVE"
                                        ? "bg-emerald-600 text-white"
                                        : item.finalStatus === "UNPAID_LEAVE" ||
                                            item.finalStatus === "ABSENT"
                                          ? "bg-rose-600 text-white"
                                          : item.finalStatus === "HALF_DAY"
                                            ? "bg-amber-500 text-white"
                                            : "bg-slate-500 text-white"
                                    }`}
                                  >
                                    {item.finalStatus}
                                  </Badge>
                                </td>
                                <td className="p-2 text-center font-bold">
                                  {item.isPayable ? (
                                    <span className="text-emerald-600">
                                      Yes ({item.payableFraction})
                                    </span>
                                  ) : (
                                    <span className="text-rose-600">
                                      No (0.0)
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-muted-foreground text-[11px]">
                                  {item.reason}
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsGenerateModalOpen(false)}
            >
              Close
            </Button>
            {previewData && !previewData.alreadyFinalized && (
              <Button
                size="sm"
                onClick={handleSaveAndFinalize}
                disabled={generateSingleMutation.isPending}
                className="gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {generateSingleMutation.isPending ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                )}
                {generateSingleMutation.isPending
                  ? "Finalizing..."
                  : "Save & Finalize Payslip"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListingCard>
  );
}
