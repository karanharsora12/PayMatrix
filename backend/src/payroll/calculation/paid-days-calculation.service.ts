import { Injectable } from '@nestjs/common';
import {
  CompanyWorkPolicy,
  DEFAULT_WORK_POLICY,
  DivisorPolicy,
} from '../../companies/work-policy.types';

export type PayrollProrationPolicy =
  | 'CALENDAR_DAYS'
  | 'WORKING_DAYS'
  | 'FIXED_MONTHLY'
  | 'FIXED_30'
  | 'FIXED_26'
  | 'PAID_DAYS'
  | 'CUSTOM';

export interface EmployeeWorkforceInfo {
  id: string;
  employeeCode?: string;
  joiningDate?: string | Date | null;
  lastWorkingDate?: string | Date | null;
}

export interface PayrollPeriodInfo {
  year: number;
  month: number; // 1-12
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
}

export interface AttendanceRecordItem {
  attendanceDate: string; // YYYY-MM-DD
  status: string; // 'PRESENT' | 'HALF_DAY' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF'
  overtimeMinutes?: number | null;
}

export interface LeaveRequestItem {
  fromDate: string;
  toDate: string;
  totalDays?: number | string | null;
  isPaid?: boolean | null;
}

export interface HolidayItem {
  holidayDate: string;
  name?: string;
  isPaid?: boolean;
}

export interface ShiftAssignmentItem {
  effectiveFrom: string;
  effectiveTo?: string | null;
  shift: {
    code: string;
    name: string;
    workingHours?: string | number | null;
    isNightShift?: boolean;
    isActive?: boolean;
  };
}

export interface DailyReconciliationItem {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  attendanceStatus?: string | null;
  leaveStatus?: string | null;
  isHoliday: boolean;
  holidayName?: string | null;
  isWeekend: boolean;
  finalStatus: string;
  isPayable: boolean;
  payableFraction: number;
  reason: string;
}

export interface PaidDaysResult {
  calendarDays: number;
  eligibleCalendarDays: number;
  workingDays: number;
  eligibleWorkingDays: number;
  presentDays: number;
  halfDays: number;
  lateDays: number;
  absentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  holidayDays: number;
  paidHolidayDays: number;
  unpaidHolidayDays: number;
  weekOffDays: number;
  paidWeekOffDays: number;
  unpaidWeekOffDays: number;
  unpaidLossOfPayDays: number;
  paidDays: number;
  payableFactor: number;
  divisor: number;
  divisorPolicy: string;
  dailyRate?: number;
  overtimeMinutes: number;
  dailyTimeline?: DailyReconciliationItem[];
}

