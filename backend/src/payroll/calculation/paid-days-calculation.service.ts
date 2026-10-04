import { Injectable } from '@nestjs/common';

export type PayrollProrationPolicy = 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY';

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
  weekOffDays: number;
  paidDays: number;
  payableFactor: number;
  overtimeMinutes: number;
  dailyTimeline?: DailyReconciliationItem[];
}

@Injectable()
export class PaidDaysCalculationService {
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
    policy: PayrollProrationPolicy = 'CALENDAR_DAYS',
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

    // Set of holiday date strings (YYYY-MM-DD)
    const holidayDates = new Set(holidayList.map((h) => this.formatDate(h.holidayDate)));

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

    // Count standard working days and eligible working days
    let totalCompanyWorkingDays = 0;
    let eligibleWorkingDays = 0;
    let eligibleCalendarDays = 0;

    for (let day = 1; day <= totalCalendarDays; day++) {
      const d = new Date(year, month - 1, day);
      const dateStr = this.toDateStr(year, month, day);
      const isHoliday = holidayDates.has(dateStr);
      
      const shiftForDay = shiftMap.get(dateStr);
      let isWeekend = d.getDay() === 0 || d.getDay() === 6; // Default fallback to Sat/Sun
      if (shiftForDay && shiftForDay.shift && shiftForDay.shift.isActive !== undefined) {
         // Some companies use shift configuration to define week off. 
         // If a specific shift pattern defines working days, we can adapt here. 
         // For now, if there is an explicit shift, we consider it a working day unless it's explicitly inactive.
         if (shiftForDay.shift.isActive === false) isWeekend = true;
      }

      if (!isWeekend && !isHoliday) {
        totalCompanyWorkingDays++;
      }

      if (dateStr >= effectiveStartStr && dateStr <= effectiveEndStr) {
        eligibleCalendarDays++;
        if (!isWeekend && !isHoliday) {
          eligibleWorkingDays++;
        }
      }
    }

    if (totalCompanyWorkingDays <= 0) totalCompanyWorkingDays = 22; // fallback safety
    if (eligibleCalendarDays < 0) eligibleCalendarDays = 0;

    // 2. Aggregate Attendance in period
    let presentDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let loggedHolidays = 0;
    let loggedWeekOffs = 0;
    let overtimeMinutes = 0;

    const attendanceDateMap = new Map<string, AttendanceRecordItem>();
    for (const att of attendanceList) {
      const dStr = this.formatDate(att.attendanceDate);
      attendanceDateMap.set(dStr, att);
      overtimeMinutes += Number(att.overtimeMinutes ?? 0);

      // Only count attendance within effective employment window
      if (dStr >= effectiveStartStr && dStr <= effectiveEndStr) {
        switch (att.status) {
          case 'PRESENT':
            presentDays++;
            break;
          case 'HALF_DAY':
            halfDays++;
            break;
          case 'LATE':
            lateDays++;
            break;
          case 'ABSENT':
            absentDays++;
            break;
          case 'HOLIDAY':
            loggedHolidays++;
            break;
          case 'WEEK_OFF':
            loggedWeekOffs++;
            break;
          default:
            break;
        }
      }
    }

    // 3. Aggregate Approved Leaves overlapping period
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    for (const req of leaveList) {
      const isPaid = req.isPaid ?? true;
      const total = Number(req.totalDays ?? 1);
      if (isPaid) {
        paidLeaveDays += total;
      } else {
        unpaidLeaveDays += total;
      }
    }

    // 4. Calculate Holiday & Week-Off presence if not explicitly in attendance logs
    let holidayDays = loggedHolidays;
    let weekOffDays = loggedWeekOffs;

