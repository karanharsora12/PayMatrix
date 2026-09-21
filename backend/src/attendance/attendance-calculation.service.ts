import { Injectable } from '@nestjs/common';

export interface ShiftInfo {
  startTime: string; // "09:30" or "22:00"
  endTime: string; // "18:30" or "06:00"
  breakMinutes?: number;
  workingHours?: number | string;
  graceMinutes?: number;
  overtimeAllowed?: boolean;
  isNightShift?: boolean;
}

export interface AttendanceCalcInput {
  checkIn: Date | null;
  checkOut: Date | null;
  shift?: ShiftInfo | null;
  hasApprovedLeave?: boolean;
  isHoliday?: boolean;
  isWeeklyOff?: boolean;
}

export interface AttendanceCalcResult {
  workingMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  status:
    | 'PRESENT'
    | 'ABSENT'
    | 'HALF_DAY'
    | 'LATE'
    | 'ON_LEAVE'
    | 'HOLIDAY'
    | 'WEEK_OFF'
    | 'ON_DUTY'
    | 'WFH';
  remarks?: string;
}

@Injectable()
export class AttendanceCalculationService {
  calculate(input: AttendanceCalcInput): AttendanceCalcResult {
    const {
      checkIn,
      checkOut,
      shift,
      hasApprovedLeave = false,
      isHoliday = false,
      isWeeklyOff = false,
    } = input;

    // 1. Approved Leave priority
    if (hasApprovedLeave) {
      return {
        workingMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        status: 'ON_LEAVE',
        remarks: 'Employee is on approved leave',
      };
    }

    // 2. Missing both check-in and check-out
    if (!checkIn && !checkOut) {
      if (isHoliday) {
        return {
          workingMinutes: 0,
          breakMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          status: 'HOLIDAY',
          remarks: 'Company holiday',
        };
      }
      if (isWeeklyOff) {
        return {
          workingMinutes: 0,
          breakMinutes: 0,
          overtimeMinutes: 0,
          lateMinutes: 0,
          status: 'WEEK_OFF',
          remarks: 'Weekly off',
        };
      }
      return {
        workingMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        status: 'ABSENT',
        remarks: 'No attendance recorded',
      };
    }

    // 3. Missing one punch (missing checkIn or missing checkOut)
    if (!checkIn || !checkOut) {
      return {
        workingMinutes: 0,
        breakMinutes: 0,
        overtimeMinutes: 0,
        lateMinutes: 0,
        status: 'HALF_DAY',
        remarks: !checkIn ? 'Missing check-in punch' : 'Missing check-out punch',
      };
    }

    // 4. Both punches present - calculate elapsed duration
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const totalElapsedMins = Math.max(0, Math.floor(diffMs / (1000 * 60)));

    const breakMins = shift?.breakMinutes ?? 60;
    const workingMinutes = Math.max(0, totalElapsedMins - breakMins);

    const expectedHours = shift?.workingHours ? Number(shift.workingHours) : 8;
    const expectedMinutes = Math.round(expectedHours * 60);

    // 5. Overtime calculation
    // Overtime must respect shift.overtimeAllowed
    const overtimeAllowed = shift?.overtimeAllowed ?? false;
    let overtimeMinutes = 0;
    if (overtimeAllowed && workingMinutes > expectedMinutes) {
      overtimeMinutes = workingMinutes - expectedMinutes;
    }

    // 6. Late calculation
    let lateMinutes = 0;
    let isLate = false;

    if (shift?.startTime) {
      const [sh, sm] = shift.startTime.split(':').map(Number);
      const shiftStartMins = sh * 60 + sm;
      const graceMinutes = shift.graceMinutes ?? 15;

      // Extract check-in local/UTC time in minutes of the day
      const checkInH = checkIn.getUTCHours();
      const checkInM = checkIn.getUTCMinutes();
      const checkInMins = checkInH * 60 + checkInM;

      if (checkInMins > shiftStartMins + graceMinutes) {
        lateMinutes = checkInMins - shiftStartMins;
        isLate = true;
      }
    }

    // 7. Status Resolution
    let status: AttendanceCalcResult['status'] = 'PRESENT';
    const halfDayThreshold = Math.floor(expectedMinutes / 2); // e.g. 240 mins for 8h

    if (workingMinutes < halfDayThreshold) {
      status = 'HALF_DAY';
    } else if (isLate) {
      status = 'LATE';
    } else {
      status = 'PRESENT';
    }

    return {
      workingMinutes,
      breakMinutes: breakMins,
      overtimeMinutes,
      lateMinutes,
      status,
    };
  }
}
