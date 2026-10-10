import React, { useState, useEffect } from "react";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Timer,
  Loader2,
  CalendarDays,
  ShieldCheck,
  Briefcase,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import {
  useAttendanceMyStatus,
  usePunchIn,
  usePunchOut,
} from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

interface PunchWidgetProps {
  className?: string;
  variant?: "full" | "compact";
  onPunchSuccess?: () => void;
}

export function PunchWidget({
  className,
  variant = "full",
  onPunchSuccess,
}: PunchWidgetProps) {
  const { data: statusResp, isLoading, isError, refetch } = useAttendanceMyStatus();
  const punchInMutation = usePunchIn();
  const punchOutMutation = usePunchOut();

  // Live real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const data = statusResp;
  const attendance = data?.attendance;
  const shift = data?.shift;
  const employee = data?.employee;

  const hasPunchedIn = Boolean(attendance?.checkIn);
  const hasPunchedOut = Boolean(attendance?.checkOut);
  const canPunchIn = Boolean(data?.canPunchIn && !hasPunchedIn);
  const canPunchOut = Boolean(data?.canPunchOut || (hasPunchedIn && !hasPunchedOut));
  const isCompleted = Boolean(data?.isCompleted || (hasPunchedIn && hasPunchedOut));

  const formatTimeString = (isoStr?: string | null) => {
    if (!isoStr) return "--:--";
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePunchIn = async () => {
    try {
      await punchInMutation.mutateAsync();
      toast({
        title: "Punched In Successfully",
        description: `Punch recorded at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`,
        variant: "default",
      });
      refetch();
      onPunchSuccess?.();
    } catch (err: any) {
      toast({
        title: "Punch In Failed",
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not record punch in.",
        variant: "destructive",
      });
    }
  };

  const handlePunchOut = async () => {
    try {
      await punchOutMutation.mutateAsync();
      toast({
        title: "Punched Out Successfully",
        description: `Punch recorded at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}`,
        variant: "default",
      });
      refetch();
      onPunchSuccess?.();
    } catch (err: any) {
      toast({
        title: "Punch Out Failed",
        description:
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          err?.message ||
          "Could not record punch out.",
        variant: "destructive",
      });
    }
  };

  const isPending = punchInMutation.isPending || punchOutMutation.isPending;

  const formattedCurrentTime = currentTime.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const formattedCurrentDate = currentTime.toLocaleDateString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (isLoading) {
    return (
      <Card className={cn("p-6 flex flex-col items-center justify-center min-h-[220px]", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Loading attendance status...</p>
      </Card>
    );
  }

  if (isError && !data) {
    return (
      <Card className={cn("p-5 border-destructive/20 bg-destructive/5", className)}>
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-destructive">Attendance Sync Unavailable</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Could not retrieve your punch status. Ensure your user profile is tied to an employee record.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-sm overflow-hidden", className)}>
      <CardHeader className="py-3.5 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-medium">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold">Web Punch In / Out</CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {employee ? `${employee.firstName} ${employee.lastName} (${employee.employeeCode})` : "My Attendance"}
            </p>
          </div>
        </div>

        <div>
          {isCompleted ? (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1 text-[11px]">
              <CheckCircle2 className="h-3 w-3" /> Completed
            </Badge>
          ) : hasPunchedIn ? (
            <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 gap-1 text-[11px] animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> In Progress
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              Not Punched In
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Real-time Clock display */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-card border border-border/80 shadow-xs gap-3">
          <div>
            <div className="text-2xl font-bold font-mono tracking-tight text-foreground flex items-center gap-2">
              {formattedCurrentTime}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formattedCurrentDate}</span>
            </div>
          </div>

          {shift && (
            <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-1.5 rounded-lg border border-border/60">
              <Timer className="h-3.5 w-3.5 text-primary shrink-0" />
              <div>
                <span className="font-medium text-foreground">{shift.name}</span>
                <span className="text-muted-foreground ml-1">
                  ({shift.startTime} – {shift.endTime})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Check-In / Check-Out Recorded Time Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 bg-muted/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1 font-medium">
                <LogIn className="h-3.5 w-3.5 text-emerald-600" /> Punch In
              </span>
              {hasPunchedIn && (
                <span className="text-[10px] text-emerald-600 font-semibold uppercase">Recorded</span>
              )}
            </div>
            <div className="text-base font-semibold font-mono text-foreground">
              {formatTimeString(attendance?.checkIn)}
            </div>
          </div>

          <div className="rounded-lg border p-3 bg-muted/10">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="flex items-center gap-1 font-medium">
                <LogOut className="h-3.5 w-3.5 text-blue-600" /> Punch Out
              </span>
              {hasPunchedOut && (
                <span className="text-[10px] text-blue-600 font-semibold uppercase">Recorded</span>
              )}
            </div>
            <div className="text-base font-semibold font-mono text-foreground">
              {formatTimeString(attendance?.checkOut)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            className="w-full gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50"
            disabled={!canPunchIn || isPending}
            onClick={handlePunchIn}
          >
            {punchInMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recording Punch In...
              </>
            ) : hasPunchedIn ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-200" /> Punched In
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Punch In
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="default"
            className="w-full gap-2 font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50"
            disabled={!canPunchOut || isPending}
            onClick={handlePunchOut}
          >
            {punchOutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Recording Punch Out...
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-blue-200" /> Punched Out
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" /> Punch Out
              </>
            )}
          </Button>
        </div>

        {/* Status / Working Hours summary if available */}
        {attendance && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Status:</span>
              <Badge variant="outline" className="text-[11px] font-medium uppercase">
                {attendance.status}
              </Badge>
            </div>
            {attendance.workingMinutes !== null && attendance.workingMinutes !== undefined && (
              <div className="font-mono text-xs">
                Total:{" "}
                <span className="font-semibold text-foreground">
                  {Math.floor(attendance.workingMinutes / 60)}h {attendance.workingMinutes % 60}m
                </span>
                {attendance.overtimeMinutes ? (
                  <span className="text-emerald-600 ml-1.5">(OT: {attendance.overtimeMinutes}m)</span>
                ) : null}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