    if (loggedHolidays === 0 || loggedWeekOffs === 0) {
      let deducedHolidays = 0;
      let deducedWeekOffs = 0;

      for (let day = 1; day <= totalCalendarDays; day++) {
        const d = new Date(year, month - 1, day);
        const dateStr = this.toDateStr(year, month, day);
        if (dateStr >= effectiveStartStr && dateStr <= effectiveEndStr) {
          let isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const shiftForDay = shiftMap.get(dateStr);
          if (shiftForDay && shiftForDay.shift && shiftForDay.shift.isActive === false) {
             isWeekend = true;
          }
          const isHoliday = holidayDates.has(dateStr);

          // If not logged as present/absent/leave in attendance logs
          if (!attendanceDateMap.has(dateStr)) {
            if (isHoliday) deducedHolidays++;
            else if (isWeekend) deducedWeekOffs++;
          }
        }
      }

      if (loggedHolidays === 0) holidayDays = deducedHolidays;
      if (loggedWeekOffs === 0) weekOffDays = deducedWeekOffs;
    }

    // 5. Calculate Paid Days
    // Raw paid days: (Present + Late + HalfDays*0.5 + PaidLeave + Holidays + WeekOffs)
    const rawPaidDays =
      presentDays +
      lateDays +
      halfDays * 0.5 +
      paidLeaveDays +
      holidayDays +
      weekOffDays;

    // Clamp paid days to eligible calendar days
    const paidDays = Math.min(eligibleCalendarDays, Math.max(0, Math.round(rawPaidDays * 100) / 100));

    // Absent days calculation if not explicitly logged:
    const nonWorkedEligible = Math.max(0, eligibleCalendarDays - paidDays - unpaidLeaveDays);
    if (absentDays === 0 && nonWorkedEligible > 0 && attendanceList.length > 0) {
      absentDays = Math.round(nonWorkedEligible * 100) / 100;
    }

    // 6. Calculate Payable Factor based on Policy
    let payableFactor = 1.0;

    if (policy === 'CALENDAR_DAYS') {
      // Pro-rated by total calendar days in month
      payableFactor = totalCalendarDays > 0 ? paidDays / totalCalendarDays : 1.0;
    } else if (policy === 'WORKING_DAYS') {
      // Pro-rated by total working days in month
      const earnedWorkingDays = presentDays + lateDays + halfDays * 0.5 + paidLeaveDays;
      if (eligibleCalendarDays < totalCalendarDays) {
        const workingRatio = totalCompanyWorkingDays > 0 ? earnedWorkingDays / totalCompanyWorkingDays : 1.0;
        payableFactor = workingRatio;
      } else {
        const workingRatio = totalCompanyWorkingDays > 0 ? (totalCompanyWorkingDays - unpaidLeaveDays - absentDays) / totalCompanyWorkingDays : 1.0;
        payableFactor = Math.max(0, Math.min(1.0, workingRatio));
      }
    } else if (policy === 'FIXED_MONTHLY') {
      const unworkedBeforeJoinOrAfterExit = totalCalendarDays - eligibleCalendarDays;
      const totalUnpaidDays = unworkedBeforeJoinOrAfterExit + unpaidLeaveDays + absentDays;
      payableFactor = totalCalendarDays > 0 ? Math.max(0, (totalCalendarDays - totalUnpaidDays) / totalCalendarDays) : 1.0;
    }

    // 7. Build daily timeline reconciliation
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const holidayMap = new Map<string, string>();
    for (const h of holidayList) {
      holidayMap.set(this.formatDate(h.holidayDate), h.name || 'Company Holiday');
    }

    // Map leaves by date range
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

    const dailyTimeline: DailyReconciliationItem[] = [];

