import test from 'node:test';
import assert from 'node:assert';
import { AttendanceCalculationService } from './attendance-calculation.service';

test('AttendanceCalculationService - normal 8h working day', () => {
  const svc = new AttendanceCalculationService();
  const checkIn = new Date('2026-09-21T09:30:00Z');
  const checkOut = new Date('2026-09-21T18:30:00Z'); // 9 hours = 540 mins

  const result = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
    },
  });

  assert.strictEqual(result.workingMinutes, 480); // 540 - 60 = 480 mins (8 hours)
  assert.strictEqual(result.overtimeMinutes, 0);
  assert.strictEqual(result.lateMinutes, 0);
  assert.strictEqual(result.status, 'PRESENT');
});

test('AttendanceCalculationService - grace period: within grace is not late', () => {
  const svc = new AttendanceCalculationService();
  // Arrived at 09:40 when shift starts at 09:30 with 15 mins grace (allowed until 09:45)
  const checkIn = new Date('2026-09-21T09:40:00Z');
  const checkOut = new Date('2026-09-21T18:40:00Z');

  const result = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
    },
  });

  assert.strictEqual(result.status, 'PRESENT');
  assert.strictEqual(result.lateMinutes, 0);
});

test('AttendanceCalculationService - late beyond grace period', () => {
  const svc = new AttendanceCalculationService();
  // Arrived at 09:50 when shift starts at 09:30 with 15 mins grace (late by 20 mins)
  const checkIn = new Date('2026-09-21T09:50:00Z');
  const checkOut = new Date('2026-09-21T18:50:00Z');

  const result = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
    },
  });

  assert.strictEqual(result.status, 'LATE');
  assert.strictEqual(result.lateMinutes, 20);
});

test('AttendanceCalculationService - overtime calculation when allowed', () => {
  const svc = new AttendanceCalculationService();
  // 10 hours elapsed - 1 hour break = 9 hours working (540 mins), expected = 8h (480 mins) -> 60 mins OT
  const checkIn = new Date('2026-09-21T09:30:00Z');
  const checkOut = new Date('2026-09-21T19:30:00Z');

  const resultWithOT = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: true,
    },
  });

  assert.strictEqual(resultWithOT.workingMinutes, 540);
  assert.strictEqual(resultWithOT.overtimeMinutes, 60);

  // If overtime not allowed:
  const resultNoOT = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      workingHours: 8,
      graceMinutes: 15,
      overtimeAllowed: false,
    },
  });

  assert.strictEqual(resultNoOT.workingMinutes, 540);
  assert.strictEqual(resultNoOT.overtimeMinutes, 0);
});

test('AttendanceCalculationService - half day when working less than 50% hours', () => {
  const svc = new AttendanceCalculationService();
  // 3 hours elapsed - 30 min break = 150 mins (< 240 mins)
  const checkIn = new Date('2026-09-21T09:30:00Z');
  const checkOut = new Date('2026-09-21T12:30:00Z');

  const result = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 30,
      workingHours: 8,
      graceMinutes: 15,
    },
  });

  assert.strictEqual(result.status, 'HALF_DAY');
  assert.strictEqual(result.workingMinutes, 150);
});

test('AttendanceCalculationService - statuses without punches (holiday, week off, leave, absent)', () => {
  const svc = new AttendanceCalculationService();

  // On leave
  const onLeave = svc.calculate({
    checkIn: null,
    checkOut: null,
    hasApprovedLeave: true,
  });
  assert.strictEqual(onLeave.status, 'ON_LEAVE');

  // Company holiday
  const holiday = svc.calculate({
    checkIn: null,
    checkOut: null,
    isHoliday: true,
  });
  assert.strictEqual(holiday.status, 'HOLIDAY');

  // Weekly off
  const weekOff = svc.calculate({
    checkIn: null,
    checkOut: null,
    isWeeklyOff: true,
  });
  assert.strictEqual(weekOff.status, 'WEEK_OFF');

  // Absent
  const absent = svc.calculate({
    checkIn: null,
    checkOut: null,
  });
  assert.strictEqual(absent.status, 'ABSENT');
});

test('AttendanceCalculationService - overnight / night shift calculation', () => {
  const svc = new AttendanceCalculationService();
  // Night shift: 22:00 to 06:00 next day (8 hours total)
  const checkIn = new Date('2026-09-21T22:00:00Z');
  const checkOut = new Date('2026-09-22T06:00:00Z'); // 8 hours elapsed = 480 mins

  const result = svc.calculate({
    checkIn,
    checkOut,
    shift: {
      startTime: '22:00',
      endTime: '06:00',
      breakMinutes: 30,
      workingHours: 7.5,
      isNightShift: true,
      overtimeAllowed: true,
    },
  });

  assert.strictEqual(result.workingMinutes, 450); // 480 - 30 = 450 mins = 7.5h
  assert.strictEqual(result.status, 'PRESENT');
  assert.strictEqual(result.overtimeMinutes, 0);
});
