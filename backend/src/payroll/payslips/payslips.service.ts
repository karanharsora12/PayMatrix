import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { paginated } from '../../common/dto/pagination.dto';

@Injectable()
export class PayslipsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async generateForRun(companyId: string, runId: string) {
    const run: any = await this.db.query.payrollRuns.findFirst({
      where: and(
        eq(schema.payrollRuns.id, runId),
        eq(schema.payrollRuns.companyId, companyId),
      ),
    });

    if (!run) throw new NotFoundException('Payroll run not found');

    if (!['APPROVED', 'FINALIZED', 'PAID'].includes(run.status)) {
      throw new BadRequestException({
        code: 'PAYROLL_NOT_APPROVED',
        message: 'Cannot generate payslips for a payroll run that is not approved or finalized.',
      });
    }

    const employees: any[] = await this.db.query.payrollEmployees.findMany({
      where: eq(schema.payrollEmployees.payrollRunId, runId),
      orderBy: (pe: any, { asc }: any) => [asc(pe.employeeCode), asc(pe.id)],
    });

    const year = run.periodYear;
    const monthStr = String(run.periodMonth).padStart(2, '0');
    const generated: any[] = [];

    await this.db.transaction(async (tx: any) => {
      let counter = 1;
      for (const pe of employees) {
        const payslipNumber = `PAY-${year}-${monthStr}-${String(counter).padStart(5, '0')}`;
        counter++;

        const existing = await tx.query.payslips.findFirst({
          where: eq(schema.payslips.payrollEmployeeId, pe.id),
        });

        if (!existing) {
          const [ps] = await tx
            .insert(schema.payslips)
            .values({
              payrollEmployeeId: pe.id,
              payrollRunId: runId,
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
            })
            .returning();
          generated.push(ps);
        } else {
          generated.push(existing);
        }
      }
    });

