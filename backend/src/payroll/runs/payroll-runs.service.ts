import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { paginated } from '../../common/dto/pagination.dto';
import { PayrollCalculationService } from '../calculation/payroll-calculation.service';
import {
  ApprovePayrollRunDto,
  CreatePayrollRunDto,
  PayrollRunFilterDto,
} from './dto/payroll-run.dto';

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['CALCULATING', 'CALCULATED', 'CANCELLED'],
  CALCULATING: ['CALCULATED', 'DRAFT', 'CANCELLED'],
  CALCULATED: ['PENDING_APPROVAL', 'CALCULATING', 'DRAFT', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'CALCULATED', 'CANCELLED'],
  APPROVED: ['FINALIZED', 'CANCELLED'],
  FINALIZED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

@Injectable()
export class PayrollRunsService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private calculationService: PayrollCalculationService,
  ) {}

  private assertTransition(from: string, to: string) {
    if (!VALID_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException({
        code: 'PAYROLL_INVALID_STATUS_TRANSITION',
        message: `Invalid payroll transition from ${from} to ${to}.`,
      });
    }
  }

  async list(companyId: string, filter: PayrollRunFilterDto) {
    const conditions: any[] = [eq(schema.payrollRuns.companyId, companyId)];

    if (filter.year) {
      conditions.push(eq(schema.payrollRuns.periodYear, filter.year));
    }
    if (filter.month) {
      conditions.push(eq(schema.payrollRuns.periodMonth, filter.month));
    }
    if (filter.status) {
      conditions.push(eq(schema.payrollRuns.status, filter.status as any));
    }

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.payrollRuns)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.payrollRuns.findMany({
      where,
      limit: filter.limit,
      offset: filter.offset,
      orderBy: (p: any, { desc }: any) => [desc(p.periodYear), desc(p.periodMonth), desc(p.createdAt)],
    });

    return paginated(rows, total, filter, 'Payroll runs retrieved successfully');
  }

  async get(companyId: string, id: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
      with: {
        approvals: {
          orderBy: (a: any, { desc }: any) => [desc(a.createdAt)],
        },
      },
    });

    if (!run) {
      throw new NotFoundException({
        code: 'PAYROLL_RUN_NOT_FOUND',
        message: 'Payroll run not found',
      });
    }

    return {
      success: true,
      data: run,
    };
  }

  async create(companyId: string, dto: CreatePayrollRunDto, userId: string) {
    const { year, month, payDate } = dto;

    // Check duplicate active period (status != 'CANCELLED')
    const existing: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.companyId, companyId),
        eq(schema.payrollRuns.periodYear, year),
        eq(schema.payrollRuns.periodMonth, month),
        sql`${schema.payrollRuns.status} != 'CANCELLED'`,
      ),
    });

    if (existing) {
      throw new ConflictException({
        code: 'PAYROLL_PERIOD_EXISTS',
        message: `An active payroll run already exists for ${year}-${String(month).padStart(2, '0')}.`,
      });
    }

    const totalDays = new Date(year, month, 0).getDate();
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;
    const code = `RUN-${year}-${String(month).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;

    const [row] = await this.db
      .insert(schema.payrollRuns)
      .values({
        companyId,
        payrollCode: code,
        runNumber: code,
        periodYear: year,
        periodMonth: month,
        periodStart,
        periodEnd,
        payDate: payDate || null,
        status: 'DRAFT',
        preparedBy: userId,
        createdBy: userId,
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_run',
        entityId: row.id,
        action: 'CREATE',
        newValues: {
          year,
          month,
          periodStart,
          periodEnd,
          runNumber: code,
        } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: `Payroll run created for ${year}-${String(month).padStart(2, '0')}`,
    };
  }

  async calculate(
    companyId: string,
    id: string,
    userId: string,
    policy?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY',
  ) {
    const res = await this.calculationService.calculatePayrollRun(companyId, id, {
      policy,
      userId,
    });

    return {
      success: true,
      data: res,
      message: `Payroll calculated successfully (${res.processedCount} processed, ${res.exceptionCount} exceptions)`,
    };
  }

  async getSummary(companyId: string, id: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) {
      throw new NotFoundException({
        code: 'PAYROLL_RUN_NOT_FOUND',
        message: 'Payroll run not found',
      });
    }

    // Load employee snapshots for department aggregation
    const employees: any[] = await this.db.query.payrollEmployees.findMany({
      where: eq(schema.payrollEmployees.payrollRunId, id),
    });

    const deptMap = new Map<string, { employeeCount: number; gross: number; deductions: number; net: number }>();

    for (const emp of employees) {
      const dName = emp.departmentName || 'General';
      if (!deptMap.has(dName)) {
        deptMap.set(dName, { employeeCount: 0, gross: 0, deductions: 0, net: 0 });
      }
      const item = deptMap.get(dName)!;
      item.employeeCount++;
      item.gross += Number(emp.grossSalary || emp.grossEarnings || 0);
      item.deductions += Number(emp.totalDeductions || 0);
      item.net += Number(emp.netSalary || 0);
    }

    const departmentSummary = Array.from(deptMap.entries()).map(([departmentName, stats]) => ({
      departmentName,
      employeeCount: stats.employeeCount,
      gross: Math.round(stats.gross * 100) / 100,
      deductions: Math.round(stats.deductions * 100) / 100,
      net: Math.round(stats.net * 100) / 100,
    }));

    return {
      success: true,
      data: {
        runId: run.id,
        runNumber: run.runNumber || run.payrollCode,
        status: run.status,
        periodYear: run.periodYear,
        periodMonth: run.periodMonth,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        employeeCount: run.employeeCount,
        totalGross: Number(run.totalGross || run.grossAmount || 0),
        totalDeductions: Number(run.totalDeductions || 0),
        totalEmployerContributions: Number(run.totalEmployerContributions || 0),
        totalNet: Number(run.totalNet || run.netAmount || 0),
        totalCtc: Number(run.totalCtc || 0),
        calculatedAt: run.calculatedAt,
        approvedAt: run.approvedAt,
        finalizedAt: run.finalizedAt,
        departmentSummary,
      },
    };
  }

  async submit(companyId: string, id: string, userId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');
    this.assertTransition(run.status, 'PENDING_APPROVAL');

    if (run.employeeCount === 0) {
      throw new BadRequestException({
        code: 'PAYROLL_EMPTY',
        message: 'Cannot submit a payroll run with 0 calculated employees.',
      });
    }

    const [updated] = await this.db
      .update(schema.payrollRuns)
      .set({
        status: 'PENDING_APPROVAL',
        updatedAt: new Date(),
      })
      .where(eq(schema.payrollRuns.id, id))
      .returning();

    // Record in approval table
    await this.db.insert(schema.payrollApprovals).values({
      payrollRunId: id,
      action: 'SUBMITTED',
      status: 'PENDING',
      approverId: userId,
      performedBy: userId,
      performedAt: new Date(),
      remarks: 'Submitted for approval',
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_run',
        entityId: id,
        action: 'SUBMIT',
        newValues: { status: 'PENDING_APPROVAL' } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: updated,
      message: 'Payroll run submitted for approval',
    };
  }

  async approve(companyId: string, id: string, approverId: string, dto?: ApprovePayrollRunDto) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');
    this.assertTransition(run.status, 'APPROVED');

    const [updated] = await this.db
      .update(schema.payrollRuns)
      .set({
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.payrollRuns.id, id))
      .returning();

    const [approval] = await this.db
      .insert(schema.payrollApprovals)
      .values({
        payrollRunId: id,
        action: 'APPROVED',
        status: 'APPROVED',
        approverId,
        performedBy: approverId,
        performedAt: new Date(),
        approvedAt: new Date(),
        comments: dto?.comments || null,
        remarks: dto?.comments || 'Payroll approved',
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId: approverId,
        module: 'payroll',
        entityType: 'payroll_run',
        entityId: id,
        action: 'APPROVE',
        newValues: { status: 'APPROVED', comments: dto?.comments } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: { run: updated, approval },
      message: 'Payroll run approved',
    };
  }

  async finalize(companyId: string, id: string, userId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');
    this.assertTransition(run.status, 'FINALIZED');

    // Load all snapshot employees in deterministic order
    const employees: any[] = await this.db.query.payrollEmployees.findMany({
      where: eq(schema.payrollEmployees.payrollRunId, id),
      orderBy: (pe: any, { asc }: any) => [asc(pe.employeeCode), asc(pe.id)],
    });

    const year = run.periodYear;
    const monthStr = String(run.periodMonth).padStart(2, '0');

    await this.db.transaction(async (tx: any) => {
      let counter = 1;
      for (const pe of employees) {
        const payslipNumber = `PAY-${year}-${monthStr}-${String(counter).padStart(5, '0')}`;
        counter++;

        // Upsert payslip
        const existingPs = await tx.query.payslips.findFirst({
          where: eq(schema.payslips.payrollEmployeeId, pe.id),
        });

        if (!existingPs) {
          await tx.insert(schema.payslips).values({
            payrollEmployeeId: pe.id,
            payrollRunId: id,
            employeeId: pe.employeeId,
            payslipNumber,
            periodYear: year,
            periodMonth: run.periodMonth,
            grossSalary: pe.grossSalary || pe.grossEarnings,
            totalDeductions: pe.totalDeductions,
            netSalary: pe.netSalary,
            employerContributions: pe.employerContributions,
            totalCtc: pe.totalCtc,
            status: 'GENERATED',
            generatedAt: new Date(),
          });
        }

        // Freeze employee status to APPROVED
        await tx
          .update(schema.payrollEmployees)
          .set({ status: 'APPROVED', updatedAt: new Date() })
          .where(eq(schema.payrollEmployees.id, pe.id));
      }

      // Lock run to FINALIZED
      await tx
        .update(schema.payrollRuns)
        .set({
          status: 'FINALIZED',
          finalizedBy: userId,
          finalizedAt: new Date(),
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.payrollRuns.id, id));

      await tx.insert(schema.payrollApprovals).values({
        payrollRunId: id,
        action: 'FINALIZED',
        status: 'APPROVED',
        approverId: userId,
        performedBy: userId,
        performedAt: new Date(),
        approvedAt: new Date(),
        remarks: `Payroll finalized and ${employees.length} payslips generated`,
      });
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_run',
        entityId: id,
        action: 'FINALIZE',
        newValues: { status: 'FINALIZED', payslipsGenerated: employees.length } as any,
      })
      .catch(() => {});

    const updated = await this.db.query.payrollRuns.findFirst({
      where: eq(schema.payrollRuns.id, id),
    });

    return {
      success: true,
      data: updated,
      message: `Payroll finalized and ${employees.length} payslips generated successfully`,
    };
  }

  async cancel(companyId: string, id: string, userId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, id),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');
    this.assertTransition(run.status, 'CANCELLED');

    if (['FINALIZED', 'PAID'].includes(run.status)) {
      throw new BadRequestException({
        code: 'PAYROLL_LOCKED',
        message: 'Cannot cancel a finalized or paid payroll run.',
      });
    }

    const [updated] = await this.db
      .update(schema.payrollRuns)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(schema.payrollRuns.id, id))
      .returning();

    await this.db.insert(schema.payrollApprovals).values({
      payrollRunId: id,
      action: 'CANCELLED',
      status: 'REJECTED',
      approverId: userId,
      performedBy: userId,
      performedAt: new Date(),
      remarks: 'Payroll run cancelled',
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'payroll',
        entityType: 'payroll_run',
        entityId: id,
        action: 'CANCEL',
        newValues: { status: 'CANCELLED' } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: updated,
      message: 'Payroll run cancelled',
    };
  }

  async getEmployees(companyId: string, runId: string, query: any) {
    const run = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, runId),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');

    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(schema.payrollEmployees.payrollRunId, runId)];

    if (query.department) {
      conditions.push(eq(schema.payrollEmployees.departmentName, query.department));
    }
    if (query.status) {
      conditions.push(eq(schema.payrollEmployees.status, query.status as any));
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(schema.payrollEmployees.employeeName, `%${query.search}%`),
          ilike(schema.payrollEmployees.employeeCode, `%${query.search}%`),
        ),
      );
    }

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.payrollEmployees)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.payrollEmployees.findMany({
      where,
      limit,
      offset,
      orderBy: (pe: any, { asc }: any) => [asc(pe.employeeName), asc(pe.employeeCode)],
      with: {
        components: true,
        adjustments: true,
        payslip: true,
      },
    });

    return paginated(rows, total, { page, pageSize: limit, offset } as any, 'Payroll employees retrieved successfully');
  }

  async getEmployee(companyId: string, runId: string, employeeId: string) {
    const pe = await this.db.query.payrollEmployees.findFirst({
      where: and(
        eq(schema.payrollEmployees.payrollRunId, runId),
        eq(schema.payrollEmployees.employeeId, employeeId),
      ),
      with: {
        components: {
          with: {
            salaryComponent: true,
          },
        },
        adjustments: true,
        payslip: true,
        payrollRun: true,
      },
    });

    if (!pe) {
      throw new NotFoundException({
        code: 'PAYROLL_EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in this payroll run',
      });
    }

    return {
      success: true,
      data: pe,
    };
  }

  async getEmployeeComponents(companyId: string, runId: string, employeeId: string) {
    const pe = await this.db.query.payrollEmployees.findFirst({
      where: and(
        eq(schema.payrollEmployees.payrollRunId, runId),
        eq(schema.payrollEmployees.employeeId, employeeId),
      ),
      with: {
        components: {
          with: {
            salaryComponent: true,
          },
        },
        adjustments: true,
      },
    });

    if (!pe) throw new NotFoundException('Employee not found in this payroll run');

    const earnings = pe.components.filter((c: any) => c.componentType === 'EARNING');
    const deductions = pe.components.filter((c: any) => c.componentType === 'DEDUCTION');
    const employerContributions = pe.components.filter(
      (c: any) => c.componentType === 'EMPLOYER_CONTRIBUTION',
    );
    const adjustments = pe.adjustments || [];

    return {
      success: true,
      data: {
        employee: {
          id: pe.employeeId,
          code: pe.employeeCode,
          name: pe.employeeName,
          department: pe.departmentName,
          designation: pe.designationName,
          paidDays: pe.paidDays,
          calendarDays: pe.calendarDays,
          workingDays: pe.workingDays,
        },
        earnings,
        deductions,
        employerContributions,
        adjustments,
        totals: {
          grossSalary: Number(pe.grossSalary || pe.grossEarnings),
          totalDeductions: Number(pe.totalDeductions),
          employerContributions: Number(pe.employerContributions),
          netSalary: Number(pe.netSalary),
          totalCtc: Number(pe.totalCtc),
        },
      },
    };
  }
}
