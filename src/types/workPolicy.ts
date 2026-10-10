export type SaturdayRule =
  | 'ALL_WORKING'
  | 'ALL_OFF'
  | 'FIRST_THIRD_OFF'
  | 'SECOND_FOURTH_OFF'
  | 'ALTERNATE_OFF'
  | 'CUSTOM';

export type SundayRule = 'OFF_PAID' | 'OFF_UNPAID' | 'WORKING';

export type DivisorPolicy =
  | 'CALENDAR_DAYS'
  | 'WORKING_DAYS'
  | 'FIXED_30'
  | 'FIXED_26'
  | 'PAID_DAYS'
  | 'FIXED_MONTHLY'
  | 'CUSTOM';

export type SandwichRuleType =
  | 'BOTH_DAYS'
  | 'EITHER_DAY'
  | 'BEFORE_DAY'
  | 'AFTER_DAY';

export interface DayScheduleConfig {
  dayOfWeek: number;
  name: string;
  type: 'WORKING' | 'WEEK_OFF';
  isPaid: boolean;
}

export interface SaturdayOccurrenceConfig {
  occurrence: number;
  isOff: boolean;
  isPaid: boolean;
}

export interface CompanyWorkPolicy {
  weeklyOffPolicy: DayScheduleConfig[];
  saturdayRule: SaturdayRule;
  saturdayPaid: boolean;
  saturday5thRule: 'WORKING' | 'OFF' | 'FOLLOW_PATTERN';
  saturdayCustomOccurrences?: SaturdayOccurrenceConfig[];
  sundayRule: SundayRule;
  sandwichRuleEnabled: boolean;
  sandwichRuleType: SandwichRuleType;
  divisorPolicy: DivisorPolicy;
  customDivisorValue?: number;
  unpaidWeekOffDeductionMode: 'EXCLUDE_FROM_PAID_DAYS' | 'DEDUCT_AS_LOP';
}

export interface CalendarPreviewDay {
  date: string;
  day: number;
  dayOfWeek: string;
  isWorkingDay: boolean;
  isWeeklyOff: boolean;
  isHoliday: boolean;
  holidayName?: string | null;
  isPayable: boolean;
  status: string;
  reason: string;
}

export interface CalendarPreviewData {
  year: number;
  month: number;
  totalCalendarDays: number;
  workingDays: number;
  paidWeeklyOffs: number;
  unpaidWeeklyOffs: number;
  paidHolidays: number;
  unpaidHolidays: number;
  totalPaidDays: number;
  days: CalendarPreviewDay[];
}
