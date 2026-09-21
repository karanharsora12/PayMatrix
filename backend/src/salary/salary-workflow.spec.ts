import test from 'node:test';
import assert from 'node:assert/strict';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { SalaryComponentsService } from './components/salary-components.service';
import { SalaryStructuresService } from './structures/salary-structures.service';
import { EmployeeSalaryService } from './employee-salary/employee-salary.service';
import { SalaryCalculationService } from './calculation/salary-calculation.service';
import { ComponentTypeEnum, CalculationTypeEnum } from './components/dto/salary-component.dto';

test('Salary Workflow - End to End Integration Test', async () => {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ?? 'postgresql://postgres:Karan%40123@localhost:5432/paymatrix',
    max: 5,
  });
  const db = drizzle(pool, { schema });

  try {
    // 1. Get or create test company
    let company: any = await db.query.companies.findFirst();
    if (!company) {
      const [c] = await db
        .insert(schema.companies)
        .values({
          name: 'Salary Test Corp',
          legalName: 'Salary Test Corporation Pvt Ltd',
          code: `STC-${Date.now().toString().slice(-4)}`,
        })
        .returning();
      company = c;
    }

    const companyId = company.id;

    // 2. Get or create test employee
    let employee: any = await db.query.employees.findFirst({
      where: eq(schema.employees.companyId, companyId),
    });
    if (!employee) {
      const [emp] = await db
        .insert(schema.employees)
        .values({
          companyId,
          employeeCode: `TEST-EMP-${Date.now().toString().slice(-4)}`,
          firstName: 'Salary',
          lastName: 'Tester',
          email: `salary.tester.${Date.now()}@example.com`,
          joiningDate: '2026-01-01',
        })
        .returning();
      employee = emp;
    }

    // Instantiate services
    const calcService = new SalaryCalculationService(db);
    const compService = new SalaryComponentsService(db);
    const structService = new SalaryStructuresService(db, calcService);
    const empSalaryService = new EmployeeSalaryService(db, calcService);

    const testUserId = '00000000-0000-0000-0000-000000000000';
    const nonce = Date.now().toString().slice(-4);

    // 3. Create Components
    const basicCompRes = await compService.create(
      companyId,
      {
        code: `TST_BAS_${nonce}`,
        name: 'Test Basic Salary',
        componentType: ComponentTypeEnum.EARNING,
        calculationType: CalculationTypeEnum.FIXED,
        defaultAmount: 30000,
        displayOrder: 1,
      },
      testUserId,
    );
    const basicComp = basicCompRes.data;

    const hraCompRes = await compService.create(
      companyId,
      {
        code: `TST_HRA_${nonce}`,
        name: 'Test House Rent Allowance',
        componentType: ComponentTypeEnum.EARNING,
        calculationType: CalculationTypeEnum.PERCENTAGE,
        defaultPercentage: 40,
        calculationBasis: basicComp.code,
        displayOrder: 2,
      },
      testUserId,
    );
    const hraComp = hraCompRes.data;

    const pfCompRes = await compService.create(
      companyId,
      {
        code: `TST_PF_${nonce}`,
        name: 'Test Employee PF',
        componentType: ComponentTypeEnum.DEDUCTION,
        calculationType: CalculationTypeEnum.PERCENTAGE,
        defaultPercentage: 12,
        calculationBasis: basicComp.code,
        displayOrder: 3,
      },
      testUserId,
    );
    const pfComp = pfCompRes.data;

    assert.ok(basicComp.id);
    assert.ok(hraComp.id);
    assert.ok(pfComp.id);

    // 4. Create Structure with Live Preview
    const previewRes = await structService.preview(companyId, {
      components: [
        {
          salaryComponentId: basicComp.id,
          calculationType: CalculationTypeEnum.FIXED,
          amount: 30000,
          displayOrder: 1,
        },
        {
          salaryComponentId: hraComp.id,
          calculationType: CalculationTypeEnum.PERCENTAGE,
          percentage: 40,
          percentageOf: basicComp.code,
          displayOrder: 2,
        },
        {
          salaryComponentId: pfComp.id,
          calculationType: CalculationTypeEnum.PERCENTAGE,
          percentage: 12,
          percentageOf: basicComp.code,
          displayOrder: 3,
        },
      ],
    });

    assert.equal(previewRes.data.totals.gross, 42000); // 30000 + 12000
    assert.equal(previewRes.data.totals.deductions, 3600); // 12% of 30000
    assert.equal(previewRes.data.totals.net, 38400);

    const structRes = await structService.create(
      companyId,
      {
        code: `TST_STR_${nonce}`,
        name: 'Test Standard Structure',
        effectiveFrom: '2026-01-01',
        components: [
          {
            salaryComponentId: basicComp.id,
            calculationType: CalculationTypeEnum.FIXED,
            amount: 30000,
            displayOrder: 1,
          },
          {
            salaryComponentId: hraComp.id,
            calculationType: CalculationTypeEnum.PERCENTAGE,
            percentage: 40,
            percentageOf: basicComp.code,
            displayOrder: 2,
          },
          {
            salaryComponentId: pfComp.id,
            calculationType: CalculationTypeEnum.PERCENTAGE,
            percentage: 12,
            percentageOf: basicComp.code,
            displayOrder: 3,
          },
        ],
      },
      testUserId,
    );

    const structure = structRes.data;
    assert.ok(structure.id);
    assert.equal(structure.components.length, 3);

    // 5. Assign to Employee
    const assignRes = await empSalaryService.assignOrReviseSalary(
      companyId,
      employee.id,
      {
        salaryStructureId: structure.id,
        effectiveFrom: '2026-01-01',
        reason: 'Initial onboarding salary',
      },
      testUserId,
    );
    assert.equal(assignRes.success, true);

    const currentSalRes = await empSalaryService.getCurrentSalary(companyId, employee.id);
    assert.equal(currentSalRes.data.totals.gross, 42000);
    assert.equal(currentSalRes.data.totals.net, 38400);

    // 6. Revise Salary with Overrides and Effective Date
    const reviseRes = await empSalaryService.assignOrReviseSalary(
      companyId,
      employee.id,
      {
        salaryStructureId: structure.id,
        effectiveFrom: '2026-07-01',
        reason: 'Mid-year merit promotion',
        components: [
          {
            salaryComponentId: basicComp.id,
            calculationType: CalculationTypeEnum.FIXED,
            amount: 40000, // Override Basic from 30k to 40k
          },
        ],
      },
      testUserId,
    );
    assert.equal(reviseRes.success, true);

    const historyRes = await empSalaryService.getSalaryHistory(companyId, employee.id);
    assert.ok(historyRes.data.length >= 2);
    // Predecessor must be HISTORICAL with effectiveTo closed
    const predecessor = historyRes.data.find((h: any) => h.effectiveFrom === '2026-01-01');
    assert.equal(predecessor.status, 'HISTORICAL');
    assert.equal(predecessor.effectiveTo, '2026-06-30');

    // 7. Preview with Attendance & Leave
    const attPreview = await empSalaryService.getSalaryPreview(companyId, employee.id, {
      month: '2026-07',
      policy: 'CALENDAR_DAYS' as any,
    });
    assert.equal(attPreview.success, true);
    assert.ok(attPreview.data.attendanceSummary.calendarDays === 31);
    assert.ok(attPreview.data.baseSalary.gross > 0);

    // 8. Cancel Latest Revision
    const latestRevision = historyRes.data.find((h: any) => h.effectiveFrom === '2026-07-01');
    const cancelRes = await empSalaryService.cancelSalary(
      companyId,
      employee.id,
      latestRevision.id,
      { reason: 'Promotion rolled back' },
      testUserId,
    );
    assert.equal(cancelRes.success, true);

    // After cancellation, predecessor is restored to ACTIVE
    const restoredCurrent = await empSalaryService.getCurrentSalary(companyId, employee.id);
    assert.equal(restoredCurrent.data.totals.gross, 42000);

    // Cleanup created test records
    await db
      .delete(schema.employeeSalaryStructures)
      .where(eq(schema.employeeSalaryStructures.employeeId, employee.id));
    await db
      .delete(schema.salaryStructureComponents)
      .where(eq(schema.salaryStructureComponents.salaryStructureId, structure.id));
    await db
      .delete(schema.salaryStructures)
      .where(eq(schema.salaryStructures.id, structure.id));
    await db
      .delete(schema.salaryComponents)
      .where(
        eq(schema.salaryComponents.id, basicComp.id),
      );
    await db
      .delete(schema.salaryComponents)
      .where(
        eq(schema.salaryComponents.id, hraComp.id),
      );
    await db
      .delete(schema.salaryComponents)
      .where(
        eq(schema.salaryComponents.id, pfComp.id),
      );
  } finally {
    await pool.end();
  }
});
