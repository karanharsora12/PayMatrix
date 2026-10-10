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
  | 'BOTH_DAYS' // Must be present or on approved paid leave on both surrounding working days
  | 'EITHER_DAY' // Present/leave on at least one adjacent working day
  | 'BEFORE_DAY' // Present/leave on preceding working day
  | 'AFTER_DAY'; // Present/leave on succeeding working day

export interface DayScheduleConfig {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  name: string;
  type: 'WORKING' | 'WEEK_OFF';
  isPaid: boolean;
}

export interface SaturdayOccurrenceConfig {
  occurrence: number; // 1 to 5
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

export const DEFAULT_WORK_POLICY: CompanyWorkPolicy = {
  weeklyOffPolicy: [
    { dayOfWeek: 0, name: 'Sunday', type: 'WEEK_OFF', isPaid: true },
    { dayOfWeek: 1, name: 'Monday', type: 'WORKING', isPaid: false },
    { dayOfWeek: 2, name: 'Tuesday', type: 'WORKING', isPaid: false },
    { dayOfWeek: 3, name: 'Wednesday', type: 'WORKING', isPaid: false },
    { dayOfWeek: 4, name: 'Thursday', type: 'WORKING', isPaid: false },
    { dayOfWeek: 5, name: 'Friday', type: 'WORKING', isPaid: false },
    { dayOfWeek: 6, name: 'Saturday', type: 'WEEK_OFF', isPaid: true },
  ],
  saturdayRule: 'SECOND_FOURTH_OFF',
  saturdayPaid: true,
  saturday5thRule: 'FOLLOW_PATTERN',
  saturdayCustomOccurrences: [
    { occurrence: 1, isOff: false, isPaid: false },
    { occurrence: 2, isOff: true, isPaid: true },
    { occurrence: 3, isOff: false, isPaid: false },
    { occurrence: 4, isOff: true, isPaid: true },
    { occurrence: 5, isOff: false, isPaid: false },
  ],
  sundayRule: 'OFF_PAID',
  sandwichRuleEnabled: true,
  sandwichRuleType: 'BOTH_DAYS',
  divisorPolicy: 'CALENDAR_DAYS',
  customDivisorValue: 30,
  unpaidWeekOffDeductionMode: 'EXCLUDE_FROM_PAID_DAYS',
};

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function evaluateScheduledWeeklyOff(
  date: Date,
  workPolicy: CompanyWorkPolicy = DEFAULT_WORK_POLICY,
): { isOff: boolean; isPaid: boolean; patternDescription: string } {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const dayOfMonth = date.getDate();
  const occurrence = Math.ceil(dayOfMonth / 7);

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
            patternDescription: `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
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
          patternDescription: `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
        };
      }

      case 'SECOND_FOURTH_OFF': {
        if (occurrence === 2 || occurrence === 4) {
          return {
            isOff: true,
            isPaid,
            patternDescription: `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`,
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
          patternDescription: `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
        };
      }

      case 'ALTERNATE_OFF': {
        const isOff = occurrence % 2 !== 0; // 1st, 3rd, 5th
        return {
          isOff,
          isPaid: isOff ? isPaid : false,
          patternDescription: isOff
            ? `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (${isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
            : `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
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
              ? `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (${custom.isPaid ? 'Paid' : 'Unpaid'} Weekly Off)`
              : `${occurrence}${getOrdinalSuffix(occurrence)} Saturday (Working Day)`,
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

