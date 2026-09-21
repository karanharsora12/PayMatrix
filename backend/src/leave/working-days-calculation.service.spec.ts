import test from 'node:test';
import assert from 'node:assert';
import { WorkingDaysCalculationService } from './working-days-calculation.service';

test('WorkingDaysCalculationService - excludes weekends (Friday to Monday is 2 working days)', async () => {
  // Friday: 2026-09-25, Saturday: 2026-09-26, Sunday: 2026-09-27, Monday: 2026-09-28
  const mockDb = {
    query: {
      holidays: {
        findMany: async () => [],
      },
    },
  };

  const svc = new WorkingDaysCalculationService(mockDb as any);
  const result = await svc.calculateWorkingDays(
    'test-comp-id',
    '2026-09-25',
    '2026-09-28',
  );

  assert.strictEqual(result.workingDays, 2); // Friday and Monday
  assert.strictEqual(result.excludedWeekendDates.length, 2);
  assert.ok(result.excludedWeekendDates.includes('2026-09-26'));
  assert.ok(result.excludedWeekendDates.includes('2026-09-27'));
  assert.strictEqual(result.excludedHolidayDates.length, 0);
});

test('WorkingDaysCalculationService - excludes company holidays', async () => {
  // Monday 2026-01-26 is Republic Day
  const mockDb = {
    query: {
      holidays: {
        findMany: async () => [{ holidayDate: '2026-01-26' }],
      },
    },
  };

  const svc = new WorkingDaysCalculationService(mockDb as any);
  // Mon 2026-01-26 to Wed 2026-01-28 (3 calendar days: Mon holiday, Tue work, Wed work)
  const result = await svc.calculateWorkingDays(
    'test-comp-id',
    '2026-01-26',
    '2026-01-28',
  );

  assert.strictEqual(result.workingDays, 2);
  assert.strictEqual(result.excludedHolidayDates.length, 1);
  assert.ok(result.excludedHolidayDates.includes('2026-01-26'));
});

test('WorkingDaysCalculationService - single working day', async () => {
  const mockDb = {
    query: {
      holidays: {
        findMany: async () => [],
      },
    },
  };

  const svc = new WorkingDaysCalculationService(mockDb as any);
  const result = await svc.calculateWorkingDays(
    'test-comp-id',
    '2026-09-22', // Tuesday
    '2026-09-22',
  );

  assert.strictEqual(result.workingDays, 1);
});

test('WorkingDaysCalculationService - full week across weekend', async () => {
  const mockDb = {
    query: {
      holidays: {
        findMany: async () => [],
      },
    },
  };

  const svc = new WorkingDaysCalculationService(mockDb as any);
  // Mon 2026-09-21 to Sun 2026-09-27 -> 5 working days (Mon-Fri)
  const result = await svc.calculateWorkingDays(
    'test-comp-id',
    '2026-09-21',
    '2026-09-27',
  );

  assert.strictEqual(result.workingDays, 5);
  assert.strictEqual(result.excludedWeekendDates.length, 2);
});
