import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { PayrollAdjustmentDto } from '../runs/dto/payroll-run.dto';

@Injectable()
export class PayrollAdjustmentsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async addAdjustment(
    companyId: string,
    runId: string,
    employeeId: string,
    dto: PayrollAdjustmentDto,
    userId: string,
  ) {
    // 1. Check payroll run status
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, runId),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');

    if (['FINALIZED', 'PAID'].includes(run.status)) {
      throw new BadRequestException({
        code: 'PAYROLL_LOCKED',
        message: 'Cannot add adjustments to a finalized or paid payroll run.',
      });
    }

    // 2. Find payroll employee record
    const pe: any = await this.db.query.payrollEmployees.findFirst({
      where: and(
        eq(schema.payrollEmployees.payrollRunId, runId),
        eq(schema.payrollEmployees.employeeId, employeeId),
      ),
    });

    if (!pe) {
      throw new NotFoundException({
        code: 'PAYROLL_EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in this payroll run',
      });
    }

    const isAddition =
      dto.isAddition !== undefined
        ? dto.isAddition
        : ['ARREAR', 'BONUS', 'OTHER_EARNING'].includes(dto.type);

    const amount = Number(dto.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new BadRequestException('Adjustment amount must be a positive number');
    }

    // Map adjustment type enum
    let adjType: any = 'OTHER';
    if (['ARREAR', 'RECOVERY', 'ROUNDING', 'CORRECTION'].includes(dto.type)) {
      adjType = dto.type;
    } else if (dto.type === 'BONUS') {
      adjType = 'MANUAL_BONUS';
    } else if (dto.type === 'OTHER_DEDUCTION') {
      adjType = 'MANUAL_DEDUCTION';
    }

    const [adjustment] = await this.db
      .insert(schema.payrollAdjustments)
      .values({
        payrollEmployeeId: pe.id,
        type: dto.type,
        name: dto.name,
        adjustmentType: adjType,
        description: dto.description || dto.name,
        amount: amount.toString() as any,
        isAddition,
        reason: dto.reason,
        createdBy: userId,
      })
      .returning();

    // Recompute employee totals
    await this.recalculateEmployeeFinancials(pe.id, runId);

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_adjustment',
        entityId: adjustment.id,
        action: 'CREATE',
        newValues: {
          payrollRunId: runId,
          employeeId,
          type: dto.type,
          amount,
          reason: dto.reason,
        } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: adjustment,
      message: 'Payroll adjustment added successfully',
    };
  }

  async listAdjustments(companyId: string, runId: string, employeeId: string) {
    const pe: any = await this.db.query.payrollEmployees.findFirst({
      where: and(
        eq(schema.payrollEmployees.payrollRunId, runId),
        eq(schema.payrollEmployees.employeeId, employeeId),
      ),
      with: {
        adjustments: true,
      },
    });

    if (!pe) throw new NotFoundException('Employee not found in this payroll run');

    return {
      success: true,
      data: pe.adjustments || [],
    };
  }

  async deleteAdjustment(companyId: string, adjustmentId: string, userId: string) {
    const adj: any = await this.db.query.payrollAdjustments.findFirst({
      where: eq(schema.payrollAdjustments.id, adjustmentId),
      with: {
        payrollEmployee: {
          with: {
            payrollRun: true,
          },
        },
      },
    });

    if (!adj) throw new NotFoundException('Payroll adjustment not found');

    const pe = adj.payrollEmployee;
    const run = pe.payrollRun;

    if (run.companyId !== companyId) {
      throw new NotFoundException('Payroll adjustment not found');
    }

    if (['FINALIZED', 'PAID'].includes(run.status)) {
      throw new BadRequestException({
        code: 'PAYROLL_LOCKED',
        message: 'Cannot delete adjustments from a finalized or paid payroll run.',
      });
    }

    await this.db
      .delete(schema.payrollAdjustments)
      .where(eq(schema.payrollAdjustments.id, adjustmentId));

    // Recompute employee financials
    await this.recalculateEmployeeFinancials(pe.id, run.id);

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_adjustment',
        entityId: adjustmentId,
        action: 'DELETE',
        oldValues: {
          employeeId: pe.employeeId,
          amount: adj.amount,
          type: adj.type,
        } as any,
      })
      .catch(() => {});

    return {
      success: true,
      message: 'Payroll adjustment deleted successfully',
    };
  }

  private async recalculateEmployeeFinancials(peId: string, runId: string) {
    const pe: any = await this.db.query.payrollEmployees.findFirst({
      where: eq(schema.payrollEmployees.id, peId),
      with: {
        components: true,
        adjustments: true,
      },
    });

    if (!pe) return;

    let baseGross = 0;
    let baseDeductions = 0;
    let baseEmployer = 0;

    for (const comp of pe.components) {
      const amt = Number(comp.amount || 0);
      if (comp.componentType === 'EARNING') baseGross += amt;
      else if (comp.componentType === 'DEDUCTION') baseDeductions += amt;
      else if (comp.componentType === 'EMPLOYER_CONTRIBUTION') baseEmployer += amt;
    }

    let adjustmentAdditions = 0;
    let adjustmentDeductions = 0;

    for (const adj of pe.adjustments) {
      const amt = Number(adj.amount || 0);
      if (adj.isAddition || ['ARREAR', 'BONUS', 'OTHER_EARNING', 'MANUAL_BONUS'].includes(adj.type || adj.adjustmentType)) {
        adjustmentAdditions += amt;
      } else {
        adjustmentDeductions += amt;
      }
    }

    const totalGross = Math.round((baseGross + adjustmentAdditions) * 100) / 100;
    const totalDeductions = Math.round((baseDeductions + adjustmentDeductions) * 100) / 100;
    const netSalary = Math.round((totalGross - totalDeductions) * 100) / 100;
    const totalCtc = Math.round((totalGross + baseEmployer) * 100) / 100;

    await this.db
      .update(schema.payrollEmployees)
      .set({
        grossSalary: totalGross.toString() as any,
        grossEarnings: totalGross.toString() as any,
        totalDeductions: totalDeductions.toString() as any,
        netSalary: netSalary.toString() as any,
        totalCtc: totalCtc.toString() as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.payrollEmployees.id, peId));

    // Recompute run totals
    const allPes: any[] = await this.db.query.payrollEmployees.findMany({
      where: eq(schema.payrollEmployees.payrollRunId, runId),
    });

    let runGross = 0;
    let runDeductions = 0;
    let runEmployer = 0;
    let runNet = 0;
    let runCtc = 0;

    for (const p of allPes) {
      runGross += Number(p.grossSalary || p.grossEarnings || 0);
      runDeductions += Number(p.totalDeductions || 0);
      runEmployer += Number(p.employerContributions || 0);
      runNet += Number(p.netSalary || 0);
      runCtc += Number(p.totalCtc || 0);
    }

    await this.db
      .update(schema.payrollRuns)
      .set({
        grossAmount: (Math.round(runGross * 100) / 100).toString() as any,
        totalGross: (Math.round(runGross * 100) / 100).toString() as any,
        totalDeductions: (Math.round(runDeductions * 100) / 100).toString() as any,
        totalEmployerContributions: (Math.round(runEmployer * 100) / 100).toString() as any,
        netAmount: (Math.round(runNet * 100) / 100).toString() as any,
        totalNet: (Math.round(runNet * 100) / 100).toString() as any,
        totalCtc: (Math.round(runCtc * 100) / 100).toString() as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.payrollRuns.id, runId));
  }
}