    for (let day = 1; day <= totalCalendarDays; day++) {
      const d = new Date(year, month - 1, day);
      const dateStr = this.toDateStr(year, month, day);
      const dayOfWeek = dayNames[d.getDay()];
      
      let isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const shiftForDay = shiftMap.get(dateStr);
      if (shiftForDay && shiftForDay.shift && shiftForDay.shift.isActive === false) {
         isWeekend = true;
      }
      
      const isHoliday = holidayDates.has(dateStr);
      const holidayName = isHoliday ? holidayMap.get(dateStr) || 'Public Holiday' : null;

      if (dateStr < effectiveStartStr) {
        dailyTimeline.push({
          date: dateStr,
          dayOfWeek,
          attendanceStatus: null,
          leaveStatus: null,
          isHoliday,
          holidayName,
          isWeekend,
          finalStatus: 'BEFORE_JOINING',
          isPayable: false,
          payableFraction: 0,
          reason: 'Joined later in period',
        });
        continue;
      }

      if (dateStr > effectiveEndStr) {
        dailyTimeline.push({
          date: dateStr,
          dayOfWeek,
          attendanceStatus: null,
          leaveStatus: null,
          isHoliday,
          holidayName,
          isWeekend,
          finalStatus: 'AFTER_EXIT',
          isPayable: false,
          payableFraction: 0,
          reason: 'Relieved / exited earlier',
        });
        continue;
      }

      const attRecord = attendanceDateMap.get(dateStr);
      const leaveRecord = leaveDateMap.get(dateStr);

      let finalStatus = 'PRESENT';
      let isPayable = true;
      let payableFraction = 1.0;
      let reason = 'Present';

      if (leaveRecord) {
        if (leaveRecord.isPaid) {
          finalStatus = 'PAID_LEAVE';
          isPayable = true;
          payableFraction = 1.0;
          reason = 'Approved Paid Leave';
        } else {
          finalStatus = 'UNPAID_LEAVE';
          isPayable = false;
          payableFraction = 0;
          reason = 'Approved Unpaid Leave (LOP)';
        }
      } else if (attRecord) {
        switch (attRecord.status) {
          case 'PRESENT':
            finalStatus = 'PRESENT';
            isPayable = true;
            payableFraction = 1.0;
            reason = 'Attendance Marked Present';
            break;
          case 'LATE':
            finalStatus = 'LATE';
            isPayable = true;
            payableFraction = 1.0;
            reason = 'Late Arrival (Payable)';
            break;
          case 'HALF_DAY':
            finalStatus = 'HALF_DAY';
            isPayable = true;
            payableFraction = 0.5;
            reason = 'Half Day (0.5 Payable)';
            break;
          case 'ABSENT':
            finalStatus = 'ABSENT';
            isPayable = false;
            payableFraction = 0;
            reason = 'Attendance Marked Absent';
            break;
          case 'HOLIDAY':
            finalStatus = 'HOLIDAY';
            isPayable = true;
            payableFraction = 1.0;
            reason = holidayName || 'Holiday';
            break;
          case 'WEEK_OFF':
            finalStatus = 'WEEK_OFF';
            isPayable = true;
            payableFraction = 1.0;
            reason = 'Weekly Off';
            break;
          default:
            finalStatus = attRecord.status;
            isPayable = true;
            payableFraction = 1.0;
            reason = attRecord.status;
            break;
        }
      } else if (isHoliday) {
        finalStatus = 'HOLIDAY';
        isPayable = true;
        payableFraction = 1.0;
        reason = holidayName || 'Public Holiday';
      } else if (isWeekend) {
        finalStatus = 'WEEK_OFF';
        isPayable = true;
        payableFraction = 1.0;
        reason = 'Weekend Off';
      } else {
        if (attendanceList.length > 0) {
          finalStatus = 'ABSENT';
          isPayable = false;
          payableFraction = 0;
          reason = 'No attendance recorded';
        } else {
          finalStatus = 'PRESENT';
          isPayable = true;
          payableFraction = 1.0;
          reason = 'Standard Working Day';
        }
      }

      dailyTimeline.push({
        date: dateStr,
        dayOfWeek,
        attendanceStatus: attRecord?.status || null,
        leaveStatus: leaveRecord ? (leaveRecord.isPaid ? 'PAID_LEAVE' : 'UNPAID_LEAVE') : null,
        isHoliday,
        holidayName,
        isWeekend,
        finalStatus,
        isPayable,
        payableFraction,
        reason,
      });
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
      weekOffDays,
      paidDays,
      payableFactor,
      overtimeMinutes,
      dailyTimeline,
    };
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
