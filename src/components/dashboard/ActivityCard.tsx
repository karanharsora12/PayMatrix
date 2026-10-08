import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";
import type { DashboardActivityItem } from "@/api/dashboard";
import { EmptyState } from "./helpers";

const ACTION_STYLES: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-violet-100 text-violet-700",
  APPROVE: "bg-amber-100 text-amber-700",
};

export function ActivityCard({ activity }: { activity: DashboardActivityItem[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Activity</CardTitle>
        <Badge variant="outline">Latest {activity.length}</Badge>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Actions performed in the system will be listed here."
          />
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm">
                    <span className="font-medium capitalize">{item.module}</span>
                    {item.entityType && (
                      <span className="text-muted-foreground"> • {item.entityType}</span>
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.actor ?? "system"}
                    {item.entityId ? ` • ${item.entityId.slice(0, 8)}` : ""}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ACTION_STYLES[item.action] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.action}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
