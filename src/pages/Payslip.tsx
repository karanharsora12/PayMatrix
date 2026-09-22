import { useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/select";
import { DataGrid } from "@/components/common/DataGrid";
import type { ColDef } from "ag-grid-community";
import {
  Printer,
  FileText,
  Search,
  Calendar,
  Eye,
  ArrowLeft,
  Building2,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { usePayslips, usePayslip } from "@/hooks/usePayslips";

// Helper to convert number to words for financial slip
function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const intPart = Math.floor(num);
  return `${inWords(intPart)} Rupees Only`;
}

export default function Payslip() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(id || null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>(searchParams.get("year") || "ALL");
  const [monthFilter, setMonthFilter] = useState<string>(searchParams.get("month") || "ALL");

  const queryParams: any = { page: 1, limit: 100 };
  if (yearFilter !== "ALL") queryParams.year = parseInt(yearFilter, 10);
  if (monthFilter !== "ALL") queryParams.month = parseInt(monthFilter, 10);

  const { data: listData, isLoading: isListLoading } = usePayslips(queryParams);
  const { data: detailData, isLoading: isDetailLoading } = usePayslip(selectedPayslipId || "");

  const payslipsList: any[] = (listData as any)?.data || listData || [];
  const payslip = (detailData as any)?.data ?? detailData;

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

  const payslipColDefs = useMemo<ColDef[]>(() => [
    { 
      field: "payslipNumber", 
      headerName: "Payslip Number", 
      width: 150,
      cellClass: "font-mono text-xs font-semibold"
    },
    { 
      field: "employee", 
      headerName: "Employee", 
      flex: 1,
      cellRenderer: (p: any) => (
        <div className="flex flex-col justify-center h-full">
          <div className="font-medium text-sm leading-tight">{p.data.employeeName}</div>
          <div className="text-xs text-muted-foreground font-mono leading-tight">
            {p.data.employeeCode} • {p.data.departmentName}
          </div>
        </div>
      )
    },
    { 
      field: "period", 
      headerName: "Period", 
      width: 130,
      cellClass: "text-xs",
      valueGetter: p => p.data.periodYear && p.data.periodMonth
        ? new Date(p.data.periodYear, p.data.periodMonth - 1).toLocaleString("default", { month: "short", year: "numeric" })
        : "—"
    },
    { 
      field: "grossSalary", 
      headerName: "Gross", 
      width: 130,
      cellClass: "text-right text-xs flex justify-end",
      valueFormatter: p => formatCurrency(Number(p.value))
    },
    { 
      field: "totalDeductions", 
      headerName: "Deductions", 
      width: 130,
      cellClass: "text-right text-xs text-rose-600 flex justify-end",
      valueFormatter: p => formatCurrency(Number(p.value))
    },
    { 
      field: "netSalary", 
      headerName: "Net Salary", 
      width: 140,
      cellClass: "text-right font-bold text-xs text-emerald-600 flex justify-end",
      valueFormatter: p => formatCurrency(Number(p.value))
    },
    { 
      field: "status", 
      headerName: "Status", 
      width: 120,
      cellClass: "text-center",
      cellRenderer: (p: any) => (
        <Badge variant="outline" className="text-[10px] gap-1">
          <Lock className="h-2.5 w-2.5" />
          {p.value}
        </Badge>
      )
    },
    { 
      headerName: "Action", 
      width: 120,
      sortable: false,
      filter: false,
      cellRenderer: (p: any) => (
        <div className="flex justify-end items-center h-full">
          <Button size="sm" variant="ghost" onClick={() => setSelectedPayslipId(p.data.id)}>
            <Eye className="h-3.5 w-3.5 mr-1" />
            View
          </Button>
        </div>
      )
    }
  ], []);

  const handlePrint = () => {
    window.print();
  };

  // If a payslip is selected, display printable document view
  if (selectedPayslipId && payslip) {
    const monthName = new Date(payslip.periodYear, payslip.periodMonth - 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-12 print:max-w-none print:p-0 print:m-0">
        {/* Top Control Bar (hidden on print) */}
        <div className="flex items-center justify-between gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSelectedPayslipId(null)}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Directory
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Printable Payslip Card */}
        <Card className="overflow-hidden shadow-lg border-2 print:border-none print:shadow-none">
          {/* Company & Period Header */}
          <div className="bg-primary text-primary-foreground p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xl font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {payslip.company?.legalName || payslip.company?.name || "PayMatrix Technologies Pvt Ltd"}
              </div>
              <div className="text-xs opacity-80 mt-1 max-w-md">
                {payslip.company?.address || "Headquarters • Corporate Financial Division"}
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs uppercase tracking-wider opacity-80">Salary Slip for</div>
              <div className="text-lg font-bold">{monthName}</div>
              <div className="font-mono text-xs opacity-90 mt-0.5">{payslip.payslipNumber}</div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Employee Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20 text-xs">
              <div className="space-y-1.5">
                <div className="text-sm font-bold text-foreground">{payslip.employee?.name}</div>
                <div className="text-muted-foreground">
                  Employee Code: <span className="font-mono font-medium text-foreground">{payslip.employee?.code}</span>
                </div>
                <div>Department: <span className="font-medium">{payslip.employee?.department || "General"}</span></div>
                <div>Designation: <span className="font-medium">{payslip.employee?.designation || "Staff"}</span></div>
                {payslip.employee?.joiningDate && (
                  <div>Joining Date: <span className="font-medium">{payslip.employee.joiningDate}</span></div>
                )}
              </div>

              <div className="space-y-1.5 md:text-right">
                {payslip.employee?.bankAccount ? (
                  <div>
                    Bank: <span className="font-medium">{payslip.employee.bankAccount.bankName} • {payslip.employee.bankAccount.accountNumber}</span>
                    <div className="text-[11px] text-muted-foreground">IFSC: {payslip.employee.bankAccount.ifscCode}</div>
                  </div>
                ) : (
                  <div>Bank: <span className="font-medium">Direct Deposit</span></div>
                )}
                {payslip.employee?.statutory?.panNumber && (
                  <div>PAN: <span className="font-mono font-medium">{payslip.employee.statutory.panNumber}</span></div>
                )}
                {payslip.employee?.statutory?.uanNumber && (
                  <div>UAN: <span className="font-mono font-medium">{payslip.employee.statutory.uanNumber}</span></div>
                )}
                <div className="text-emerald-600 font-semibold">
                  Paid Days: {payslip.attendance?.paidDays} / {payslip.attendance?.calendarDays}
                </div>
              </div>
            </div>

            {/* Attendance Snapshot Summary Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs border p-3 rounded-lg bg-muted/10">
              <div>
                <div className="text-[10px] text-muted-foreground">Working Days</div>
                <div className="font-bold">{payslip.attendance?.workingDays || 22}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Present</div>
                <div className="font-bold">{payslip.attendance?.presentDays || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Paid Leave</div>
                <div className="font-bold">{payslip.attendance?.paidLeaveDays || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Unpaid LOP</div>
                <div className="font-bold text-rose-600">{payslip.attendance?.unpaidLeaveDays || 0}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Absent</div>
                <div className="font-bold text-rose-600">{payslip.attendance?.absentDays || 0}</div>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950 rounded p-0.5 border border-emerald-300">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300">Total Paid Days</div>
                <div className="font-bold text-emerald-600">{payslip.attendance?.paidDays || 0}</div>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings Column */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-bold text-sm border-b pb-2 flex justify-between">
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="space-y-2 text-xs">
                  {payslip.earnings?.map((e: any) => (
                    <div key={e.id} className="flex justify-between border-b pb-1">
                      <span className="font-medium">{e.componentName || e.componentCode}</span>
                      <span className="font-mono">{formatCurrency(Number(e.amount))}</span>
                    </div>
                  ))}
                  {payslip.adjustments?.filter((a: any) => a.isAddition).map((a: any) => (
                    <div key={a.id} className="flex justify-between border-b pb-1 text-emerald-600">
                      <span>{a.name} (Adjustment)</span>
                      <span className="font-mono">+{formatCurrency(Number(a.amount))}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t">
                  <span>Gross Salary</span>
                  <span className="font-mono">{formatCurrency(Number(payslip.totals?.grossSalary || 0))}</span>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="font-bold text-sm border-b pb-2 flex justify-between">
                  <span>Deductions Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="space-y-2 text-xs">
                  {payslip.deductions?.length > 0 ? (
                    payslip.deductions.map((d: any) => (
                      <div key={d.id} className="flex justify-between border-b pb-1 text-rose-600">
                        <span className="font-medium text-foreground">{d.componentName || d.componentCode}</span>
                        <span className="font-mono">-{formatCurrency(Number(d.amount))}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-muted-foreground italic py-2">No deductions applied.</div>
                  )}
                  {payslip.adjustments?.filter((a: any) => !a.isAddition).map((a: any) => (
                    <div key={a.id} className="flex justify-between border-b pb-1 text-rose-600">
                      <span>{a.name} (Recovery)</span>
                      <span className="font-mono">-{formatCurrency(Number(a.amount))}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-sm pt-2 border-t text-rose-600">
                  <span>Total Deductions</span>
                  <span className="font-mono">{formatCurrency(Number(payslip.totals?.totalDeductions || 0))}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Box */}
            <div className="rounded-xl bg-slate-900 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 dark:bg-zinc-900">
              <div>
                <div className="text-xs uppercase tracking-wider text-slate-400">Net Salary Disbursed</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(Number(payslip.totals?.netSalary || 0))}
                </div>
              </div>
              <div className="sm:text-right">
                <div className="text-[11px] text-slate-400">Amount in Words:</div>
                <div className="text-xs font-medium italic text-slate-200">
                  {numberToWords(Number(payslip.totals?.netSalary || 0))}
                </div>
              </div>
            </div>

            {/* Footer Disclaimer */}
            <div className="border-t pt-4 text-[11px] text-muted-foreground text-center space-y-1">
              <p>This document is a computer-generated, immutable financial payslip snapshot and does not require a signature.</p>
              <p className="font-mono text-[10px] opacity-70">
                Generated on {new Date(payslip.generatedAt).toLocaleString()} • Snapshot Locked
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Otherwise, display Payslips Directory Table
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payslips Directory</h1>
          <p className="text-sm text-muted-foreground">
            Search, view, and print finalized employee payslips.
          </p>
        </div>
        <Button variant="outline" onClick={() => nav("/payroll")}>
          <Calendar className="h-4 w-4 mr-2" />
          Payroll Runs
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative max-w-xs w-full">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search payslip #, name, or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <NativeSelect value={yearFilter} onChange={setYearFilter} className="w-32">
                <option value="ALL">All Years</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </NativeSelect>
              <NativeSelect value={monthFilter} onChange={setMonthFilter} className="w-36">
                <option value="ALL">All Months</option>
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
            <div className="text-xs text-muted-foreground">
              {filteredList.length} payslips available
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isListLoading ? (
            <div className="p-8 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No payslips found matching your filters.</p>
              <p className="text-xs mt-1">Finalize an approved payroll run to generate payslips.</p>
            </div>
          ) : (
            <div className="h-[500px]">
              <DataGrid rowData={filteredList} columnDefs={payslipColDefs} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
