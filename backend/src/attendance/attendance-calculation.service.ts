import { Injectable } from '@nestjs/common';

export interface CalcInput {
  checkIn: Date | null;
  checkOut: Date | null;
  shiftStart: string; // "09:30"
  shiftEnd: string;
  breakMinutes: number;
  graceMinutes: number;
}

export interface CalcResult {
  workingMinutes: number;
  breakMinutes: number;
  overtimeMinutes: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'ON_DUTY' | 'WFH';
}

@Injectable()
export class AttendanceCalculationService {
  calculate(input: CalcInput): CalcResult {
    if (!input.checkIn || !input.checkOut) {
      return { workingMinutes: 0, breakMinutes: 0, overtimeMinutes: 0, status: 'ABSENT' };
    }
    const diffMs = input.checkOut.getTime() - input.checkIn.getTime();
    const totalMins = Math.max(0, Math.floor(diffMs / 60000));
    const workingMinutes = Math.max(0, totalMins - (input.breakMinutes ?? 0));
    const expected = 8 * 60; // 480 mins; could be derived from shift
    const overtimeMinutes = Math.max(0, workingMinutes - expected);

    // Late detection: compare checkIn time vs shiftStart + grace
    const [sh, sm] = input.shiftStart.split(':').map(Number);
    const shiftStartMins = sh * 60 + sm;
    const checkInMins = input.checkIn.getHours() * 60 + input.checkIn.getMinutes();
    const isLate = checkInMins > shiftStartMins + (input.graceMinutes ?? 15);

    let status: CalcResult['status'] = 'PRESENT';
    if (workingMinutes < 240) status = 'HALF_DAY';
    else if (isLate) status = 'LATE';
    // Leave/holiday/week-off statuses are set by caller based on calendar

    return { workingMinutes, breakMinutes: input.breakMinutes ?? 0, overtimeMinutes, status };
  }
}
