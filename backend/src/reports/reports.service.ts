import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
@Injectable()
export class ReportsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async employees(companyId: string, q: any) {
    let where: any = eq(schema.employees.companyId, companyId);
    if (q.branchId) where = and(where, eq(schema.employees.branchId, q.branchId));
    if (q.departmentId) where = and(where, eq(schema.employees.departmentId, q.departmentId));
    const rows = await this.db.query.employees.findMany({ where, with: { branch: true, department: true, designation: true } });
    return { success: true, data: rows };
  }
  async attendance(companyId: string, q: any) {
    let where: any = eq(schema.attendance.companyId, companyId);
    if (q.fromDate) where = and(where, gte(schema.attendance.attendanceDate, q.fromDate));
    if (q.toDate) where = and(where, lte(schema.attendance.attendanceDate, q.toDate));
    const rows = await this.db.query.attendance.findMany({ where, with: { employee: true } });
    return { success: true, data: rows };
  }
  async leave(companyId: string, q: any) {
    let where: any = eq(schema.leaveRequests.companyId, companyId);
    if (q.fromDate) where = and(where, gte(schema.leaveRequests.fromDate, q.fromDate));
    const rows = await this.db.query.leaveRequests.findMany({ where, with: { employee: true, leaveType: true } });
    return { success: true, data: rows };
  }
  async payroll(companyId: string, q: any) {
    const where = eq(schema.payrollRuns.companyId, companyId);
    const rows = await this.db.query.payrollRuns.findMany({ where, with: { employees: { with: { employee: true } } } });
    return { success: true, data: rows };
  }
  async salary(companyId: string, q: any) {
    const rows = await this.db.query.employeeSalaryStructures.findMany({ with: { employee: true, salaryStructure: true } });
    return { success: true, data: rows.filter((r: any) => r.employee?.companyId === companyId) };
  }
  async tax(companyId: string, q: any) {
    const rows = await this.db.query.payrollComponents.findMany({ with: { salaryComponent: true } });
    const filtered = rows.filter((r: any) => r.salaryComponent?.isStatutory);
    return { success: true, data: filtered };
  }
  async bankPayment(companyId: string, payrollRunId: string) {
    const pes: any[] = await this.db.query.payrollEmployees.findMany({ where: (pe: any, { eq }: any) => eq(pe.payrollRunId, payrollRunId), with: { employee: true } });
    const data: any[] = [];
    for (const pe of pes) {
      const bank: any = await this.db.query.employeeBankAccounts.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.employeeId, pe.employeeId), eq(b.isPrimary, true)) });
      data.push({ employee: pe.employee, netSalary: pe.netSalary, bank });
    }
    return { success: true, data };
  }
}

