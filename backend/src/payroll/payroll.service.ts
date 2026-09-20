import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { PayrollCalculationService } from './payroll-calculation.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['CALCULATING', 'CALCULATED', 'CANCELLED'],
  CALCULATING: ['CALCULATED', 'CANCELLED'],
  CALCULATED: ['PENDING_APPROVAL', 'DRAFT', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CALCULATED', 'CANCELLED'],
  APPROVED: ['FINALIZED', 'CANCELLED'],
  FINALIZED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

@Injectable()
export class PayrollService {
  constructor(@Inject(DRIZZLE) private db: any, private calc: PayrollCalculationService) {}

  private assertTransition(from: string, to: string) {
    if (!VALID_TRANSITIONS[from]?.includes(to)) throw new BadRequestException({ code: 'PAYROLL_INVALID_STATUS', message: `Cannot transition from ${from} to ${to}` });
  }

  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.payrollRuns.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.payrollRuns).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.payrollRuns.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (p: any, { desc }: any) => desc(p.periodStart) });
    return paginated(rows, total, dto, 'Payroll runs fetched');
  }

  async get(companyId: string, id: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)), with: { employees: { with: { employee: true, components: { with: { salaryComponent: true } }, adjustments: true } }, approvals: true } });
    if (!run) throw new NotFoundException({ code: 'PAYROLL_NOT_FOUND', message: 'Payroll run not found' });
    return { success: true, data: run };
  }

  async create(companyId: string, dto: any, userId: string) {
    // Check duplicate period
    const exists = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.companyId, companyId), eq(p.periodStart, dto.periodStart), eq(p.periodEnd, dto.periodEnd)) });
    if (exists) throw new ConflictException({ code: 'PAYROLL_PERIOD_EXISTS', message: 'Payroll for this period already exists' });
    const code = dto.payrollCode ?? `PAY-${dto.periodStart.slice(0, 7)}-${Date.now().toString().slice(-4)}`;
    const [row] = await this.db.insert(schema.payrollRuns).values({ companyId, payrollCode: code, periodStart: dto.periodStart, periodEnd: dto.periodEnd, payDate: dto.payDate, status: 'DRAFT', preparedBy: userId }).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'payroll', entityType: 'payroll_run', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Payroll run created' };
  }

  async calculate(companyId: string, id: string, userId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!['DRAFT', 'CALCULATED'].includes(run.status)) throw new BadRequestException({ code: 'PAYROLL_INVALID_STATUS', message: `Cannot calculate in status ${run.status}` });
    // Mark calculating
    await this.db.update(schema.payrollRuns).set({ status: 'CALCULATING', updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id));

    // Transactional calculation
    try {
      await this.db.transaction(async (tx: any) => {
        // Clear previous snapshots if recalculating
        const existing = await tx.query.payrollEmployees.findMany({ where: (pe: any, { eq }: any) => eq(pe.payrollRunId, id) });
        if (existing.length) {
          for (const pe of existing) await tx.delete(schema.payrollComponents).where(eq(schema.payrollComponents.payrollEmployeeId, pe.id));
          await tx.delete(schema.payrollEmployees).where(eq(schema.payrollEmployees.payrollRunId, id));
        }

        // Load eligible employees (active, joined before periodEnd)
        const employees: any[] = await tx.query.employees.findMany({ where: (e: any, { eq, and, sql }: any) => and(eq(e.companyId, companyId), eq(e.isActive, true), sql`${e.joiningDate} <= ${run.periodEnd}`) });

        let grossTotal = 0, dedTotal = 0, netTotal = 0, empContTotal = 0;

        for (const emp of employees) {
          // Salary snapshot
          const sal: any = await tx.query.employeeSalaryStructures.findFirst({ where: (s: any, { eq, and, lte, sql }: any) => and(eq(s.employeeId, emp.id), sql`${s.effectiveFrom} <= ${run.periodEnd}`, sql`(${s.effectiveTo} IS NULL OR ${s.effectiveTo} >= ${run.periodStart})`), with: { components: { with: { salaryComponent: true } }, salaryStructure: { with: { components: { with: { salaryComponent: true } } } } } });
          if (!sal) continue; // skip if no salary

          // Build salary components list
          const comps: any[] = [];
          const baseStruct = sal.salaryStructure;
          const compMap = new Map();
          for (const sc of baseStruct.components) compMap.set(sc.salaryComponentId, { comp: sc.salaryComponent, sc });
          // Overrides
          for (const ov of sal.components ?? []) {
            const existing = compMap.get(ov.salaryComponentId);
            if (existing) {
              compMap.set(ov.salaryComponentId, { comp: existing.comp, sc: { ...existing.sc, calculationType: ov.calculationType, amount: ov.amount, percentage: ov.percentage, formula: ov.formula } });
            }
          }
          for (const [cid, v] of compMap) {
            comps.push({ componentId: cid, code: v.comp.code, name: v.comp.name, type: v.comp.componentType, calculationType: v.sc.calculationType, amount: v.sc.amount, percentage: v.sc.percentage, formula: v.sc.formula });
          }

          // Attendance summary
          const attRows: any[] = await tx.select().from(schema.attendance).where(and(eq(schema.attendance.employeeId, emp.id), gte(schema.attendance.attendanceDate, run.periodStart), lte(schema.attendance.attendanceDate, run.periodEnd)));
          const workingDays = 22; // Could compute from calendar
          const presentDays = attRows.filter((a: any) => ['PRESENT', 'LATE', 'HALF_DAY'].includes(a.status)).length;
          const overtimeMinutes = attRows.reduce((s: number, a: any) => s + (a.overtimeMinutes ?? 0), 0);

          // Leave
          const leaves: any[] = await tx.select().from(schema.leaveRequests).where(and(eq(schema.leaveRequests.employeeId, emp.id), eq(schema.leaveRequests.status, 'APPROVED'), gte(schema.leaveRequests.fromDate, run.periodStart), lte(schema.leaveRequests.toDate, run.periodEnd)));
          const paidLeaveDays = leaves.filter((l: any) => true).length; // simplified

          // Bonuses
          const bonuses: any[] = await tx.select().from(schema.bonuses).where(and(eq(schema.bonuses.employeeId, emp.id), eq(schema.bonuses.status, 'APPROVED'), gte(schema.bonuses.bonusDate, run.periodStart), lte(schema.bonuses.bonusDate, run.periodEnd)));

          // Recurring deductions
          const deductions: any[] = await tx.select().from(schema.employeeDeductions).where(and(eq(schema.employeeDeductions.employeeId, emp.id), eq(schema.employeeDeductions.status, 'ACTIVE')));

          // Loans EMI
          const loans: any[] = await tx.select().from(schema.employeeLoans).where(and(eq(schema.employeeLoans.employeeId, emp.id), eq(schema.employeeLoans.status, 'RECOVERING')));
          const loanEmi = loans.reduce((s: number, l: any) => s + Number(l.emiAmount ?? 0), 0).toString();

          // Advances
          const advances: any[] = await tx.select().from(schema.employeeAdvances).where(and(eq(schema.employeeAdvances.employeeId, emp.id), eq(schema.employeeAdvances.status, 'RECOVERING')));
          const advRec = advances.reduce((s: number, a: any) => s + Number(a.recoveryAmount ?? 0), 0).toString();

          const calc = this.calc.calculateEmployee({
            salaryComponents: comps,
            attendance: { workingDays, presentDays, paidLeaveDays, unpaidLeaveDays: 0, absentDays: workingDays - presentDays - paidLeaveDays, overtimeMinutes },
            bonuses: bonuses.map((b: any) => ({ amount: b.amount })),
            deductions: deductions.map((d: any) => ({ amount: d.amount, percentage: d.percentage, componentType: 'DEDUCTION' })),
            loanEmi,
            advanceRecovery: advRec,
          });

          const [pe] = await tx.insert(schema.payrollEmployees).values({
            payrollRunId: id,
            employeeId: emp.id,
            workingDays,
            presentDays: presentDays.toString() as any,
            paidLeaveDays: paidLeaveDays.toString() as any,
            unpaidLeaveDays: '0',
            absentDays: (workingDays - presentDays - paidLeaveDays).toString() as any,
            overtimeMinutes,
            grossEarnings: calc.gross,
            totalDeductions: calc.totalDeductions,
            employerContributions: calc.totalEmployer,
            netSalary: calc.net,
            status: 'CALCULATED',
          }).returning();

          for (const e of calc.earnings) {
            const compId = comps.find((c) => c.code === e.code)?.componentId ?? comps[0]?.componentId;
            if (!compId) continue;
            await tx.insert(schema.payrollComponents).values({ payrollEmployeeId: pe.id, salaryComponentId: compId, componentType: 'EARNING', calculationType: 'FIXED', amount: e.amount, isTaxable: true });
          }
          for (const d of calc.deductions) {
            const compId = comps.find((c) => c.type === 'DEDUCTION')?.componentId ?? comps[0]?.componentId;
            if (!compId) continue;
            await tx.insert(schema.payrollComponents).values({ payrollEmployeeId: pe.id, salaryComponentId: compId, componentType: 'DEDUCTION', calculationType: 'FIXED', amount: d.amount, isTaxable: false });
          }

          grossTotal += Number(calc.gross);
          dedTotal += Number(calc.totalDeductions);
          empContTotal += Number(calc.totalEmployer);
          netTotal += Number(calc.net);
        }

        await tx.update(schema.payrollRuns).set({ status: 'CALCULATED', employeeCount: employees.length, grossAmount: grossTotal.toString() as any, totalDeductions: dedTotal.toString() as any, totalEmployerContributions: empContTotal.toString() as any, netAmount: netTotal.toString() as any, updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id));
      });

      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'payroll', entityType: 'payroll_run', entityId: id, action: 'CALCULATE', newValues: { status: 'CALCULATED' } as any }).catch(()=>{});
      const updated = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq }: any) => eq(p.id, id) });
      return { success: true, data: updated, message: 'Payroll calculated' };
    } catch (e: any) {
      await this.db.update(schema.payrollRuns).set({ status: 'DRAFT', updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id));
      throw new BadRequestException({ code: 'PAYROLL_CALCULATION_FAILED', message: e.message ?? 'Calculation failed' });
    }
  }

  async submit(companyId: string, id: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll not found');
    this.assertTransition(run.status, 'PENDING_APPROVAL');
    const [row] = await this.db.update(schema.payrollRuns).set({ status: 'PENDING_APPROVAL', updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id)).returning();
    return { success: true, data: row, message: 'Submitted for approval' };
  }

  async approve(companyId: string, id: string, approverId: string, comments?: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll not found');
    this.assertTransition(run.status, 'APPROVED');
    const [approval] = await this.db.insert(schema.payrollApprovals).values({ payrollRunId: id, approverId, approvalLevel: 1, status: 'APPROVED', comments, approvedAt: new Date() }).returning();
    const [row] = await this.db.update(schema.payrollRuns).set({ status: 'APPROVED', approvedBy: approverId, approvedAt: new Date(), updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id)).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId: approverId, module: 'payroll', entityType: 'payroll_run', entityId: id, action: 'APPROVE', newValues: { comments } as any }).catch(()=>{});
    await this.db.insert(schema.notifications).values({ companyId, userId: run.preparedBy ?? approverId, type: 'PAYROLL', title: 'Payroll approved', message: `Payroll ${run.payrollCode} approved`, entityType: 'payroll_run', entityId: id }).catch(()=>{});
    return { success: true, data: { run: row, approval }, message: 'Payroll approved' };
  }

  async finalize(companyId: string, id: string, userId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll not found');
    this.assertTransition(run.status, 'FINALIZED');
    // Generate payslips
    await this.db.transaction(async (tx: any) => {
      const pes: any[] = await tx.query.payrollEmployees.findMany({ where: (pe: any, { eq }: any) => eq(pe.payrollRunId, id) });
      for (const pe of pes) {
        const exists = await tx.query.payslips.findFirst({ where: (ps: any, { eq }: any) => eq(ps.payrollEmployeeId, pe.id) });
        if (!exists) await tx.insert(schema.payslips).values({ payrollEmployeeId: pe.id, payslipNumber: `PS-${run.payrollCode}-${pe.employeeId.slice(0, 6).toUpperCase()}`, status: 'GENERATED' });
        await tx.update(schema.payrollEmployees).set({ status: 'APPROVED', updatedAt: new Date() }).where(eq(schema.payrollEmployees.id, pe.id));
      }
      await tx.update(schema.payrollRuns).set({ status: 'FINALIZED', processedAt: new Date(), updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id));
    });
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'payroll', entityType: 'payroll_run', entityId: id, action: 'FINALIZE', newValues: { status: 'FINALIZED' } as any }).catch(()=>{});
    const updated = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq }: any) => eq(p.id, id) });
    return { success: true, data: updated, message: 'Payroll finalized and payslips generated' };
  }

  async cancel(companyId: string, id: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, id), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll not found');
    this.assertTransition(run.status, 'CANCELLED');
    const [row] = await this.db.update(schema.payrollRuns).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(schema.payrollRuns.id, id)).returning();
    return { success: true, data: row, message: 'Payroll cancelled' };
  }

  async payslips(companyId: string, payrollId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.id, payrollId), eq(p.companyId, companyId)) });
    if (!run) throw new NotFoundException('Payroll not found');
    const pes: any[] = await this.db.query.payrollEmployees.findMany({ where: (pe: any, { eq }: any) => eq(pe.payrollRunId, payrollId), with: { employee: true, payslip: true } });
    return { success: true, data: pes };
  }
}