    return {
      success: true,
      data: generated,
      message: `${generated.length} payslips generated successfully`,
    };
  }

  async list(companyId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(schema.payrollRuns.companyId, companyId)];

    if (query.year) {
      conditions.push(eq(schema.payslips.periodYear, Number(query.year)));
    }
    if (query.month) {
      conditions.push(eq(schema.payslips.periodMonth, Number(query.month)));
    }
    if (query.employeeId) {
      conditions.push(eq(schema.payslips.employeeId, query.employeeId));
    }

    const where = and(...conditions);

    const countQuery = this.db
      .select({ count: sql`count(*)` })
      .from(schema.payslips)
      .innerJoin(
        schema.payrollRuns,
        eq(schema.payslips.payrollRunId, schema.payrollRuns.id),
      )
      .where(where);

    const total = await countQuery.then((r: any) => Number(r[0].count));

    const rows = await this.db
      .select({
        id: schema.payslips.id,
        payslipNumber: schema.payslips.payslipNumber,
        periodYear: schema.payslips.periodYear,
        periodMonth: schema.payslips.periodMonth,
        grossSalary: schema.payslips.grossSalary,
        totalDeductions: schema.payslips.totalDeductions,
        netSalary: schema.payslips.netSalary,
        employerContributions: schema.payslips.employerContributions,
        totalCtc: schema.payslips.totalCtc,
        status: schema.payslips.status,
        generatedAt: schema.payslips.generatedAt,
        employeeId: schema.payslips.employeeId,
        payrollEmployeeId: schema.payslips.payrollEmployeeId,
        payrollRunId: schema.payslips.payrollRunId,
        employeeCode: schema.payrollEmployees.employeeCode,
        employeeName: schema.payrollEmployees.employeeName,
        departmentName: schema.payrollEmployees.departmentName,
        designationName: schema.payrollEmployees.designationName,
      })
      .from(schema.payslips)
      .innerJoin(
        schema.payrollRuns,
        eq(schema.payslips.payrollRunId, schema.payrollRuns.id),
      )
      .innerJoin(
        schema.payrollEmployees,
        eq(schema.payslips.payrollEmployeeId, schema.payrollEmployees.id),
      )
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(schema.payslips.generatedAt), desc(schema.payslips.payslipNumber));

    return paginated(rows, total, { page, pageSize: limit, offset } as any, 'Payslips retrieved successfully');
  }

  async get(companyId: string, id: string) {
    const payslip: any = await this.db.query.payslips.findFirst({
      where: eq(schema.payslips.id, id),
      with: {
        payrollRun: true,
        payrollEmployee: {
          with: {
            components: {
              with: {
                salaryComponent: true,
              },
            },
            adjustments: true,
          },
        },
        employee: {
          with: {
            company: true,
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!payslip || payslip.payrollRun?.companyId !== companyId) {
      throw new NotFoundException({
        code: 'PAYSLIP_NOT_FOUND',
        message: 'Payslip not found',
      });
    }

    const pe = payslip.payrollEmployee;
    const earnings = pe.components.filter((c: any) => c.componentType === 'EARNING');
    const deductions = pe.components.filter((c: any) => c.componentType === 'DEDUCTION');
    const employerContributions = pe.components.filter(
      (c: any) => c.componentType === 'EMPLOYER_CONTRIBUTION',
    );
    const adjustments = pe.adjustments || [];

    // Optional bank & statutory lookup
    let primaryBank: any = null;
    let statutory: any = null;
    try {
      primaryBank = await this.db.query.employeeBankAccounts.findFirst({
        where: eq(schema.employeeBankAccounts.employeeId, payslip.employeeId),
      });
      statutory = await this.db.query.employeeStatutoryDetails.findFirst({
        where: eq(schema.employeeStatutoryDetails.employeeId, payslip.employeeId),
      });
    } catch {
      // Ignore if table or record not present
    }

    return {
      success: true,
      data: {
        id: payslip.id,
        payslipNumber: payslip.payslipNumber,
        periodYear: payslip.periodYear,
        periodMonth: payslip.periodMonth,
        generatedAt: payslip.generatedAt,
        status: payslip.status,
        company: {
          id: payslip.employee?.company?.id,
          name: payslip.employee?.company?.name,
          legalName: payslip.employee?.company?.legalName,
          address: payslip.employee?.company?.address,
        },
        employee: {
          id: payslip.employeeId,
          code: pe.employeeCode || payslip.employee?.employeeCode,
          name: pe.employeeName || `${payslip.employee?.firstName} ${payslip.employee?.lastName}`,
          department: pe.departmentName || payslip.employee?.department?.name,
          designation: pe.designationName || payslip.employee?.designation?.title,
          joiningDate: payslip.employee?.joiningDate,
          bankAccount: primaryBank
            ? {
                bankName: primaryBank.bankName,
                accountNumber: primaryBank.accountNumber,
                ifscCode: primaryBank.ifscCode,
              }
            : null,
          statutory: statutory
            ? {
                panNumber: statutory.panNumber,
                uanNumber: statutory.uanNumber,
                pfNumber: statutory.pfNumber,
                esiNumber: statutory.esiNumber,
              }
            : null,
        },
        attendance: {
          calendarDays: pe.calendarDays,
          workingDays: pe.workingDays,
          presentDays: pe.presentDays,
          absentDays: pe.absentDays,
          paidLeaveDays: pe.paidLeaveDays,
          unpaidLeaveDays: pe.unpaidLeaveDays,
          holidayDays: pe.holidayDays,
          weekOffDays: pe.weekOffDays,
          paidDays: pe.paidDays,
          overtimeMinutes: pe.overtimeMinutes,
        },
        earnings,
        deductions,
        employerContributions,
        adjustments,
        totals: {
          grossSalary: Number(payslip.grossSalary),
          totalDeductions: Number(payslip.totalDeductions),
          netSalary: Number(payslip.netSalary),
          employerContributions: Number(payslip.employerContributions),
          totalCtc: Number(payslip.totalCtc),
        },
      },
    };
  }

  async getEmployeePayslips(companyId: string, employeeId: string) {
    return this.list(companyId, { employeeId, limit: 50, page: 1 });
  }
}
