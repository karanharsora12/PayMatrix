import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { companyApi } from "@/api/companies";
import type {
  CompanyWorkPolicy,
  SaturdayRule,
  SundayRule,
  DivisorPolicy,
  SandwichRuleType,
  CalendarPreviewData,
} from "@/types/workPolicy";
import {
  CalendarDays,
  Clock,
  ShieldCheck,
  Calculator,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const DEFAULT_DAYS = [
  { dayOfWeek: 0, name: "Sunday", type: "WEEK_OFF" as const, isPaid: true },
  { dayOfWeek: 1, name: "Monday", type: "WORKING" as const, isPaid: false },
  { dayOfWeek: 2, name: "Tuesday", type: "WORKING" as const, isPaid: false },
  { dayOfWeek: 3, name: "Wednesday", type: "WORKING" as const, isPaid: false },
  { dayOfWeek: 4, name: "Thursday", type: "WORKING" as const, isPaid: false },
  { dayOfWeek: 5, name: "Friday", type: "WORKING" as const, isPaid: false },
  { dayOfWeek: 6, name: "Saturday", type: "WEEK_OFF" as const, isPaid: true },
];

const DEFAULT_POLICY: CompanyWorkPolicy = {
  weeklyOffPolicy: DEFAULT_DAYS,
  saturdayRule: "SECOND_FOURTH_OFF",
  saturdayPaid: true,
  saturday5thRule: "FOLLOW_PATTERN",
  saturdayCustomOccurrences: [
    { occurrence: 1, isOff: false, isPaid: false },
    { occurrence: 2, isOff: true, isPaid: true },
    { occurrence: 3, isOff: false, isPaid: false },
    { occurrence: 4, isOff: true, isPaid: true },
    { occurrence: 5, isOff: false, isPaid: false },
  ],
  sundayRule: "OFF_PAID",
  sandwichRuleEnabled: true,
  sandwichRuleType: "BOTH_DAYS",
  divisorPolicy: "CALENDAR_DAYS",
  customDivisorValue: 30,
  unpaidWeekOffDeductionMode: "EXCLUDE_FROM_PAID_DAYS",
};

interface WorkPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: { id: string; name: string; code: string } | null;
}

