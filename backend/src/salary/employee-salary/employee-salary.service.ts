import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import {
  AssignEmployeeSalaryDto,
  CancelSalaryDto,
  SalaryPreviewQueryDto,
} from './dto/employee-salary.dto';
import { SalaryCalculationService } from '../calculation/salary-calculation.service';
import { SalaryComponentDefinition } from '../calculation/salary-calculation.types';

@Injectable()
export class EmployeeSalaryService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  private async verifyEmployee(companyId: string, employeeId: string) {
    const emp = await this.db.query.employees.findFirst({
      where: and(eq(schema.employees.id, employeeId), eq(schema.employees.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in your company',
      });
    }
    return emp;
  }

  async getCurrentSalary(companyId: string, employeeId: string) {
    await this.verifyEmployee(companyId, employeeId);

    const today = new Date().toISOString().slice(0, 10);
    try {
      const calculated = await this.calculationService.calculateEmployeeSalary(
        companyId,
        employeeId,
        today,
      );
      return { success: true, data: calculated };
    } catch (err: any) {
      if (err.response?.code === 'NO_EFFECTIVE_SALARY_STRUCTURE') {
        // Return null data gracefully for unassigned employees
        return { success: true, data: null, message: 'No active salary structure assigned' };
      }
      throw err;
    }
  }

  async getSalaryHistory(companyId: string, employeeId: string) {
    await this.verifyEmployee(companyId, employeeId);

    const rows = await this.db.query.employeeSalaryStructures.findMany({
      where: eq(schema.employeeSalaryStructures.employeeId, employeeId),
      with: {
        salaryStructure: true,
        components: {
          with: {
            salaryComponent: true,
          },
        },
      },
      orderBy: (s: any, { desc }: any) => desc(s.effectiveFrom),
    });

    return { success: true, data: rows };
  }

