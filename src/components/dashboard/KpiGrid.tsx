import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Palmtree, Wallet, FileText, UserMinus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardSummaryData } from "@/api/dashboard";

interface Kpi {
  label: string;
  value: string;
  change: string;
  icon: typeof Users;
  color: string;
}

export function KpiGrid({ summary }: { summary: DashboardSummaryData }) {
  const { access, employees, attendance, leave, payroll } = summary;
  const kpis: Kpi[] = [];

  if (access.employees && employees) {
    kpis.push({
      label: "Total Employees",
      value: String(employees.total),
      change: `${employees.active} active`,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20",
    });
  }

  if (access.attendance && attendance) {
    kpis.push({
      label: "Present Today",
      value: String(attendance.today.present),
      change: `${attendance.today.attendanceRate}% attendance`,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20",
    });
    kpis.push({
      label: "Absent Today",
      value: String(attendance.today.absent),
      change: `${attendance.today.totalEmployees} strength`,
      icon: UserMinus,
      color: "text-destructive dark:text-red-400 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20",
    });
  }

  if (access.leave && leave) {
    kpis.push({
      label: "On Leave",
      value: String(leave.onLeaveToday),
      change: `${leave.period.pending} pending`,
      icon: Palmtree,
      color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20",
    });
  }

  if (access.payroll && payroll) {
    const net = payroll.current?.net ?? payroll.monthly.reduce((sum, m) => sum + m.net, 0);
    kpis.push({
      label: payroll.scope === "SELF" ? "Net Payable" : "Payroll This Month",
      value: formatCurrency(net),
      change: payroll.current ? payroll.current.month ?? payroll.current.status : "No run yet",
      icon: Wallet,
      color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/20",
    });
    kpis.push({
      label: "Payslips Generated",
      value: String(payroll.payslips.total),
      change: `${payroll.payslips.currentPeriod} this period`,
      icon: FileText,
      color: "text-orange-600 dark:text-orange-400 bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/20",
    });
  }

  if (!kpis.length) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((k) => (
        <Card key={k.label} className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${k.color}`}>
                <k.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{k.change}</span>
            </div>
            <div className="mt-3 text-2xl font-bold">{k.value}</div>
            <div className="text-xs text-muted-foreground">{k.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