export function WorkPolicyDialog({
  open,
  onOpenChange,
  company,
}: WorkPolicyDialogProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "weekly" | "saturday" | "sandwich" | "divisor" | "preview"
  >("weekly");

  const [policy, setPolicy] = useState<CompanyWorkPolicy>(DEFAULT_POLICY);

  // Calendar Preview state
  const currentDate = new Date();
  const [previewYear, setPreviewYear] = useState(currentDate.getFullYear());
  const [previewMonth, setPreviewMonth] = useState(currentDate.getMonth() + 1);

  // Load existing policy
  const { data: serverPolicy, isLoading } = useQuery({
    queryKey: ["companyWorkPolicy", company?.id],
    queryFn: async (): Promise<CompanyWorkPolicy> => {
      if (!company?.id) throw new Error("No company");
      return (await companyApi.getWorkPolicy(company.id)) as CompanyWorkPolicy;
    },
    enabled: !!company?.id && open,
  });

  // Load preview data
  const { data: previewData, isLoading: isPreviewLoading } = useQuery({
    queryKey: ["companyCalendarPreview", company?.id, previewYear, previewMonth],
    queryFn: async (): Promise<CalendarPreviewData> => {
      if (!company?.id) throw new Error("No company");
      return (await companyApi.previewCalendar(
        company.id,
        previewYear,
        previewMonth,
      )) as CalendarPreviewData;
    },
    enabled: !!company?.id && open && activeTab === "preview",
  });

  useEffect(() => {
    if (serverPolicy) {
      setPolicy({
        ...DEFAULT_POLICY,
        ...serverPolicy,
        weeklyOffPolicy: serverPolicy.weeklyOffPolicy || DEFAULT_DAYS,
      });
    } else {
      setPolicy(DEFAULT_POLICY);
    }
  }, [serverPolicy]);

  const saveMutation = useMutation({
    mutationFn: (newPolicy: CompanyWorkPolicy) =>
      companyApi.updateWorkPolicy(company!.id, newPolicy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyWorkPolicy", company?.id] });
      queryClient.invalidateQueries({ queryKey: ["companyCalendarPreview", company?.id] });
      toast.success("Work schedule & weekly off policy saved successfully!");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to save work policy");
    },
  });

  const handleDayTypeToggle = (dayOfWeek: number) => {
    setPolicy((prev) => {
      const nextDays = prev.weeklyOffPolicy.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          const nextType = d.type === "WORKING" ? ("WEEK_OFF" as const) : ("WORKING" as const);
          return {
            ...d,
            type: nextType,
            isPaid: nextType === "WEEK_OFF" ? true : false,
          };
        }
        return d;
      });
      return { ...prev, weeklyOffPolicy: nextDays };
    });
  };

  const handleDayPaidToggle = (dayOfWeek: number) => {
    setPolicy((prev) => {
      const nextDays = prev.weeklyOffPolicy.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          return { ...d, isPaid: !d.isPaid };
        }
        return d;
      });
      return { ...prev, weeklyOffPolicy: nextDays };
    });
  };

  const handleCustomOccurrenceToggle = (
    occurrence: number,
    field: "isOff" | "isPaid",
  ) => {
    setPolicy((prev) => {
      const existing = prev.saturdayCustomOccurrences || [];
      const updated = existing.map((o) => {
        if (o.occurrence === occurrence) {
          return { ...o, [field]: !o[field] };
        }
        return o;
      });
      return { ...prev, saturdayCustomOccurrences: updated };
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = () => {
    if (previewMonth === 1) {
      setPreviewYear((y) => y - 1);
      setPreviewMonth(12);
    } else {
      setPreviewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (previewMonth === 12) {
      setPreviewYear((y) => y + 1);
      setPreviewMonth(1);
    } else {
      setPreviewMonth((m) => m + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold">
                  Work Schedule, Weekly Off & Salary Policy
                </DialogTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-foreground">
                    {company?.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {company?.code}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-1 border-b pt-3 text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("weekly")}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "weekly"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Weekly Schedule
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("saturday")}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "saturday"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Saturday & Sunday Rules
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("sandwich")}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "sandwich"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Sandwich & Eligibility Rule
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("divisor")}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "divisor"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              Salary Divisors & Rates
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`pb-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "preview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar Live Preview
            </button>
          </div>
        </DialogHeader>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 text-xs">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Loading company work policy...
            </div>
          ) : (
            <>
              {/* TAB 1: WEEKLY SCHEDULE */}
              {activeTab === "weekly" && (
                <div className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-lg border text-xs text-muted-foreground flex gap-2.5 items-start">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground">
                        Day-by-Day Working Week Specification
                      </p>
                      <p>
                        Configure each day of the week as a Working Day or
                        Weekly Off. Saturday and Sunday policies configured in
                        the next tab will take precedence for weekends.
                      </p>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-4 text-left">Day of Week</th>
                          <th className="py-2.5 px-4 text-center">Day Status</th>
                          <th className="py-2.5 px-4 text-center">Paid Treatment</th>
                          <th className="py-2.5 px-4 text-left">Current Rule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted/40">
                        {policy.weeklyOffPolicy.map((day) => {
                          const isWeekend = day.dayOfWeek === 0 || day.dayOfWeek === 6;
                          return (
                            <tr
                              key={day.dayOfWeek}
                              className={isWeekend ? "bg-muted/10" : ""}
                            >
                              <td className="py-2.5 px-4 font-semibold text-foreground">
                                {day.name}
                                {isWeekend && (
                                  <span className="text-[10px] text-muted-foreground ml-1.5">
                                    (Weekend)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={day.type === "WEEK_OFF" ? "secondary" : "outline"}
                                  onClick={() => handleDayTypeToggle(day.dayOfWeek)}
                                  className="h-7 px-3 text-[11px] font-medium"
                                >
                                  {day.type === "WEEK_OFF"
                                    ? "Weekly Off"
                                    : "Working Day"}
                                </Button>
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {day.type === "WEEK_OFF" ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <Switch
                                      checked={day.isPaid}
                                      onCheckedChange={() =>
                                        handleDayPaidToggle(day.dayOfWeek)
                                      }
                                    />
                                    <span
                                      className={`text-[11px] font-semibold ${
                                        day.isPaid
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-amber-600 dark:text-amber-400"
                                      }`}
                                    >
                                      {day.isPaid ? "Paid" : "Unpaid"}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-[11px]">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-muted-foreground">
                                {day.dayOfWeek === 6
                                  ? `Governed by Saturday Rule (${policy.saturdayRule})`
                                  : day.dayOfWeek === 0
                                    ? `Governed by Sunday Rule (${policy.sundayRule})`
                                    : day.type === "WEEK_OFF"
                                      ? `${day.isPaid ? "Paid" : "Unpaid"} Weekly Off`
                                      : "Normal Working Day"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: SATURDAY & SUNDAY RULES */}
              {activeTab === "saturday" && (
                <div className="space-y-6">
                  {/* Saturday Policy Section */}
                  <div className="border rounded-lg p-4 bg-card space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          Saturday Working Policy
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          Configure whether Saturdays are working, off, alternate, or custom.
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        Rule: {policy.saturdayRule}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold block mb-1">
                          Saturday Occurrence Rule
                        </label>
                        <NativeSelect
                          value={policy.saturdayRule}
                          onChange={(val: string) =>
                            setPolicy((p) => ({
                              ...p,
                              saturdayRule: val as SaturdayRule,
                            }))
                          }
                          className="w-full text-xs"
                        >
                          <option value="SECOND_FOURTH_OFF">
                            2nd & 4th Saturdays Off (1st & 3rd Working)
                          </option>
                          <option value="FIRST_THIRD_OFF">
                            1st & 3rd Saturdays Off (2nd & 4th Working)
                          </option>
                          <option value="ALL_OFF">
                            Every Saturday is a Weekly Off
                          </option>
                          <option value="ALL_WORKING">
                            All Saturdays are Working Days
                          </option>
                          <option value="ALTERNATE_OFF">
                            Alternate Saturdays Off (1st, 3rd, 5th)
                          </option>
                          <option value="CUSTOM">
                            Custom Calendar Pattern (Configure occurrences below)
                          </option>
                        </NativeSelect>
                      </div>

                      <div>
                        <label className="font-semibold block mb-1">
                          Saturday Off Treatment
                        </label>
                        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                          <span className="text-muted-foreground">
                            When off, treat Saturday as:
                          </span>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={policy.saturdayPaid}
                              onCheckedChange={(checked) =>
                                setPolicy((p) => ({ ...p, saturdayPaid: checked }))
                              }
                            />
                            <span
                              className={`font-semibold ${
                                policy.saturdayPaid
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {policy.saturdayPaid ? "Paid Weekly Off" : "Unpaid Weekly Off"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 5th Saturday Handling */}
                    {(policy.saturdayRule === "FIRST_THIRD_OFF" ||
                      policy.saturdayRule === "SECOND_FOURTH_OFF") && (
                      <div className="border-t pt-3">
                        <label className="font-semibold block mb-1">
                          5th Saturday Handling (Months with 5 Saturdays)
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="saturday5th"
                              checked={policy.saturday5thRule === "WORKING"}
                              onChange={() =>
                                setPolicy((p) => ({ ...p, saturday5thRule: "WORKING" }))
                              }
                            />
                            <span>Treat 5th Saturday as Working Day</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="saturday5th"
                              checked={policy.saturday5thRule === "OFF"}
                              onChange={() =>
                                setPolicy((p) => ({ ...p, saturday5thRule: "OFF" }))
                              }
                            />
                            <span>Treat 5th Saturday as Weekly Off</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="saturday5th"
                              checked={policy.saturday5thRule === "FOLLOW_PATTERN"}
                              onChange={() =>
                                setPolicy((p) => ({
                                  ...p,
                                  saturday5thRule: "FOLLOW_PATTERN",
                                }))
                              }
                            />
                            <span>Follow Odd/Even Pattern</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Custom Saturday Occurrences */}
                    {policy.saturdayRule === "CUSTOM" && (
                      <div className="border-t pt-3 space-y-2">
                        <h4 className="font-semibold">
                          Custom Occurrence Setup (1st through 5th Saturday):
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((occ) => {
                            const occData =
                              policy.saturdayCustomOccurrences?.find(
                                (c) => c.occurrence === occ,
                              ) || { occurrence: occ, isOff: false, isPaid: false };
                            return (
                              <div
                                key={occ}
                                className={`border p-2.5 rounded-lg text-center space-y-1.5 ${
                                  occData.isOff
                                    ? "bg-primary/5 border-primary/30"
                                    : "bg-muted/20"
                                }`}
                              >
                                <div className="font-bold">
                                  {occ}
                                  {occ === 1
                                    ? "st"
                                    : occ === 2
                                      ? "nd"
                                      : occ === 3
                                        ? "rd"
                                        : "th"}{" "}
                                  Sat
                                </div>
                                <div className="flex justify-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={occData.isOff ? "default" : "outline"}
                                    onClick={() =>
                                      handleCustomOccurrenceToggle(occ, "isOff")
                                    }
                                    className="h-6 text-[10px] px-2"
                                  >
                                    {occData.isOff ? "Off" : "Work"}
                                  </Button>
                                </div>
                                {occData.isOff && (
                                  <div className="flex items-center justify-center gap-1 text-[10px]">
                                    <Switch
                                      checked={occData.isPaid}
                                      onCheckedChange={() =>
                                        handleCustomOccurrenceToggle(occ, "isPaid")
                                      }
                                      className="scale-75"
                                    />
                                    <span
                                      className={
                                        occData.isPaid
                                          ? "text-emerald-600 font-semibold"
                                          : "text-amber-600 font-semibold"
                                      }
                                    >
                                      {occData.isPaid ? "Paid" : "Unpaid"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sunday Policy Section */}
                  <div className="border rounded-lg p-4 bg-card space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          Sunday Working Policy
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          Configure whether Sunday is a paid off, unpaid off, or normal working day.
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono">
                        Rule: {policy.sundayRule}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div
                        onClick={() =>
                          setPolicy((p) => ({ ...p, sundayRule: "OFF_PAID" }))
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          policy.sundayRule === "OFF_PAID"
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "bg-muted/10 hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">
                          Paid Weekly Off
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Standard corporate model. Sunday counts towards paid days unless sandwich rule applies.
                        </p>
                      </div>

                      <div
                        onClick={() =>
                          setPolicy((p) => ({ ...p, sundayRule: "OFF_UNPAID" }))
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          policy.sundayRule === "OFF_UNPAID"
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "bg-muted/10 hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">
                          Unpaid Weekly Off
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Non-working day, but not counted towards earned paid salary days.
                        </p>
                      </div>

                      <div
                        onClick={() =>
                          setPolicy((p) => ({ ...p, sundayRule: "WORKING" }))
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          policy.sundayRule === "WORKING"
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "bg-muted/10 hover:bg-muted/30"
                        }`}
                      >
                        <div className="font-bold text-foreground">
                          Normal Working Day
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Used in Middle East or 24/7 retail/operations shifts where Sunday is a regular work day.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SANDWICH & ELIGIBILITY RULE */}
              {activeTab === "sandwich" && (
                <div className="space-y-5">
                  <div className="border rounded-lg p-4 bg-card space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                          Attendance Eligibility (Sandwich Rule)
                        </h3>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          Enforce attendance conditions on surrounding working days to earn paid weekly offs.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={policy.sandwichRuleEnabled}
                          onCheckedChange={(checked) =>
                            setPolicy((p) => ({
                              ...p,
                              sandwichRuleEnabled: checked,
                            }))
                          }
                        />
                        <span className="font-bold text-xs">
                          {policy.sandwichRuleEnabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-800 dark:text-amber-300 text-xs flex gap-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          Why the Sandwich Rule is Crucial:
                        </p>
                        <p className="mt-0.5">
                          Without this rule, employees who join mid-month and have 0 attendance, or employees on unauthorized absenteeism, would unconditionally receive free pay for all Saturdays, Sundays, and holidays!
                        </p>
                      </div>
                    </div>

                    {policy.sandwichRuleEnabled && (
                      <div className="space-y-3 pt-2">
                        <label className="font-semibold block">
                          Eligibility Requirement Strategy
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div
                            onClick={() =>
                              setPolicy((p) => ({
                                ...p,
                                sandwichRuleType: "BOTH_DAYS",
                              }))
                            }
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              policy.sandwichRuleType === "BOTH_DAYS"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>Both Days (Full Sandwich Rule)</span>
                              <Badge variant="outline" className="text-[10px]">
                                Strict
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Employee must be present or on approved paid leave on BOTH the preceding working day (e.g. Friday) and succeeding working day (e.g. Monday).
                            </p>
                          </div>

                          <div
                            onClick={() =>
                              setPolicy((p) => ({
                                ...p,
                                sandwichRuleType: "EITHER_DAY",
                              }))
                            }
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              policy.sandwichRuleType === "EITHER_DAY"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span>At Least One Day</span>
                              <Badge variant="outline" className="text-[10px]">
                                Flexible
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Weekly off is paid if employee attends on EITHER the preceding day OR the succeeding working day.
                            </p>
                          </div>

                          <div
                            onClick={() =>
                              setPolicy((p) => ({
                                ...p,
                                sandwichRuleType: "BEFORE_DAY",
                              }))
                            }
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              policy.sandwichRuleType === "BEFORE_DAY"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            <div className="font-bold">Preceding Working Day Only</div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Paid if employee was present or on approved leave on the working day immediately before the weekly off.
                            </p>
                          </div>

                          <div
                            onClick={() =>
                              setPolicy((p) => ({
                                ...p,
                                sandwichRuleType: "AFTER_DAY",
                              }))
                            }
                            className={`p-3 border rounded-lg cursor-pointer transition-all ${
                              policy.sandwichRuleType === "AFTER_DAY"
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "bg-muted/10 hover:bg-muted/30"
                            }`}
                          >
                            <div className="font-bold">Succeeding Working Day Only</div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Paid if employee is present or on approved leave on the working day immediately after the weekly off.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: SALARY DIVISORS & DEDUCTIONS */}
              {activeTab === "divisor" && (
                <div className="space-y-5">
                  <div className="border rounded-lg p-4 bg-card space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-primary" />
                        Salary Divisor Policy & Daily Rate Formula
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Define how daily wage rates and proration factors are determined.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold block mb-1">
                          Divisor Calculation Model
                        </label>
                        <NativeSelect
                          value={policy.divisorPolicy}
                          onChange={(val: string) =>
                            setPolicy((p) => ({
                              ...p,
                              divisorPolicy: val as DivisorPolicy,
                            }))
                          }
                          className="w-full text-xs"
                        >
                          <option value="CALENDAR_DAYS">
                            Calendar Days in Month (28, 29, 30, or 31)
                          </option>
                          <option value="WORKING_DAYS">
                            Scheduled Working Days (excluding weekly offs & holidays)
                          </option>
                          <option value="FIXED_30">Fixed 30 Days Divisor</option>
                          <option value="FIXED_26">Fixed 26 Days Divisor (Standard Industrial)</option>
                          <option value="PAID_DAYS">
                            Configured Paid Days (Working Days + Paid Offs + Holidays)
                          </option>
                          <option value="CUSTOM">Custom Divisor Number</option>
                        </NativeSelect>
                      </div>

                      {policy.divisorPolicy === "CUSTOM" && (
                        <div>
                          <label className="font-semibold block mb-1">
                            Custom Divisor Value (Days)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={policy.customDivisorValue || 26}
                            onChange={(e) =>
                              setPolicy((p) => ({
                                ...p,
                                customDivisorValue: parseInt(e.target.value, 10) || 26,
                              }))
                            }
                            className="text-xs"
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/30 p-3 rounded-lg border text-xs text-muted-foreground space-y-1">
                      <div className="font-semibold text-foreground">
                        Mathematical Formula:
                      </div>
                      <div className="font-mono text-primary">
                        Daily Wage Rate = Base Monthly Salary / {policy.divisorPolicy === "CUSTOM" ? policy.customDivisorValue : policy.divisorPolicy}
                      </div>
                      <div className="font-mono text-emerald-600 dark:text-emerald-400">
                        Earned Gross = Daily Wage Rate × Total Earned Paid Days
                      </div>
                    </div>

                    {/* Unpaid Deduction Mode */}
                    <div className="border-t pt-3">
                      <label className="font-semibold block mb-1">
                        Unpaid Weekly Off Deduction Treatment
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <div
                          onClick={() =>
                            setPolicy((p) => ({
                              ...p,
                              unpaidWeekOffDeductionMode: "EXCLUDE_FROM_PAID_DAYS",
                            }))
                          }
                          className={`p-3 border rounded-lg cursor-pointer ${
                            policy.unpaidWeekOffDeductionMode ===
                            "EXCLUDE_FROM_PAID_DAYS"
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "bg-muted/10 hover:bg-muted/30"
                          }`}
                        >
                          <div className="font-bold">
                            Exclude from Paid Days (Recommended)
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Cleanly omitted from earned days. Prevents double deductions and accurately reflects working earnings.
                          </p>
                        </div>

                        <div
                          onClick={() =>
                            setPolicy((p) => ({
                              ...p,
                              unpaidWeekOffDeductionMode: "DEDUCT_AS_LOP",
                            }))
                          }
                          className={`p-3 border rounded-lg cursor-pointer ${
                            policy.unpaidWeekOffDeductionMode === "DEDUCT_AS_LOP"
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "bg-muted/10 hover:bg-muted/30"
                          }`}
                        >
                          <div className="font-bold">Deduct as LOP Penalty</div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Treats failed sandwich weekly offs as an explicit Loss of Pay deduction against full monthly gross.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LIVE CALENDAR PREVIEW */}
              {activeTab === "preview" && (
                <div className="space-y-4">
                  {/* Month Switcher Header */}
                  <div className="flex items-center justify-between bg-card p-3 border rounded-lg shadow-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handlePrevMonth}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="font-bold text-sm min-w-[140px] text-center">
                        {monthNames[previewMonth - 1]} {previewYear}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleNextMonth}
                        className="h-8 w-8 p-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Summary Counters */}
                    {previewData && (
                      <div className="flex items-center gap-3 text-xs">
                        <div className="border px-2.5 py-1 rounded bg-muted/20">
                          <span className="text-muted-foreground">Working: </span>
                          <span className="font-bold text-foreground">
                            {previewData.workingDays}
                          </span>
                        </div>
                        <div className="border px-2.5 py-1 rounded bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
                          <span className="text-blue-700 dark:text-blue-300">Paid Off: </span>
                          <span className="font-bold text-blue-700 dark:text-blue-300">
                            {previewData.paidWeeklyOffs}
                          </span>
                        </div>
                        <div className="border px-2.5 py-1 rounded bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
                          <span className="text-amber-700 dark:text-amber-300">Unpaid Off: </span>
                          <span className="font-bold text-amber-700 dark:text-amber-300">
                            {previewData.unpaidWeeklyOffs}
                          </span>
                        </div>
                        <div className="border px-2.5 py-1 rounded bg-purple-50/50 dark:bg-purple-950/20 border-purple-200">
                          <span className="text-purple-700 dark:text-purple-300">Holidays: </span>
                          <span className="font-bold text-purple-700 dark:text-purple-300">
                            {previewData.paidHolidays}
                          </span>
                        </div>
                        <div className="border px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
                          <span className="text-emerald-800 dark:text-emerald-300">Total Paid Days: </span>
                          <span className="font-bold text-emerald-600 font-mono">
                            {previewData.totalPaidDays} / {previewData.totalCalendarDays}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calendar Grid */}
                  {isPreviewLoading ? (
                    <div className="text-center py-16 text-muted-foreground">
                      Calculating schedule layout...
                    </div>
                  ) : previewData?.days ? (
                    <div className="border rounded-lg overflow-hidden bg-card">
                      {/* Day of Week Headers */}
                      <div className="grid grid-cols-7 border-b bg-muted/60 text-center font-bold text-xs py-2">
                        <div className="text-rose-600">Sun</div>
                        <div>Mon</div>
                        <div>Tue</div>
                        <div>Wed</div>
                        <div>Thu</div>
                        <div>Fri</div>
                        <div className="text-blue-600">Sat</div>
                      </div>

                      {/* Day Cells Grid */}
                      <div className="grid grid-cols-7 divide-x divide-y border-b text-xs">
                        {/* Leading empty cells for month offset */}
                        {(() => {
                          const firstDayOfMonth = new Date(previewYear, previewMonth - 1, 1).getDay();
                          return Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[75px] bg-muted/10 p-1" />
                          ));
                        })()}

                        {previewData.days.map((d: any) => {
                          const isHoliday = d.isHoliday;
                          const isPaidOff = d.status === "PAID_WEEK_OFF";
                          const isUnpaidOff = d.status === "UNPAID_WEEK_OFF";
                          const isWorking = d.status === "WORKING_DAY";

                          let bgClass = "bg-card";
                          if (isHoliday) bgClass = "bg-purple-50/50 dark:bg-purple-950/20";
                          else if (isPaidOff) bgClass = "bg-blue-50/40 dark:bg-blue-950/20";
                          else if (isUnpaidOff) bgClass = "bg-amber-50/40 dark:bg-amber-950/20";

                          return (
                            <div
                              key={d.date}
                              className={`min-h-[75px] p-2 flex flex-col justify-between transition-colors ${bgClass}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-foreground">
                                  {d.day}
                                </span>
                                {isHoliday ? (
                                  <Badge className="bg-purple-600 text-white text-[9px] py-0 px-1">
                                    Holiday
                                  </Badge>
                                ) : isPaidOff ? (
                                  <Badge className="bg-blue-600 text-white text-[9px] py-0 px-1">
                                    Paid Off
                                  </Badge>
                                ) : isUnpaidOff ? (
                                  <Badge className="bg-amber-600 text-white text-[9px] py-0 px-1">
                                    Unpaid Off
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] py-0 px-1">
                                    Work
                                  </Badge>
                                )}
                              </div>

                              <div className="text-[10px] text-muted-foreground truncate" title={d.reason}>
                                {d.holidayName || d.reason}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 border-t bg-muted/10 flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => saveMutation.mutate(policy)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