@Injectable()
export class PaidDaysCalculationService {
  /**
   * Evaluates if a given date is a scheduled weekly off for the company.
   */
  isScheduledWeeklyOff(
    date: Date,
    workPolicy: CompanyWorkPolicy = DEFAULT_WORK_POLICY,
  ): { isOff: boolean; isPaid: boolean; patternDescription: string } {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfMonth = date.getDate();
    const occurrence = Math.ceil(dayOfMonth / 7); // 1st, 2nd, 3rd, 4th, 5th occurrence

    // 1. Saturday policy evaluation
    if (dayOfWeek === 6) {
      const rule = workPolicy.saturdayRule || 'SECOND_FOURTH_OFF';
      const isPaid = workPolicy.saturdayPaid ?? true;

      switch (rule) {
        case 'ALL_WORKING':
          return { isOff: false, isPaid: false, patternDescription: 'Saturday (Working Day)' };

        case 'ALL_OFF':
          return {
            isOff: true,
            isPaid,
            patternDescription: `Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
          };

        case 'FIRST_THIRD_OFF': {
          if (occurrence === 1 || occurrence === 3) {
            return {
              isOff: true,
              isPaid,
              patternDescription: `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
            };
          }
          if (occurrence === 5) {
            const is5thOff =
              workPolicy.saturday5thRule === 'OFF' ||
              workPolicy.saturday5thRule === 'FOLLOW_PATTERN';
            return {
              isOff: is5thOff,
              isPaid: is5thOff ? isPaid : false,
              patternDescription: is5thOff
                ? `5th Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
                : '5th Saturday (Working Day)',
            };
          }
          return {
            isOff: false,
            isPaid: false,
            patternDescription: `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
          };
        }

        case 'SECOND_FOURTH_OFF': {
          if (occurrence === 2 || occurrence === 4) {
            return {
              isOff: true,
              isPaid,
              patternDescription: `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
            };
          }
          if (occurrence === 5) {
            const is5thOff = workPolicy.saturday5thRule === 'OFF';
            return {
              isOff: is5thOff,
              isPaid: is5thOff ? isPaid : false,
              patternDescription: is5thOff
                ? `5th Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
                : '5th Saturday (Working Day)',
            };
          }
          return {
            isOff: false,
            isPaid: false,
            patternDescription: `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
          };
        }

        case 'ALTERNATE_OFF': {
          const isOff = occurrence % 2 !== 0; // 1st, 3rd, 5th
          return {
            isOff,
            isPaid: isOff ? isPaid : false,
            patternDescription: isOff
              ? `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
              : `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
          };
        }

        case 'CUSTOM': {
          const custom = workPolicy.saturdayCustomOccurrences?.find(
            (c) => c.occurrence === occurrence,
          );
          if (custom) {
            return {
              isOff: custom.isOff,
              isPaid: custom.isOff ? custom.isPaid : false,
              patternDescription: custom.isOff
                ? `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (${custom.isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
                : `${occurrence}${this.getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
            };
          }
          return { isOff: false, isPaid: false, patternDescription: 'Saturday (Working Day)' };
        }

        default:
          return { isOff: true, isPaid, patternDescription: 'Saturday (Weekly Off)' };
      }
    }

    // 2. Sunday policy evaluation
    if (dayOfWeek === 0) {
      const sunRule = workPolicy.sundayRule || 'OFF_PAID';
      if (sunRule === 'WORKING') {
        return { isOff: false, isPaid: false, patternDescription: 'Sunday (Working Day)' };
      }
      const isPaid = sunRule === 'OFF_PAID';
      return {
        isOff: true,
        isPaid,
        patternDescription: `Sunday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
      };
    }

    // 3. Mon–Fri and custom day configs
    const dayCfg = workPolicy.weeklyOffPolicy?.find((p) => p.dayOfWeek === dayOfWeek);
    if (dayCfg && dayCfg.type === 'WEEK_OFF') {
      return {
        isOff: true,
        isPaid: dayCfg.isPaid ?? true,
        patternDescription: `${dayCfg.name} (${dayCfg.isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
      };
    }

    return { isOff: false, isPaid: false, patternDescription: 'Working Day' };
  }

  /**
   * Pure calculation of attendance, workforce presence, leaves, and proration factor.
   */
  calculatePaidDays(
    employee: EmployeeWorkforceInfo,
    period: PayrollPeriodInfo,
    attendanceList: AttendanceRecordItem[],
    leaveList: LeaveRequestItem[],
    holidayList: HolidayItem[],
    shiftList: ShiftAssignmentItem[],
    prorationOverride?: PayrollProrationPolicy,
    companyWorkPolicy: CompanyWorkPolicy = DEFAULT_WORK_POLICY,
  ): PaidDaysResult {
    const { year, month } = period;
    const totalCalendarDays = new Date(year, month, 0).getDate();

    // 1. Determine string bounds for period and employee eligibility window
    const periodStartStr = this.formatDate(period.periodStart);
    const periodEndStr = this.formatDate(period.periodEnd);

    let effectiveStartStr = periodStartStr;
    if (employee.joiningDate) {
      const joinStr = this.formatDate(employee.joiningDate);
      if (joinStr > effectiveStartStr) {
        effectiveStartStr = joinStr;
      }
    }

    let effectiveEndStr = periodEndStr;
    if (employee.lastWorkingDate) {
      const exitStr = this.formatDate(employee.lastWorkingDate);
      if (exitStr < effectiveEndStr) {
        effectiveEndStr = exitStr;
      }
    }

    // Map of holiday date strings (YYYY-MM-DD)
    const holidayMap = new Map<string, HolidayItem>();
    for (const h of holidayList) {
      holidayMap.set(this.formatDate(h.holidayDate), h);
    }

    // Map applicable shift per date
    const shiftMap = new Map<string, ShiftAssignmentItem>();
    for (let day = 1; day <= totalCalendarDays; day++) {
      const dateStr = this.toDateStr(year, month, day);
      const applicableShift = shiftList.find((s) => {
        const fromStr = this.formatDate(s.effectiveFrom);
        const toStr = s.effectiveTo ? this.formatDate(s.effectiveTo) : null;
        return fromStr <= dateStr && (!toStr || toStr >= dateStr);
      });
      if (applicableShift) shiftMap.set(dateStr, applicableShift);
    }

    // 2. Pre-calculate calendar days attributes for the whole month
    interface DayCalendarMeta {
      dateStr: string;
      d: Date;
      isHoliday: boolean;
      holidayItem?: HolidayItem;
      isWeeklyOff: boolean;
      isPolicyPaidWeeklyOff: boolean;
      isScheduledWorkingDay: boolean;
      patternDesc: string;
    }

    const calendarMeta: DayCalendarMeta[] = [];
    let totalCompanyWorkingDays = 0;
    let eligibleWorkingDays = 0;
    let eligibleCalendarDays = 0;
    let totalScheduledWeeklyOffs = 0;
    let totalScheduledPaidWeeklyOffs = 0;
    let totalScheduledUnpaidWeeklyOffs = 0;
    let totalScheduledHolidays = 0;

    for (let day = 1; day <= totalCalendarDays; day++) {
      const d = new Date(year, month - 1, day);
      const dateStr = this.toDateStr(year, month, day);
      const holidayItem = holidayMap.get(dateStr);
      const isHoliday = !!holidayItem;

      const offEvaluation = this.isScheduledWeeklyOff(d, companyWorkPolicy);
      let isWeeklyOff = offEvaluation.isOff;
      let isPolicyPaidWeeklyOff = offEvaluation.isPaid;

      // Shift override check
      const shiftForDay = shiftMap.get(dateStr);
      if (shiftForDay && shiftForDay.shift && shiftForDay.shift.isActive !== undefined) {
        if (shiftForDay.shift.isActive === false) {
          isWeeklyOff = true;
          isPolicyPaidWeeklyOff = companyWorkPolicy.saturdayPaid ?? true;
        }
      }

      const isScheduledWorkingDay = !isWeeklyOff && !isHoliday;

      if (isScheduledWorkingDay) {
        totalCompanyWorkingDays++;
      }
      if (isHoliday) {
        totalScheduledHolidays++;
      }
      if (isWeeklyOff) {
        totalScheduledWeeklyOffs++;
        if (isPolicyPaidWeeklyOff) totalScheduledPaidWeeklyOffs++;
        else totalScheduledUnpaidWeeklyOffs++;
      }

      if (dateStr >= effectiveStartStr && dateStr <= effectiveEndStr) {
        eligibleCalendarDays++;
        if (isScheduledWorkingDay) {
          eligibleWorkingDays++;
        }
      }

      calendarMeta.push({
        dateStr,
        d,
        isHoliday,
        holidayItem,
        isWeeklyOff,
        isPolicyPaidWeeklyOff,
        isScheduledWorkingDay,
        patternDesc: offEvaluation.patternDescription,
      });
    }

    if (totalCompanyWorkingDays <= 0) totalCompanyWorkingDays = 22; // fallback safety
    if (eligibleCalendarDays < 0) eligibleCalendarDays = 0;

    // 3. Build Attendance & Leave Maps for Employee
    const attendanceDateMap = new Map<string, AttendanceRecordItem>();
    let overtimeMinutes = 0;
    for (const att of attendanceList) {
      const dStr = this.formatDate(att.attendanceDate);
      attendanceDateMap.set(dStr, att);
      overtimeMinutes += Number(att.overtimeMinutes ?? 0);
    }

    const leaveDateMap = new Map<string, { isPaid: boolean }>();
    for (const req of leaveList) {
      const fromStr = this.formatDate(req.fromDate);
      const toStr = this.formatDate(req.toDate);
      const isPaid = req.isPaid ?? true;

      for (let day = 1; day <= totalCalendarDays; day++) {
        const dateStr = this.toDateStr(year, month, day);
        if (dateStr >= fromStr && dateStr <= toStr) {
          leaveDateMap.set(dateStr, { isPaid });
        }
      }
    }

    // Helper: is employee in attendance or approved paid leave on a given date?
    const isEmployeePresentOrExcused = (targetDateStr: string): boolean => {
      if (targetDateStr < effectiveStartStr || targetDateStr > effectiveEndStr) {
        return false;
      }
      const leave = leaveDateMap.get(targetDateStr);
      if (leave && leave.isPaid) return true;

      const att = attendanceDateMap.get(targetDateStr);
      if (att && ['PRESENT', 'HALF_DAY', 'LATE'].includes(att.status)) return true;

      return false;
    };

    // Helper: evaluate sandwich rule for a weekly off
    const evaluateSandwichRule = (
      metaIndex: number,
    ): { passesSandwichRule: boolean; reason: string } => {
      if (!companyWorkPolicy.sandwichRuleEnabled) {
        return { passesSandwichRule: true, reason: 'Sandwich rule disabled' };
      }

      // Find closest preceding scheduled working day
      let prevWorkingDateStr: string | null = null;
      for (let i = metaIndex - 1; i >= 0; i--) {
        if (calendarMeta[i].isScheduledWorkingDay) {
          prevWorkingDateStr = calendarMeta[i].dateStr;
          break;
        }
      }

      // Find closest succeeding scheduled working day
      let nextWorkingDateStr: string | null = null;
      for (let i = metaIndex + 1; i < calendarMeta.length; i++) {
        if (calendarMeta[i].isScheduledWorkingDay) {
          nextWorkingDateStr = calendarMeta[i].dateStr;
          break;
        }
      }

      const prevOk = prevWorkingDateStr ? isEmployeePresentOrExcused(prevWorkingDateStr) : false;
      const nextOk = nextWorkingDateStr ? isEmployeePresentOrExcused(nextWorkingDateStr) : false;

      const ruleType = companyWorkPolicy.sandwichRuleType || 'BOTH_DAYS';

      switch (ruleType) {
        case 'BOTH_DAYS': {
          const pass = prevOk && nextOk;
          return {
            passesSandwichRule: pass,
            reason: pass
              ? 'Sandwich Rule satisfied (present on adjacent working days)'
              : `Sandwich Rule not met: requires attendance on surrounding days (${prevWorkingDateStr || 'N/A'}: ${prevOk ? 'Yes' : 'No'}, ${nextWorkingDateStr || 'N/A'}: ${nextOk ? 'Yes' : 'No'})`,
          };
        }
        case 'EITHER_DAY': {
          const pass = prevOk || nextOk;
          return {
            passesSandwichRule: pass,
            reason: pass
              ? 'Sandwich Rule satisfied (present on at least one adjacent day)'
              : 'Sandwich Rule not met: absent on both adjacent working days',
          };
        }
        case 'BEFORE_DAY': {
          return {
            passesSandwichRule: prevOk,
            reason: prevOk
              ? 'Sandwich Rule satisfied (present on preceding working day)'
              : `Sandwich Rule not met: absent on preceding working day (${prevWorkingDateStr || 'N/A'})`,
          };
        }
        case 'AFTER_DAY': {
          return {
            passesSandwichRule: nextOk,
            reason: nextOk
              ? 'Sandwich Rule satisfied (present on succeeding working day)'
              : `Sandwich Rule not met: absent on succeeding working day (${nextWorkingDateStr || 'N/A'})`,
          };
        }
        default:
          return { passesSandwichRule: true, reason: 'Valid' };
      }
    };

    // 4. Daily Timeline Construction and Classification
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyTimeline: DailyReconciliationItem[] = [];

    let presentDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let holidayDays = 0;
    let paidHolidayDays = 0;
    let unpaidHolidayDays = 0;
    let weekOffDays = 0;
    let paidWeekOffDays = 0;
    let unpaidWeekOffDays = 0;

    for (let i = 0; i < calendarMeta.length; i++) {
      const meta = calendarMeta[i];
      const dateStr = meta.dateStr;
      const dayOfWeek = dayNames[meta.d.getDay()];

      // Before joining date
      if (dateStr < effectiveStartStr) {
        dailyTimeline.push({
          date: dateStr,
          dayOfWeek,
          attendanceStatus: null,
          leaveStatus: null,
          isHoliday: meta.isHoliday,
          holidayName: meta.holidayItem?.name || null,
          isWeekend: meta.isWeeklyOff,
          finalStatus: 'BEFORE_JOINING',
          isPayable: false,
          payableFraction: 0,
          reason: 'Employee joined later in the period',
        });
        continue;
      }

      // After exit date
      if (dateStr > effectiveEndStr) {
        dailyTimeline.push({
          date: dateStr,
          dayOfWeek,
          attendanceStatus: null,
          leaveStatus: null,
          isHoliday: meta.isHoliday,
          holidayName: meta.holidayItem?.name || null,
          isWeekend: meta.isWeeklyOff,
          finalStatus: 'AFTER_EXIT',
          isPayable: false,
          payableFraction: 0,
          reason: 'Employee relieved / exited earlier',
        });
        continue;
      }

      const attRecord = attendanceDateMap.get(dateStr);
      const leaveRecord = leaveDateMap.get(dateStr);

      let finalStatus = 'PRESENT';
      let isPayable = true;
      let payableFraction = 1.0;
      let reason = 'Present';

      // 1. Approved Leave
      if (leaveRecord) {
        if (leaveRecord.isPaid) {
          finalStatus = 'PAID_LEAVE';
          isPayable = true;
          payableFraction = 1.0;
          reason = 'Approved Paid Leave';
          paidLeaveDays += 1;
        } else {
          finalStatus = 'UNPAID_LEAVE';
          isPayable = false;
          payableFraction = 0;
          reason = 'Approved Unpaid Leave (LOP)';
          unpaidLeaveDays += 1;
        }
      }
      // 2. Explicit Attendance Punch Record
      else if (attRecord) {
        switch (attRecord.status) {
          case 'PRESENT':
            finalStatus = 'PRESENT';
            isPayable = true;
            payableFraction = 1.0;
            reason = 'Attendance Marked Present';
            presentDays += 1;
            break;
          case 'LATE':
            finalStatus = 'LATE';
            isPayable = true;
            payableFraction = 1.0;
            reason = 'Late Arrival (Payable)';
            lateDays += 1;
            break;
          case 'HALF_DAY':
            finalStatus = 'HALF_DAY';
            isPayable = true;
            payableFraction = 0.5;
            reason = 'Half Day (0.5 Payable)';
            halfDays += 1;
            break;
          case 'ABSENT':
            finalStatus = 'ABSENT';
            isPayable = false;
            payableFraction = 0;
            reason = 'Attendance Marked Absent (LOP)';
            absentDays += 1;
            break;
          case 'HOLIDAY':
            finalStatus = 'PAID_HOLIDAY';
            isPayable = true;
            payableFraction = 1.0;
            reason = meta.holidayItem?.name || 'Company Holiday';
            holidayDays += 1;
            paidHolidayDays += 1;
            break;
          case 'WEEK_OFF': {
            weekOffDays += 1;
            const sandwich = evaluateSandwichRule(i);
            const isPaid = meta.isPolicyPaidWeeklyOff && sandwich.passesSandwichRule;
            if (isPaid) {
              finalStatus = 'PAID_WEEK_OFF';
              isPayable = true;
              payableFraction = 1.0;
              reason = `${meta.patternDesc} (Paid)`;
              paidWeekOffDays += 1;
            } else {
              finalStatus = 'UNPAID_WEEK_OFF';
              isPayable = false;
              payableFraction = 0;
              reason = sandwich.passesSandwichRule
                ? `${meta.patternDesc} (Unpaid Policy)`
                : sandwich.reason;
              unpaidWeekOffDays += 1;
            }
            break;
          }
          default:
            finalStatus = attRecord.status;
            isPayable = true;
            payableFraction = 1.0;
            reason = attRecord.status;
            presentDays += 1;
            break;
        }
      }
      // 3. Holiday
      else if (meta.isHoliday) {
        holidayDays += 1;
        const isPaidHoliday = meta.holidayItem?.isPaid ?? true;
        if (isPaidHoliday) {
          finalStatus = 'PAID_HOLIDAY';
          isPayable = true;
          payableFraction = 1.0;
          reason = meta.holidayItem?.name || 'Public Holiday';
          paidHolidayDays += 1;
        } else {
          finalStatus = 'UNPAID_HOLIDAY';
          isPayable = false;
          payableFraction = 0;
          reason = `${meta.holidayItem?.name || 'Public Holiday'} (Unpaid)`;
          unpaidHolidayDays += 1;
        }
      }
      // 4. Scheduled Weekly Off
      else if (meta.isWeeklyOff) {
        weekOffDays += 1;
        const sandwich = evaluateSandwichRule(i);
        const isPaid = meta.isPolicyPaidWeeklyOff && sandwich.passesSandwichRule;
        if (isPaid) {
          finalStatus = 'PAID_WEEK_OFF';
          isPayable = true;
          payableFraction = 1.0;
          reason = `${meta.patternDesc} (Paid)`;
          paidWeekOffDays += 1;
        } else {
          finalStatus = 'UNPAID_WEEK_OFF';
          isPayable = false;
          payableFraction = 0;
          reason = sandwich.passesSandwichRule
            ? `${meta.patternDesc} (Unpaid Policy)`
            : sandwich.reason;
          unpaidWeekOffDays += 1;
        }
      }
      // 5. Scheduled Working Day with No Attendance Record
      else {
        // If there were attendance records logged in the company/employee period and this date is missing
        if (attendanceList.length > 0) {
          finalStatus = 'ABSENT';
          isPayable = false;
          payableFraction = 0;
          reason = 'No attendance recorded (Absent)';
          absentDays += 1;
        } else {
          // If no punches system-wide, assume standard working day
          finalStatus = 'PRESENT';
          isPayable = true;
          payableFraction = 1.0;
          reason = 'Standard Working Day';
          presentDays += 1;
        }
      }

      dailyTimeline.push({
        date: dateStr,
        dayOfWeek,
        attendanceStatus: attRecord?.status || null,
        leaveStatus: leaveRecord ? (leaveRecord.isPaid ? 'PAID_LEAVE' : 'UNPAID_LEAVE') : null,
        isHoliday: meta.isHoliday,
        holidayName: meta.holidayItem?.name || null,
        isWeekend: meta.isWeeklyOff,
        finalStatus,
        isPayable,
        payableFraction,
        reason,
      });
    }

    // 5. Total Paid Days Sum
    const rawPaidDays =
      presentDays +
      lateDays +
      halfDays * 0.5 +
      paidLeaveDays +
      paidHolidayDays +
      paidWeekOffDays;

    const paidDays = Math.min(
      eligibleCalendarDays,
      Math.max(0, Math.round(rawPaidDays * 100) / 100),
    );

    const unpaidLossOfPayDays =
      unpaidLeaveDays + absentDays + unpaidWeekOffDays + unpaidHolidayDays;

    // 6. Configurable Divisor & Payable Factor Evaluation
    const divisorPolicy: DivisorPolicy =
      (prorationOverride as DivisorPolicy) ||
      companyWorkPolicy.divisorPolicy ||
      'CALENDAR_DAYS';

    let divisor = totalCalendarDays;
    let divisorPolicyName = 'Calendar Days';

    switch (divisorPolicy) {
      case 'CALENDAR_DAYS':
        divisor = totalCalendarDays;
        divisorPolicyName = `Calendar Days (${totalCalendarDays})`;
        break;

      case 'WORKING_DAYS':
        divisor = totalCompanyWorkingDays > 0 ? totalCompanyWorkingDays : 22;
        divisorPolicyName = `Working Days (${divisor})`;
        break;

      case 'FIXED_30':
        divisor = 30;
        divisorPolicyName = 'Fixed (30 Days)';
        break;

      case 'FIXED_26':
        divisor = 26;
        divisorPolicyName = 'Fixed (26 Days)';
        break;

      case 'PAID_DAYS':
        divisor = totalCompanyWorkingDays + totalScheduledPaidWeeklyOffs + totalScheduledHolidays;
        if (divisor <= 0) divisor = totalCalendarDays;
        divisorPolicyName = `Configured Paid Days (${divisor})`;
        break;

      case 'CUSTOM':
        divisor = companyWorkPolicy.customDivisorValue || 26;
        divisorPolicyName = `Custom Divisor (${divisor})`;
        break;

      case 'FIXED_MONTHLY':
      default:
        divisor = totalCalendarDays;
        divisorPolicyName = `Calendar Days (${totalCalendarDays})`;
        break;
    }

    let payableFactor = 0;
    if (divisor > 0) {
      // If employee had 0 paid days, payable factor is strictly 0
      if (paidDays <= 0) {
        payableFactor = 0;
      } else if (divisorPolicy === 'WORKING_DAYS') {
        const earnedWorking = presentDays + lateDays + halfDays * 0.5 + paidLeaveDays;
        payableFactor = Math.min(1.0, Math.max(0, earnedWorking / divisor));
      } else {
        payableFactor = Math.min(1.0, Math.max(0, paidDays / divisor));
      }
    }

    payableFactor = Math.min(1.0, Math.max(0.0, Math.round(payableFactor * 10000) / 10000));

    return {
      calendarDays: totalCalendarDays,
      eligibleCalendarDays,
      workingDays: totalCompanyWorkingDays,
      eligibleWorkingDays,
      presentDays,
      halfDays,
      lateDays,
      absentDays,
      paidLeaveDays,
      unpaidLeaveDays,
      holidayDays,
      paidHolidayDays,
      unpaidHolidayDays,
      weekOffDays,
      paidWeekOffDays,
      unpaidWeekOffDays,
      unpaidLossOfPayDays,
      paidDays,
      payableFactor,
      divisor,
      divisorPolicy: divisorPolicyName,
      overtimeMinutes,
      dailyTimeline,
    };
  }

  private getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  private toDateStr(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private formatDate(val: string | Date): string {
    if (typeof val === 'string') return val.slice(0, 10);
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