  async assignOrReviseSalary(
    companyId: string,
    employeeId: string,
    dto: AssignEmployeeSalaryDto,
    userId: string,
  ) {
    const employee = await this.verifyEmployee(companyId, employeeId);

    // 1. Verify structure belongs to same company
    const structure = await this.db.query.salaryStructures.findFirst({
      where: and(
        eq(schema.salaryStructures.id, dto.salaryStructureId),
        eq(schema.salaryStructures.companyId, companyId),
      ),
      with: {
        components: {
          with: {
            salaryComponent: true,
          },
        },
      },
    });

    if (!structure) {
      throw new NotFoundException({
        code: 'SALARY_STRUCTURE_NOT_FOUND',
        message: 'Salary structure not found in your company',
      });
    }

    // 2. Fetch existing history for effective date validation
    const existing = await this.db.query.employeeSalaryStructures.findMany({
      where: and(
        eq(schema.employeeSalaryStructures.employeeId, employeeId),
        eq(schema.employeeSalaryStructures.status, 'ACTIVE'),
      ),
      orderBy: (s: any, { desc }: any) => desc(s.effectiveFrom),
    });

    const newEffectiveFrom = new Date(dto.effectiveFrom);

    if (existing.length > 0) {
      const latest = existing[0];
      const latestEffectiveFrom = new Date(latest.effectiveFrom);

      if (newEffectiveFrom <= latestEffectiveFrom) {
        throw new BadRequestException({
          code: 'SALARY_INVALID_EFFECTIVE_DATE',
          message: `Effective date (${dto.effectiveFrom}) must be after the current structure's effective date (${latest.effectiveFrom})`,
        });
      }
    }

    // 3. Compute baseline financial totals to persist with structure
    const definitions: SalaryComponentDefinition[] = (structure.components ?? []).map(
      (sc: any) => ({
        componentId: sc.salaryComponentId,
        code: sc.salaryComponent.code,
        name: sc.salaryComponent.name,
        componentType: sc.salaryComponent.componentType,
        calculationType: sc.calculationType,
        amount: sc.amount ? Number(sc.amount) : Number(sc.salaryComponent.defaultAmount ?? 0),
        percentage: sc.percentage
          ? Number(sc.percentage)
          : Number(sc.salaryComponent.defaultPercentage ?? 0),
        percentageOf: sc.percentageOf || sc.salaryComponent.calculationBasis,
        formula: sc.formula || sc.salaryComponent.formula,
        minimumAmount: sc.minimumAmount ? Number(sc.minimumAmount) : undefined,
        maximumAmount: sc.maximumAmount ? Number(sc.maximumAmount) : undefined,
      }),
    );

    const overridesMap = new Map<string, { amount?: number; percentage?: number; formula?: string }>();
    for (const ov of dto.components || []) {
      overridesMap.set(ov.salaryComponentId, {
        amount: ov.amount,
        percentage: ov.percentage,
        formula: ov.formula,
      });
    }

    const calculated = this.calculationService.calculateComponents(definitions, overridesMap);

    const basicComp = calculated.earnings.find((e) => e.code === 'BASIC');
    const basicSalary = basicComp ? basicComp.amount : 0;
    const grossSalary = calculated.totals.gross;
    const annualCtc = calculated.totals.annualCtc;

    // 4. Save transactionally: Close predecessor, insert new record & overrides
    const newRecord = await this.db.transaction(async (tx: any) => {
      // Close predecessor's effectiveTo
      if (existing.length > 0) {
        const latest = existing[0];
        // Day before new effective from
        const prevDay = new Date(newEffectiveFrom);
        prevDay.setDate(prevDay.getDate() - 1);
        const prevDayStr = prevDay.toISOString().slice(0, 10);

        await tx
          .update(schema.employeeSalaryStructures)
          .set({
            effectiveTo: prevDayStr,
            status: 'HISTORICAL',
            updatedAt: new Date(),
          })
          .where(eq(schema.employeeSalaryStructures.id, latest.id));
      }

      // Insert new assignment
      const [inserted] = await tx
        .insert(schema.employeeSalaryStructures)
        .values({
          companyId,
          employeeId,
          salaryStructureId: dto.salaryStructureId,
          effectiveFrom: dto.effectiveFrom,
          effectiveTo: dto.effectiveTo || null,
          basicSalary: basicSalary.toString(),
          grossSalary: grossSalary.toString(),
          annualCtc: annualCtc.toString(),
          status: 'ACTIVE',
          reason: dto.reason?.trim(),
          notes: dto.notes?.trim(),
        })
        .returning();

      // Insert override components
      if (dto.components && dto.components.length > 0) {
        for (const ov of dto.components) {
          await tx.insert(schema.employeeSalaryComponents).values({
            employeeSalaryStructureId: inserted.id,
            salaryComponentId: ov.salaryComponentId,
            calculationType: ov.calculationType,
            amount: ov.amount != null ? ov.amount.toString() : null,
            percentage: ov.percentage != null ? ov.percentage.toString() : null,
            percentageOf: ov.percentageOf?.trim().toUpperCase(),
            formula: ov.formula?.trim(),
            reason: ov.reason?.trim(),
          });
        }
      }

      return inserted;
    });

    // 5. Audit Log outside transaction
    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'employee_salary',
        entityId: newRecord.id,
        action: existing.length > 0 ? 'REVISE' : 'ASSIGN',
        oldValues: existing.length > 0 ? (existing[0] as any) : null,
        newValues: {
          ...newRecord,
          structureName: structure.name,
          employeeCode: employee.employeeId,
          reason: dto.reason,
        },
      })
      .catch(() => {});

    return {
      success: true,
      data: newRecord,
      message:
        existing.length > 0
          ? 'Salary revision saved successfully'
          : 'Salary structure assigned successfully',
    };
  }

  async cancelSalary(
    companyId: string,
    employeeId: string,
    salaryId: string,
    dto: CancelSalaryDto,
    userId: string,
  ) {
    await this.verifyEmployee(companyId, employeeId);

    const record = await this.db.query.employeeSalaryStructures.findFirst({
      where: and(
        eq(schema.employeeSalaryStructures.id, salaryId),
        eq(schema.employeeSalaryStructures.employeeId, employeeId),
      ),
    });

    if (!record) {
      throw new NotFoundException({
        code: 'SALARY_ASSIGNMENT_NOT_FOUND',
        message: 'Salary assignment record not found',
      });
    }

    if (record.status === 'CANCELLED') {
      throw new BadRequestException({
        code: 'SALARY_ALREADY_CANCELLED',
        message: 'Salary assignment is already cancelled',
      });
    }

    await this.db.transaction(async (tx: any) => {
      await tx
        .update(schema.employeeSalaryStructures)
        .set({
          status: 'CANCELLED',
          remarks: dto.reason || 'Cancelled by user',
          updatedAt: new Date(),
        })
        .where(eq(schema.employeeSalaryStructures.id, salaryId));

      // Re-activate immediate predecessor if predecessor had been closed by this assignment
      const predecessor = await tx.query.employeeSalaryStructures.findFirst({
        where: and(
          eq(schema.employeeSalaryStructures.employeeId, employeeId),
          eq(schema.employeeSalaryStructures.status, 'HISTORICAL'),
        ),
        orderBy: (s: any, { desc }: any) => desc(s.effectiveFrom),
      });

      if (predecessor) {
        await tx
          .update(schema.employeeSalaryStructures)
          .set({
            effectiveTo: null,
            status: 'ACTIVE',
            updatedAt: new Date(),
          })
          .where(eq(schema.employeeSalaryStructures.id, predecessor.id));
      }
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'employee_salary',
        entityId: salaryId,
        action: 'CANCEL',
        oldValues: record as any,
        newValues: { status: 'CANCELLED', reason: dto.reason },
      })
      .catch(() => {});

    return { success: true, data: null, message: 'Salary assignment cancelled successfully' };
  }

  async getSalaryPreview(companyId: string, employeeId: string, query: SalaryPreviewQueryDto) {
    const month = query.month || new Date().toISOString().slice(0, 7);
    const policy = query.policy || 'CALENDAR_DAYS';
    const preview = await this.calculationService.previewSalaryWithAttendance(
      companyId,
      employeeId,
      month,
      policy,
    );
    return { success: true, data: preview };
  }
}
