import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Building2 } from "lucide-react";
import type { DashboardEmployees } from "@/api/dashboard";
import { EmptyState, StatTile } from "./helpers";

export function WorkforceCard({ employees }: { employees: DashboardEmployees }) {
  const departments = employees.distribution.departments;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Workforce</CardTitle>
        <Badge variant="outline">{employees.joinedThisMonth} joined this month</Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatTile label="Total" value={employees.total} accent="text-blue-600 dark:text-blue-400" />
          <StatTile label="Active" value={employees.active} accent="text-emerald-600 dark:text-emerald-400" />
          <StatTile label="Inactive" value={employees.inactive} accent="text-muted-foreground" />
        </div>

        {departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments mapped"
            description="Assign employees to departments to see the distribution."
          />
        ) : (
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departments} layout="vertical" margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
