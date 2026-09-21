import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';

export interface WorkingDaysResult {
  workingDays: number;
  excludedWeekendDates: string[];
  excludedHolidayDates: string[];
}

@Injectable()
export class WorkingDaysCalculationService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async calculateWorkingDays(
    companyId: string,
    fromDateStr: string,
    toDateStr: string,
    weekendDays: number[] = [0, 6], // Default: Sunday (0) and Saturday (6)
  ): Promise<WorkingDaysResult> {
    // 1. Fetch holidays in the range
    const holidayRows = await this.db.query.holidays.findMany({
      where: (h: any, { eq, and, gte, lte }: any) =>
        and(
          eq(h.companyId, companyId),
          eq(h.isActive, true),
          gte(h.holidayDate, fromDateStr),
          lte(h.holidayDate, toDateStr),
        ),
    });

    const holidayDateSet = new Set<string>(
      holidayRows.map((h: any) => h.holidayDate),
    );

    const excludedWeekendDates: string[] = [];
    const excludedHolidayDates: string[] = [];
    let workingDays = 0;

    const current = new Date(fromDateStr + 'T00:00:00Z');
    const end = new Date(toDateStr + 'T00:00:00Z');

    while (current <= end) {
      const dateString = current.toISOString().substring(0, 10);
      const dayOfWeek = current.getUTCDay();

      if (weekendDays.includes(dayOfWeek)) {
        excludedWeekendDates.push(dateString);
      } else if (holidayDateSet.has(dateString)) {
        excludedHolidayDates.push(dateString);
      } else {
        workingDays += 1;
      }

      // Next day
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return {
      workingDays,
      excludedWeekendDates,
      excludedHolidayDates,
    };
  }
}
