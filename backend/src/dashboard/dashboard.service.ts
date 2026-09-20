import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql, gte } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async summary(companyId: string) {
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(and(eq(schema.employees.companyId, companyId), sql`${schema.employees.deletedAt} IS NULL`)).then((r: any) => Number(r[0].count));
    const active = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(and(eq(schema.employees.companyId, companyId), eq(schema.employees.isActive, true))).then((r: any) => Number(r[0].count));
    const today = new Date().toISOString().slice(0, 10);
    const att: any[] = await this.db.select({ status: schema.attendance.status, count: sql`count(*)` }).from(schema.attendance).where(and(eq(schema.attendance.companyId, companyId), eq(schema.attendance.attendanceDate, today))).groupBy(schema.attendance.status);
    const map: any = {}; for (const r of att) map[r.status] = Number(r.count);
    const payrollAgg: any = await this.db.select({ gross: sql`coalesce(sum(${schema.payrollRuns.grossAmount}),0)`, deductions: sql`coalesce(sum(${schema.payrollRuns.totalDeductions}),0)`, net: sql`coalesce(sum(${schema.payrollRuns.netAmount}),0)` }).from(schema.payrollRuns).where(eq(schema.payrollRuns.companyId, companyId)).then((r: any) => r[0]);
    const deptRows: any[] = await this.db.select({ dept: schema.departments.name, count: sql`count(${schema.employees.id})` }).from(schema.employees).leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id)).where(eq(schema.employees.companyId, companyId)).groupBy(schema.departments.name);
    const upcomingHolidays = await this.db.query.holidays.findMany({ where: (h: any, { eq, and, gte }: any) => and(eq(h.companyId, companyId), gte(h.holidayDate, today)), limit: 5, orderBy: (h: any, { asc }: any) => asc(h.holidayDate) });
    return {
      success: true,
      data: {
        employees: { total, active, inactive: total - active },
        attendance: { present: map.PRESENT ?? 0, absent: map.ABSENT ?? 0, late: map.LATE ?? 0, onLeave: map.ON_LEAVE ?? 0 },
        payroll: { gross: Number(payrollAgg.gross), deductions: Number(payrollAgg.deductions), net: Number(payrollAgg.net) },
        departments: deptRows,
        upcomingHolidays,
      },
    };
  }
}

