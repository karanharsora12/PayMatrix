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

    // Count standard working days and eligible working days
    let totalCompanyWorkingDays = 0;
    let eligibleWorkingDays = 0;
    let eligibleCalendarDays = 0;

    for (let day = 1; day <= totalCalendarDays; day++) {
      const d = new Date(year, month - 1, day);
      const dateStr = this.toDateStr(year, month, day);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6; // Sun = 0, Sat = 6
      const isHoliday = holidayDates.has(dateStr);

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
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
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
