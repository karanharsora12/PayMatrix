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
        "flex h-full min-h-[140px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 text-center p-4",
        className,
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-3 text-sm font-medium text-foreground">{title}</div>
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
    <div className="rounded-lg border border-border bg-muted/20 p-3 transition-colors">
      <div className={cn("text-xl font-semibold", accent)}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-emerald-500/30",
  LATE: "bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border-orange-500/30",
  HALF_DAY: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 border-amber-500/30",
  ABSENT: "bg-destructive/15 text-destructive dark:bg-destructive/25 dark:text-red-300 border-destructive/30",
  ON_LEAVE: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-blue-500/30",
  HOLIDAY: "bg-violet-500/15 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 border-violet-500/30",
  WEEK_OFF: "bg-muted text-muted-foreground border-border",
  ON_DUTY: "bg-cyan-500/15 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300 border-cyan-500/30",
  WFH: "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-indigo-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    borderColor: "hsl(var(--border))",
    borderRadius: "8px",
    color: "hsl(var(--popover-foreground))",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    fontSize: "12px",
  },
  itemStyle: {
    color: "hsl(var(--popover-foreground))",
  },
};

export const chartAxisProps = {
  stroke: "hsl(var(--muted-foreground))",
  tick: { fill: "hsl(var(--muted-foreground))" },
};
