import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed text-center",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-3 text-sm font-medium">{title}</div>
      {description && (
        <div className="mt-1 max-w-[240px] text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  accent = "text-foreground",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className={cn("text-xl font-semibold", accent)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  LATE: "bg-orange-100 text-orange-700",
  HALF_DAY: "bg-amber-100 text-amber-700",
  ABSENT: "bg-red-100 text-red-700",
  ON_LEAVE: "bg-blue-100 text-blue-700",
  HOLIDAY: "bg-violet-100 text-violet-700",
  WEEK_OFF: "bg-slate-200 text-slate-700",
  ON_DUTY: "bg-cyan-100 text-cyan-700",
  WFH: "bg-indigo-100 text-indigo-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
