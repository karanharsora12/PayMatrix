import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq, sql } from 'drizzle-orm';
import * as schema from '../db/schema';
import { PaidDaysCalculationService } from './calculation/paid-days-calculation.service';
import { PayrollCalculationService } from './calculation/payroll-calculation.service';
import { PayrollRunsService } from './runs/payroll-runs.service';
import { PayrollAdjustmentsService } from './adjustments/payroll-adjustments.service';
import { PayslipsService } from './payslips/payslips.service';

const pool = new Pool({
  connectionString: 'postgresql://postgres:Karan%40123@localhost:5432/paymatrix',
});
const db = drizzle(pool, { schema });

test('Phase 7 — Payroll Engine End-to-End Workflow & Immutability Test', async () => {
  const paidDaysService = new PaidDaysCalculationService();
  const calculationService = new PayrollCalculationService(db, paidDaysService);
  const adjustmentsService = new PayrollAdjustmentsService(db);
  const payslipsService = new PayslipsService(db);
  const runsService = new PayrollRunsService(db, calculationService);

  // 1. Setup Test Company
  let company: any = await db.query.companies.findFirst({
    where: eq(schema.companies.code, 'PAYROLL-E2E-CORP'),
  });
  if (!company) {
    const [c] = await db
      .insert(schema.companies)
      .values({
        name: 'Payroll Test Corp',
        legalName: 'Payroll Test Corp Pvt Ltd',
        code: 'PAYROLL-E2E-CORP',
      })
      .returning();
    company = c;
  }
  const companyId = company.id;

  // 2. Setup Test Salary Components
  let basicComp: any = await db.query.salaryComponents.findFirst({
    where: and(eq(schema.salaryComponents.companyId, companyId), eq(schema.salaryComponents.code, 'BASIC')),
  });
  if (!basicComp) {
    const [c] = await db
      .insert(schema.salaryComponents)
      .values({
        companyId,
        code: 'BASIC',
        name: 'Basic Salary',
        componentType: 'EARNING',
        calculationType: 'FIXED',
        defaultAmount: '30000',
        isProratable: true,
      })
      .returning();
    basicComp = c;
  }

  let hraComp: any = await db.query.salaryComponents.findFirst({
    where: and(eq(schema.salaryComponents.companyId, companyId), eq(schema.salaryComponents.code, 'HRA')),
  });
  if (!hraComp) {
    const [c] = await db
      .insert(schema.salaryComponents)
      .values({
        companyId,
        code: 'HRA',
        name: 'House Rent Allowance',
        componentType: 'EARNING',
        calculationType: 'PERCENTAGE',
        defaultPercentage: '40',
        calculationBasis: 'BASIC',
        isProratable: true,
      })
      .returning();
    hraComp = c;
  }

  let pfComp: any = await db.query.salaryComponents.findFirst({
    where: and(eq(schema.salaryComponents.companyId, companyId), eq(schema.salaryComponents.code, 'PF_EMP')),
  });
  if (!pfComp) {
    const [c] = await db
      .insert(schema.salaryComponents)
      .values({
        companyId,
        code: 'PF_EMP',
        name: 'Provident Fund (Employee)',
        componentType: 'DEDUCTION',
        calculationType: 'PERCENTAGE',
        defaultPercentage: '12',
        calculationBasis: 'BASIC',
        isProratable: false,
      })
      .returning();
    pfComp = c;
  }

  // 3. Setup Salary Structure
  let struct: any = await db.query.salaryStructures.findFirst({
    where: and(eq(schema.salaryStructures.companyId, companyId), eq(schema.salaryStructures.code, 'STD_PAYROLL')),
  });
  if (!struct) {
    const [s] = await db
      .insert(schema.salaryStructures)
      .values({
        companyId,
        code: 'STD_PAYROLL',
        name: 'Standard Payroll Structure',
        effectiveFrom: '2026-01-01',
      })
      .returning();
    struct = s;

    await db.insert(schema.salaryStructureComponents).values([
      { salaryStructureId: struct.id, salaryComponentId: basicComp.id, calculationType: 'FIXED', amount: '30000', displayOrder: 1 },
      { salaryStructureId: struct.id, salaryComponentId: hraComp.id, calculationType: 'PERCENTAGE', percentage: '40', percentageOf: 'BASIC', displayOrder: 2 },
      { salaryStructureId: struct.id, salaryComponentId: pfComp.id, calculationType: 'PERCENTAGE', percentage: '12', percentageOf: 'BASIC', displayOrder: 3 },
    ]);
  }

  // 4. Setup Test Employee & Salary Assignment
  let employee: any = await db.query.employees.findFirst({
    where: and(eq(schema.employees.companyId, companyId), eq(schema.employees.employeeCode, 'EMP-PAY-01')),
  });
  if (!employee) {
    const [e] = await db
      .insert(schema.employees)
      .values({
        companyId,
        employeeCode: 'EMP-PAY-01',
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: `aarav.${Date.now()}@paytest.com`,
        joiningDate: '2026-01-01',
      })
      .returning();
    employee = e;
  }

  // Assign salary structure effective from 2026-01-01
  let assign: any = await db.query.employeeSalaryStructures.findFirst({
    where: eq(schema.employeeSalaryStructures.employeeId, employee.id),
  });
  if (!assign) {
    const [a] = await db
      .insert(schema.employeeSalaryStructures)
      .values({
        employeeId: employee.id,
        salaryStructureId: struct.id,
        effectiveFrom: '2026-01-01',
      })
      .returning();
    assign = a;
  }

  const testYear = 2026;
  const testMonth = 9;

  // Insert full attendance records for Sep 2026 (22 working days)
  await db
    .delete(schema.attendance)
    .where(
      and(
        eq(schema.attendance.employeeId, employee.id),
        sql`${schema.attendance.attendanceDate} >= '2026-09-01'`,
        sql`${schema.attendance.attendanceDate} <= '2026-09-30'`,
      ),
    );

  const attRecords: any[] = [];
  for (let day = 1; day <= 30; day++) {
    const d = new Date(2026, 8, day);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) {
      attRecords.push({
        companyId,
        employeeId: employee.id,
        attendanceDate: `2026-09-${String(day).padStart(2, '0')}`,
        status: 'PRESENT',
      });
    }
  }
  await db.insert(schema.attendance).values(attRecords);

  // Cleanup any old test runs for Sep 2026
  await db
    .delete(schema.payrollRuns)
    .where(
      and(
        eq(schema.payrollRuns.companyId, companyId),
        eq(schema.payrollRuns.periodYear, testYear),
        eq(schema.payrollRuns.periodMonth, testMonth),
      ),
    );

  // 5. STEP 1: Create Draft Payroll Run
  const createRes = await runsService.create(
    companyId,
    { year: testYear, month: testMonth },
    employee.id,
  );
  assert.equal(createRes.success, true);
  assert.equal(createRes.data.status, 'DRAFT');
  const runId = createRes.data.id;

  // Verify duplicate prevention
  await assert.rejects(async () => {
    await runsService.create(companyId, { year: testYear, month: testMonth }, employee.id);
  }, /An active payroll run already exists/);

  // 6. STEP 2: Calculate Payroll Run
  const calcRes = await runsService.calculate(companyId, runId, employee.id, 'CALENDAR_DAYS');
  assert.equal(calcRes.success, true);
  assert.equal(calcRes.data.processedCount, 1);
  assert.equal(calcRes.data.exceptionCount, 0);

  // Gross = Basic (30,000) + HRA (12,000) = 42,000
  // Deductions = PF (12% of 30,000) = 3,600
  // Net = 42,000 - 3,600 = 38,400
  assert.equal(calcRes.data.totalGross, 42000);
  assert.equal(calcRes.data.totalDeductions, 3600);
  assert.equal(calcRes.data.totalNet, 38400);

  // 7. STEP 3: Add Adjustment (Bonus of 5,000)
  const adjRes = await adjustmentsService.addAdjustment(
    companyId,
    runId,
    employee.id,
    {
      type: 'BONUS',
      name: 'Festival Bonus',
      amount: 5000,
      isAddition: true,
      reason: 'Diwali festive advance bonus',
    },
    employee.id,
  );
  assert.equal(adjRes.success, true);

  // Verify summary after adjustment: Gross becomes 47,000, Net becomes 43,400
  const summaryAfterAdj = await runsService.getSummary(companyId, runId);
  assert.equal(summaryAfterAdj.data.totalGross, 47000);
  assert.equal(summaryAfterAdj.data.totalNet, 43400);

  // 8. STEP 4: Submit for Approval
  const submitRes = await runsService.submit(companyId, runId, employee.id);
  assert.equal(submitRes.success, true);
  assert.equal(submitRes.data.status, 'PENDING_APPROVAL');

  // 9. STEP 5: Approve Run
  const approveRes = await runsService.approve(companyId, runId, employee.id, {
    comments: 'Reviewed and approved by Payroll Manager',
  });
  assert.equal(approveRes.success, true);
  assert.equal(approveRes.data.run.status, 'APPROVED');

  // 10. STEP 6: Finalize Run & Freeze Snapshot
  const finalizeRes = await runsService.finalize(companyId, runId, employee.id);
  assert.equal(finalizeRes.success, true);
  assert.equal(finalizeRes.data.status, 'FINALIZED');

  // Verify payslip was generated with deterministic number PAY-2026-09-00001
  const payslipsList = await payslipsService.list(companyId, { year: testYear, month: testMonth });
  assert.equal(payslipsList.meta.total, 1);
  const ps: any = payslipsList.data[0];
  assert.equal(ps.payslipNumber, 'PAY-2026-09-00001');
  assert.equal(Number(ps.grossSalary), 47000);
  assert.equal(Number(ps.netSalary), 43400);

  // 11. STEP 7: Immutability Verification
  // Verify recalculation is strictly rejected
  await assert.rejects(async () => {
    await runsService.calculate(companyId, runId, employee.id);
  }, /Cannot calculate payroll in status FINALIZED/);

  // Verify adjustments cannot be added after finalization
  await assert.rejects(async () => {
    await adjustmentsService.addAdjustment(
      companyId,
      runId,
      employee.id,
      {
        type: 'ARREAR',
        name: 'Late Arrear',
        amount: 1000,
        isAddition: true,
        reason: 'Should be rejected',
      },
      employee.id,
    );
  }, /Cannot add adjustments to a finalized or paid payroll run/);

  // Now, SIMULATE MASTER DATA CHANGE IN OCTOBER 2026:
  // Employee's salary basic changes to 50,000
  await db.insert(schema.employeeSalaryStructures).values({
    employeeId: employee.id,
    salaryStructureId: struct.id,
    effectiveFrom: '2026-10-01',
  });

  // Re-read September 2026 payslip and payroll employee snapshot
  const frozenPayslip = await payslipsService.get(companyId, ps.id);
  assert.equal(frozenPayslip.data.totals.grossSalary, 47000);
  assert.equal(frozenPayslip.data.totals.netSalary, 43400);

  const frozenEmployee = await runsService.getEmployee(companyId, runId, employee.id);
  assert.equal(Number(frozenEmployee.data.grossSalary), 47000);
  assert.equal(Number(frozenEmployee.data.netSalary), 43400);

  // Clean up
  await pool.end();
  console.log('Phase 7 End-to-End Workflow & Immutability test passed with 100% success!');
});
