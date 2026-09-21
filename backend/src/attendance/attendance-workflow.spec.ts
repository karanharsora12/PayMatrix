import test from 'node:test';
import assert from 'node:assert';

const API = 'http://localhost:3001/api/v1';

async function req(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const json: any = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data: json };
}

test('Full Phase 5 Workforce Workflow Integration Test', async () => {
  // 1. Authenticate as Admin
  const loginRes = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@paymatrix.com',
      password: 'Password123!',
    }),
  });

  assert.strictEqual(loginRes.status, 201, 'Login should succeed');
  assert.ok(loginRes.data.data?.accessToken, 'Access token should be returned');
  const token = loginRes.data.data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };

  // Get an employee
  const empsRes = await req('/employees', { headers });
  assert.ok(empsRes.data.data.length > 0, 'Employees should exist');
  const employee = empsRes.data.data[0];
  const employeeId = employee.id;

  // 2. Create Shift
  const shiftCode = `TEST_${Date.now().toString().slice(-4)}`;
  const createShiftRes = await req('/shifts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      code: shiftCode,
      name: 'Automated Test Shift',
      startTime: '09:00',
      endTime: '17:00',
      breakMinutes: 60,
      workingHours: 7,
      graceMinutes: 15,
      overtimeAllowed: true,
      isActive: true,
    }),
  });

  assert.strictEqual(createShiftRes.status, 201, 'Shift creation should succeed');
  const shift = createShiftRes.data.data;
  assert.strictEqual(shift.code, shiftCode);

  // 3. Assign Shift to Employee in a dynamic future year
  const testYear = 2030 + Math.floor(Math.random() * 50);
  const assignRes = await req(`/shifts/employees/${employeeId}/assign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shiftId: shift.id,
      effectiveFrom: `${testYear}-11-01`,
      effectiveTo: `${testYear}-11-30`,
    }),
  });

  assert.strictEqual(assignRes.status, 201, 'Shift assignment should succeed');

  // 4. Overlap rejection test: attempt overlapping assignment
  const overlapRes = await req(`/shifts/employees/${employeeId}/assign`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      shiftId: shift.id,
      effectiveFrom: `${testYear}-11-15`,
      effectiveTo: `${testYear}-12-15`,
    }),
  });

  assert.strictEqual(overlapRes.status, 409, 'Overlapping shift assignment must return 409 Conflict');

  // 5. Attendance Calculation & Recording
  const attDate = `${testYear}-11-04`; // Wednesday
  const attRes = await req('/attendance', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      employeeId,
      attendanceDate: attDate,
      checkIn: `${testYear}-11-04T09:00:00Z`,
      checkOut: `${testYear}-11-04T18:00:00Z`, // 9h elapsed - 1h break = 8h (480 mins), expected = 7h (420 mins) -> 60 mins OT
    }),
  });

  assert.strictEqual(attRes.status, 201, 'Attendance creation should succeed');
  assert.strictEqual(attRes.data.data.workingMinutes, 480);
  assert.strictEqual(attRes.data.data.overtimeMinutes, 60);
  assert.strictEqual(attRes.data.data.status, 'PRESENT');

  // Verify attendance summary
  const summaryRes = await req(`/attendance/summary?date=${attDate}`, { headers });
  assert.strictEqual(summaryRes.status, 200);
  assert.ok(summaryRes.data.data.present >= 1);

  // 6. Leave Workflow
  // Create Leave Type
  const leaveTypeCode = `LV_${Date.now().toString().slice(-4)}`;
  const ltRes = await req('/leave/types', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      code: leaveTypeCode,
      name: 'Integration Test Leave',
      annualAllowance: 12,
      isPaid: true,
      requiresApproval: true,
    }),
  });

  assert.strictEqual(ltRes.status, 201, 'Leave type creation should succeed');
  const leaveType = ltRes.data.data;

  // Submit Leave Request (Wednesday & Thursday: 2 working days)
  const leaveReqRes = await req('/leave/requests', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      employeeId,
      leaveTypeId: leaveType.id,
      fromDate: `${testYear}-11-11`,
      toDate: `${testYear}-11-12`,
      reason: 'Automated test leave',
    }),
  });

  assert.strictEqual(leaveReqRes.status, 201, 'Leave request submission should succeed');
  const leaveRequest = leaveReqRes.data.data;
  assert.strictEqual(Number(leaveRequest.totalDays), leaveReqRes.data.workingDays);
  assert.ok(Number(leaveRequest.totalDays) >= 1);
  assert.strictEqual(leaveRequest.status, 'PENDING');

  // Approve Leave Request
  const approveRes = await req(`/leave/requests/${leaveRequest.id}/approve`, {
    method: 'POST',
    headers,
  });

  assert.strictEqual(approveRes.status, 201, 'Leave approval should succeed');
  assert.strictEqual(approveRes.data.data.status, 'APPROVED');

  // Attendance on approved leave date should automatically reflect ON_LEAVE
  const leaveAttDate = `${testYear}-11-11`;
  const attLeaveRes = await req('/attendance', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      employeeId,
      attendanceDate: leaveAttDate,
    }),
  });

  assert.strictEqual(attLeaveRes.status, 201);
  assert.strictEqual(attLeaveRes.data.data.status, 'ON_LEAVE', 'Attendance on approved leave date must resolve to ON_LEAVE');

  // Cancel Leave Request and verify balance restored
  const cancelRes = await req(`/leave/requests/${leaveRequest.id}/cancel`, {
    method: 'POST',
    headers,
  });

  assert.strictEqual(cancelRes.status, 201, 'Leave cancellation should succeed');
  assert.strictEqual(cancelRes.data.data.status, 'CANCELLED');
});
