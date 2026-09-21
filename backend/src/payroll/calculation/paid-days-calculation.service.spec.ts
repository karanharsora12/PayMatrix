import test from 'node:test';
import assert from 'node:assert/strict';
import { PaidDaysCalculationService } from './paid-days-calculation.service';

const service = new PaidDaysCalculationService();

const sep2026Period = {
  year: 2026,
  month: 9,
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
};

test('PaidDaysCalculation - 100% payable for full-month employee with perfect attendance', () => {
  const employee = { id: 'emp-1', joiningDate: '2025-01-01' };
  const attendance: any[] = [];
  for (let day = 1; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) {
      attendance.push({
        attendanceDate: `2026-09-${String(day).padStart(2, '0')}`,
        status: 'PRESENT',
      });
    }
  }

  const res = service.calculatePaidDays(
    employee,
    sep2026Period,
    attendance,
    [],
    [],
    'CALENDAR_DAYS',
  );

  assert.equal(res.calendarDays, 30);
  assert.equal(res.eligibleCalendarDays, 30);
  assert.equal(res.paidDays, 30);
  assert.equal(res.payableFactor, 1.0);
  assert.equal(res.absentDays, 0);
});

test('PaidDaysCalculation - handles mid-month joiner (joining Sep 16, 2026 in 30-day month)', () => {
  const employee = { id: 'emp-mid', joiningDate: '2026-09-16' };
  const attendance: any[] = [];
  for (let day = 16; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) {
      attendance.push({
        attendanceDate: `2026-09-${String(day).padStart(2, '0')}`,
        status: 'PRESENT',
      });
    }
  }

  const res = service.calculatePaidDays(
    employee,
    sep2026Period,
    attendance,
    [],
    [],
    'CALENDAR_DAYS',
  );

  assert.equal(res.eligibleCalendarDays, 15);
  assert.equal(res.paidDays, 15);
  assert.equal(res.payableFactor, 0.5);
});

test('PaidDaysCalculation - handles mid-month leaver (exited Sep 20, 2026)', () => {
  const employee = { id: 'emp-exit', joiningDate: '2025-01-01', lastWorkingDate: '2026-09-20' };
  const attendance: any[] = [];
  for (let day = 1; day <= 20; day++) {
    const d = new Date(2026, 8, day);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) {
      attendance.push({
        attendanceDate: `2026-09-${String(day).padStart(2, '0')}`,
        status: 'PRESENT',
      });
    }
  }

  const res = service.calculatePaidDays(
    employee,
    sep2026Period,
    attendance,
    [],
    [],
    'CALENDAR_DAYS',
  );

  assert.equal(res.eligibleCalendarDays, 20);
  assert.equal(res.paidDays, 20);
  assert.ok(Math.abs(res.payableFactor - 20 / 30) < 0.001);
});

test('PaidDaysCalculation - deducts unpaid leave (Loss of Pay) correctly under different policies', () => {
  const employee = { id: 'emp-lop', joiningDate: '2025-01-01' };
  const attendance: any[] = [];
  for (let day = 1; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend && day > 2) {
      attendance.push({
        attendanceDate: `2026-09-${String(day).padStart(2, '0')}`,
        status: 'PRESENT',
      });
    }
  }

  const leaves = [
    {
      fromDate: '2026-09-01',
      toDate: '2026-09-02',
      totalDays: 2,
      isPaid: false,
    },
  ];

  const resCal = service.calculatePaidDays(
    employee,
    sep2026Period,
    attendance,
    leaves,
    [],
    'CALENDAR_DAYS',
  );

  assert.equal(resCal.unpaidLeaveDays, 2);
  assert.equal(resCal.paidDays, 28);
  assert.ok(Math.abs(resCal.payableFactor - 28 / 30) < 0.001);

  const resFixed = service.calculatePaidDays(
    employee,
    sep2026Period,
    attendance,
    leaves,
    [],
    'FIXED_MONTHLY',
  );

  assert.ok(Math.abs(resFixed.payableFactor - 28 / 30) < 0.001);
});
