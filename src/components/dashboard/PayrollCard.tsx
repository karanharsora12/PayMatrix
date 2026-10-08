import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardPayroll } from "@/api/dashboard";
import { EmptyState, StatTile } from "./helpers";

export function PayrollCard({ payroll }: { payroll: DashboardPayroll }) {
  const hasData = payroll.monthly.length > 0 || payroll.current !== null;
  const isSelf = payroll.scope === "SELF";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{isSelf ? "My Payroll" : "Payroll Overview"}</CardTitle>
        <Badge variant="outline">
          {payroll.current ? `Latest: ${payroll.current.month ?? payroll.current.status}` : "No runs"}
        </Badge>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState
            icon={Wallet}
            title={isSelf ? "No payslips yet" : "No payroll runs yet"}
            description={
              isSelf
                ? "Your payslips will appear here after the first payroll is generated."
                : "Payroll runs and monthly totals will appear here once payroll is processed."
            }
          />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label="Gross"
                value={formatCurrency(payroll.current?.gross ?? 0)}
                accent="text-blue-600"
              />
              <StatTile
                label="Deductions"
                value={formatCurrency(payroll.current?.deductions ?? 0)}
                accent="text-amber-600"
              />
              <StatTile
                label="Net"
                value={formatCurrency(payroll.current?.net ?? 0)}
                accent="text-emerald-600"
              />
              <StatTile
                label={isSelf ? "Payslips" : "Employees"}
                value={
                  isSelf
                    ? String(payroll.payslips.total)
                    : String(payroll.current?.employeeCount ?? 0)
                }
                hint={payroll.current?.status ?? undefined}
                accent="text-violet-600"
              />
            </div>

            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={payroll.monthly}>
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="gross" name="Gross" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="deductions" name="Deductions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="net" name="Net" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
