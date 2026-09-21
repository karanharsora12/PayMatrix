import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, lte, or, isNull, gte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { SafeFormulaEvaluator } from './safe-formula-evaluator';
import {
  CalculatedComponentItem,
  SalaryCalculationResult,
  SalaryComponentDefinition,
  SalaryPolicy,
  SalaryPreviewResponse,
  SalaryTotals,
} from './salary-calculation.types';

@Injectable()
export class SalaryCalculationService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  /**
   * Pure calculation: given component definitions and context, evaluate in topological order.
   */
  calculateComponents(
    components: SalaryComponentDefinition[],
    overrides?: Map<string, { amount?: number; percentage?: number; formula?: string }>,
  ): {
    earnings: CalculatedComponentItem[];
    deductions: CalculatedComponentItem[];
    employerContributions: CalculatedComponentItem[];
    reimbursements: CalculatedComponentItem[];
    totals: SalaryTotals;
  } {
    // 1. Merge overrides into component definitions
    const merged: SalaryComponentDefinition[] = components.map((c) => {
      const ov = overrides?.get(c.componentId) || overrides?.get(c.code);
      if (!ov) return { ...c };
      return {
        ...c,
        amount: ov.amount !== undefined ? ov.amount : c.amount,
        percentage: ov.percentage !== undefined ? ov.percentage : c.percentage,
        formula: ov.formula !== undefined ? ov.formula : c.formula,
      };
    });

    // 2. Sort by topological evaluation order
    const ordered = SafeFormulaEvaluator.getEvaluationOrder(
      merged.map((c) => ({
        ...c,
        code: c.code.toUpperCase(),
        percentageOf: c.percentageOf?.toUpperCase(),
      })),
    );

    // 3. Evaluation context maps code -> amount
    const context: Record<string, number> = {};
    const calculatedMap = new Map<string, CalculatedComponentItem>();

    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalEmployerContributions = 0;
    let totalReimbursements = 0;

    for (const comp of ordered) {
      const code = comp.code.toUpperCase();
      let amount = 0;

      if (comp.calculationType === 'FIXED') {
        amount = Number(comp.amount ?? 0);
      } else if (comp.calculationType === 'PERCENTAGE') {
        const baseKey = (comp.percentageOf || 'BASIC').toUpperCase();
        const baseVal = context[baseKey] ?? 0;
        const pct = Number(comp.percentage ?? 0);
        amount = (baseVal * pct) / 100;
      } else if (comp.calculationType === 'FORMULA') {
        amount = SafeFormulaEvaluator.evaluate(comp.formula ?? '0', context);
      }

      // Min/Max clamp if configured
      if (comp.minimumAmount != null && amount < Number(comp.minimumAmount)) {
        amount = Number(comp.minimumAmount);
      }
      if (comp.maximumAmount != null && amount > Number(comp.maximumAmount)) {
        amount = Number(comp.maximumAmount);
      }

      amount = Math.round(amount * 100) / 100;
      context[code] = amount;

      const item: CalculatedComponentItem = {
        componentId: comp.componentId,
        code: comp.code,
        name: comp.name,
        componentType: comp.componentType,
        calculationType: comp.calculationType,
        percentage: comp.percentage,
        percentageOf: comp.percentageOf,
        formula: comp.formula,
        amount,
        isTaxable: comp.isTaxable,
        isStatutory: comp.isStatutory,
      };

      calculatedMap.set(comp.componentId, item);

      if (comp.componentType === 'EARNING') {
        totalEarnings += amount;
      } else if (comp.componentType === 'DEDUCTION') {
        totalDeductions += amount;
      } else if (comp.componentType === 'EMPLOYER_CONTRIBUTION') {
        totalEmployerContributions += amount;
      } else if (comp.componentType === 'REIMBURSEMENT') {
        totalReimbursements += amount;
      }

      // Update aggregate dynamic variables for subsequent formulas
      context['GROSS'] = Math.round(totalEarnings * 100) / 100;
      context['EARNING_TOTAL'] = context['GROSS'];
      context['DEDUCTION_TOTAL'] = Math.round(totalDeductions * 100) / 100;
      context['NET'] = Math.round((totalEarnings - totalDeductions) * 100) / 100;
      context['MONTHLY_CTC'] = Math.round((totalEarnings + totalEmployerContributions) * 100) / 100;
    }

    // Preserve original display order
    const earnings: CalculatedComponentItem[] = [];
    const deductions: CalculatedComponentItem[] = [];
    const employerContributions: CalculatedComponentItem[] = [];
    const reimbursements: CalculatedComponentItem[] = [];

    for (const original of components) {
      const item = calculatedMap.get(original.componentId);
      if (!item) continue;
      if (item.componentType === 'EARNING') earnings.push(item);
      else if (item.componentType === 'DEDUCTION') deductions.push(item);
      else if (item.componentType === 'EMPLOYER_CONTRIBUTION') employerContributions.push(item);
      else if (item.componentType === 'REIMBURSEMENT') reimbursements.push(item);
    }

    const gross = Math.round(totalEarnings * 100) / 100;
    const deductionsSum = Math.round(totalDeductions * 100) / 100;
    const net = Math.round((gross - deductionsSum) * 100) / 100;
    const employerSum = Math.round(totalEmployerContributions * 100) / 100;
    const reimbSum = Math.round(totalReimbursements * 100) / 100;
    const monthlyCtc = Math.round((gross + employerSum) * 100) / 100;

    return {
      earnings,
      deductions,
      employerContributions,
      reimbursements,
      totals: {
        gross,
        deductions: deductionsSum,
        net,
        employerContribution: employerSum,
        reimbursements: reimbSum,
        monthlyCtc,
        annualGross: Math.round(gross * 12 * 100) / 100,
        annualCtc: Math.round(monthlyCtc * 12 * 100) / 100,
      },
    };
  }

  /**
   * Preview salary calculation for an ad-hoc structure or live builder in UI.
   */
  async previewStructure(
    companyId: string,
    components: Array<{
      salaryComponentId: string;
      calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
      amount?: number;
      percentage?: number;
      percentageOf?: string;
      formula?: string;
      minimumAmount?: number;
      maximumAmount?: number;
      displayOrder?: number;
    }>,
  ): Promise<SalaryCalculationResult> {
    if (!components || components.length === 0) {
      return {
        salaryDate: new Date().toISOString().slice(0, 10),
        structure: {},
        earnings: [],
        deductions: [],
        employerContributions: [],
        reimbursements: [],
        totals: {
          gross: 0,
          deductions: 0,
          net: 0,
          employerContribution: 0,
          reimbursements: 0,
          monthlyCtc: 0,
          annualGross: 0,
          annualCtc: 0,
        },
      };
    }

    // Load component masters to get codes, names, and component types
    const compIds = components.map((c) => c.salaryComponentId);
    const masters = await this.db.query.salaryComponents.findMany({
      where: and(
        eq(schema.salaryComponents.companyId, companyId),
        sql`${schema.salaryComponents.id} IN ${compIds}`,
      ),
    });

    const masterMap = new Map(masters.map((m: any) => [m.id, m]));

    const definitions: SalaryComponentDefinition[] = components.map((c, idx) => {
      const master: any = masterMap.get(c.salaryComponentId);
      if (!master) {
        throw new NotFoundException({
          code: 'COMPONENT_NOT_FOUND',
          message: `Component ID ${c.salaryComponentId} not found in this company`,
        });
      }

      return {
        componentId: master.id,
        code: master.code,
        name: master.name,
        componentType: master.componentType,
        calculationType: c.calculationType || master.calculationType,
        amount: c.amount !== undefined ? c.amount : Number(master.defaultAmount ?? 0),
        percentage: c.percentage !== undefined ? c.percentage : Number(master.defaultPercentage ?? 0),
        percentageOf: c.percentageOf || master.calculationBasis,
        formula: c.formula || master.formula,
        minimumAmount: c.minimumAmount,
        maximumAmount: c.maximumAmount,
        displayOrder: c.displayOrder ?? idx,
        isTaxable: master.isTaxable,
        isStatutory: master.isStatutory,
      };
    });

    const calculated = this.calculateComponents(definitions);

    return {
      salaryDate: new Date().toISOString().slice(0, 10),
      structure: {},
      ...calculated,
    };
  }

  /**
   * Find and calculate the effective salary for an employee on a target date.
   */
  async calculateEmployeeSalary(
    companyId: string,
    employeeId: string,
    salaryDate: string = new Date().toISOString().slice(0, 10),
  ): Promise<SalaryCalculationResult> {
    // 1. Verify employee belongs to company
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
    });
    if (!employee) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in current company',
      });
    }

    // 2. Query active employee salary structure effective on target date
    // effectiveFrom <= salaryDate AND (effectiveTo IS NULL OR effectiveTo >= salaryDate) AND status = 'ACTIVE'
    const assignments = await this.db.query.employeeSalaryStructures.findMany({
      where: and(
        eq(schema.employeeSalaryStructures.employeeId, employeeId),
        eq(schema.employeeSalaryStructures.status, 'ACTIVE'),
        lte(schema.employeeSalaryStructures.effectiveFrom, salaryDate),
        or(
          isNull(schema.employeeSalaryStructures.effectiveTo),
          gte(schema.employeeSalaryStructures.effectiveTo, salaryDate),
        ),
      ),
      with: {
        salaryStructure: {
          with: {
            components: {
              with: {
                salaryComponent: true,
              },
            },
          },
        },
        components: {
          with: {
            salaryComponent: true,
          },
        },
      },
      orderBy: (s: any, { desc }: any) => desc(s.effectiveFrom),
    });

    if (assignments.length === 0) {
      throw new NotFoundException({
        code: 'NO_EFFECTIVE_SALARY_STRUCTURE',
        message: `No active salary structure found for employee ${employee.employeeId} on date ${salaryDate}`,
      });
    }

    const assignment = assignments[0];
    const structure = assignment.salaryStructure;

    // 3. Map structure components
    const structComps: any[] = structure.components ?? [];
    structComps.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const definitions: SalaryComponentDefinition[] = structComps.map((sc: any) => {
      const comp = sc.salaryComponent;
      return {
        componentId: comp.id,
        code: comp.code,
        name: comp.name,
        componentType: comp.componentType,
        calculationType: sc.calculationType,
        amount: sc.amount ? Number(sc.amount) : Number(comp.defaultAmount ?? 0),
        percentage: sc.percentage ? Number(sc.percentage) : Number(comp.defaultPercentage ?? 0),
        percentageOf: sc.percentageOf || comp.calculationBasis,
        formula: sc.formula || comp.formula,
        minimumAmount: sc.minimumAmount ? Number(sc.minimumAmount) : undefined,
        maximumAmount: sc.maximumAmount ? Number(sc.maximumAmount) : undefined,
        displayOrder: sc.displayOrder ?? 0,
        isTaxable: comp.isTaxable,
        isStatutory: comp.isStatutory,
      };
    });

    // 4. Map overrides
    const overrides = new Map<string, { amount?: number; percentage?: number; formula?: string }>();
    for (const ov of (assignment.components as any[]) ?? []) {
      overrides.set(ov.salaryComponentId, {
        amount: ov.amount != null ? Number(ov.amount) : undefined,
        percentage: ov.percentage != null ? Number(ov.percentage) : undefined,
        formula: ov.formula || undefined,
      });
    }

    // 5. Calculate
    const calculated = this.calculateComponents(definitions, overrides);

    return {
      employeeId,
      salaryDate,
      structure: {
        id: structure.id,
        code: structure.code,
        name: structure.name,
      },
      ...calculated,
    };
  }

  /**
   * Preview salary calculation integrated with Attendance & Leave for a target month.
   */
  async previewSalaryWithAttendance(
    companyId: string,
    employeeId: string,
    month: string = new Date().toISOString().slice(0, 7), // 'YYYY-MM'
    policy: SalaryPolicy = 'CALENDAR_DAYS',
  ): Promise<SalaryPreviewResponse> {
    // 1. Fetch employee
    const employee = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
    });
    if (!employee) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in current company',
      });
    }

    // 2. Determine month dates
    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new BadRequestException({
        code: 'INVALID_MONTH_FORMAT',
        message: 'Month must be in YYYY-MM format',
      });
    }

    const startDate = `${month}-01`;
    const lastDayOfMonth = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDayOfMonth).padStart(2, '0')}`;
    const calendarDays = lastDayOfMonth;

    // 3. Fetch holidays for working day calculation
    const holidays = await this.db.query.holidays.findMany({
      where: and(
        eq(schema.holidays.companyId, companyId),
        gte(schema.holidays.holidayDate, startDate),
        lte(schema.holidays.holidayDate, endDate),
      ),
    });
    const holidayDates = new Set(holidays.map((h: any) => h.holidayDate));

    // Calculate working days (Mon-Fri, excluding company holidays)
    let workingDays = 0;
    for (let day = 1; day <= calendarDays; day++) {
      const d = new Date(year, monthNum - 1, day);
      const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.has(dateStr)) {
        workingDays++;
      }
    }

    // 4. Query employee attendance records in this month
    const attendanceRecords = await this.db.query.attendance.findMany({
      where: and(
        eq(schema.attendance.employeeId, employeeId),
        gte(schema.attendance.attendanceDate, startDate),
        lte(schema.attendance.attendanceDate, endDate),
      ),
    });

    let presentDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let onLeaveDays = 0;
    let holidayDays = 0;
    let weekOffDays = 0;

    for (const att of attendanceRecords) {
      switch (att.status) {
        case 'PRESENT':
          presentDays++;
          break;
        case 'HALF_DAY':
          halfDays++;
          break;
        case 'LATE':
          lateDays++;
          break;
        case 'ABSENT':
          absentDays++;
          break;
        case 'ON_LEAVE':
          onLeaveDays++;
          break;
        case 'HOLIDAY':
          holidayDays++;
          break;
        case 'WEEK_OFF':
          weekOffDays++;
          break;
        default:
          break;
      }
    }

    // 5. Query approved leaves overlapping with this month
    const leaveRequests = await this.db.query.leaveRequests.findMany({
      where: and(
        eq(schema.leaveRequests.employeeId, employeeId),
        eq(schema.leaveRequests.status, 'APPROVED'),
        lte(schema.leaveRequests.fromDate, endDate),
        gte(schema.leaveRequests.toDate, startDate),
      ),
      with: {
        leaveType: true,
      },
    });

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    for (const req of leaveRequests) {
      const isPaid = req.leaveType?.isPaid ?? true;
      const totalDays = Number(req.totalDays ?? 1);
      if (isPaid) {
        paidLeaveDays += totalDays;
      } else {
        unpaidLeaveDays += totalDays;
      }
    }

    // 6. Compute Paid Days & Payable Factor
    // Paid days = present + (halfDay * 0.5) + late + paidLeave + holiday + weekOff
    const rawPaidDays =
      presentDays +
      halfDays * 0.5 +
      lateDays +
      paidLeaveDays +
      holidayDays +
      weekOffDays;

    const paidDays = Math.min(calendarDays, Math.max(0, Math.round(rawPaidDays * 10) / 10));
    const unpaidDays = Math.max(0, Math.round((calendarDays - paidDays) * 10) / 10);

    let payableFactor = 1.0;
    if (policy === 'CALENDAR_DAYS') {
      payableFactor = calendarDays > 0 ? paidDays / calendarDays : 1.0;
    } else if (policy === 'WORKING_DAYS') {
      const earnedWorkingDays = presentDays + halfDays * 0.5 + lateDays + paidLeaveDays;
      payableFactor = workingDays > 0 ? Math.min(1.0, earnedWorkingDays / workingDays) : 1.0;
    } else if (policy === 'FIXED_MONTHLY') {
      payableFactor = calendarDays > 0 ? Math.max(0, 1.0 - unpaidLeaveDays / calendarDays) : 1.0;
    }
    payableFactor = Math.round(payableFactor * 10000) / 10000;

    // 7. Calculate base monthly salary using effective structure
    const baseCalc = await this.calculateEmployeeSalary(companyId, employeeId, endDate);

    // 8. Compute prorated payable salary
    const baseGross = baseCalc.totals.gross;
    const baseDed = baseCalc.totals.deductions;
    const payableGross = Math.round(baseGross * payableFactor * 100) / 100;
    const payableDed = Math.round(baseDed * payableFactor * 100) / 100;
    const payableNet = Math.round((payableGross - payableDed) * 100) / 100;
    const payableMonthlyCtc = Math.round(
      (payableGross + baseCalc.totals.employerContribution * payableFactor) * 100,
    ) / 100;

    return {
      employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      month,
      salaryPolicy: policy,
      structure: {
        id: baseCalc.structure.id || '',
        code: baseCalc.structure.code || '',
        name: baseCalc.structure.name || '',
      },
      attendanceSummary: {
        calendarDays,
        workingDays,
        presentDays,
        halfDays,
        lateDays,
        absentDays,
        onLeaveDays,
        holidayDays,
        weekOffDays,
      },
      leaveSummary: {
        paidLeaveDays,
        unpaidLeaveDays,
        totalLeaveDays: paidLeaveDays + unpaidLeaveDays,
      },
      paidDays,
      unpaidDays,
      payableFactor,
      baseSalary: baseCalc.totals,
      estimatedPayable: {
        payableGross,
        payableDeductions: payableDed,
        payableNet,
        monthlyCtc: payableMonthlyCtc,
      },
      breakdown: {
        earnings: baseCalc.earnings,
        deductions: baseCalc.deductions,
        employerContributions: baseCalc.employerContributions,
      },
    };
  }
}
