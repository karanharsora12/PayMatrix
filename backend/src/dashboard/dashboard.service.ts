import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { AttendanceService } from '../attendance/attendance.service';
import { LeaveService } from '../leave/leave.service';
import { ParametersService } from '../parameters/parameters.service';

export type DashboardPeriod = 'day' | 'week' | 'month';
export type DashboardScope = 'ORG' | 'SELF';

const ISO = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly attendanceService: AttendanceService,
    private readonly leaveService: LeaveService,
    private readonly parametersService: ParametersService,
  ) {}

  async summary(user: any, period: DashboardPeriod = 'week') {
    const companyId: string | null = user?.companyId ?? null;
    const userId: string | null = user?.sub ?? null;
    const employeeId: string | null = user?.employeeId ?? null;
    const permissions: string[] = user?.permissions ?? [];
    const isSuperAdmin = Boolean(user?.roles?.includes('SUPER_ADMIN'));
    const can = (perm: string) =>
      isSuperAdmin ||
      permissions.includes('*') ||
      permissions.includes('*:*') ||
      permissions.includes(perm);

    const errors: Record<string, string> = {};
    const section = async <T>(key: string, fn: () => Promise<T>): Promise<T | null> => {
      try {
        return await fn();
      } catch (e: any) {
        errors[key] = e?.message ?? 'Unexpected error';
        // eslint-disable-next-line no-console
        console.error(`[dashboard] section "${key}" failed:`, e?.message);
        return null;
      }
    };

    const today = ISO(new Date());
    const range = this.resolveRange(period, today);

    let canManageAttendance = false;
    let canManageLeave = false;
    if (companyId && userId) {
      canManageAttendance =
        (await this.parametersService
          .getUserParameterValue(companyId, userId, 'CanManageAttendance', employeeId)
          .catch(() => false)) === true;
      canManageLeave =
        (await this.parametersService
          .getUserParameterValue(companyId, userId, 'CanManageLeave', employeeId)
          .catch(() => false)) === true;
    }

    const employeesVisible = Boolean(companyId) && can('employees.view');
    const attendanceScope = this.resolveScope(
      companyId,
      employeeId,
      can('attendance.view'),
      canManageAttendance,
    );
    const leaveScope = this.resolveScope(
      companyId,
      employeeId,
      can('leave.view'),
      canManageLeave,
    );
    const payrollScope: DashboardScope | null = !companyId
      ? null
      : can('payroll.view')
        ? 'ORG'
        : can('payslip.view') && employeeId
          ? 'SELF'
          : null;
    const documentsScope: DashboardScope | null = !companyId
      ? null
      : can('documents.view')
        ? 'ORG'
        : employeeId
          ? 'SELF'
          : null;
    const activityVisible =
      Boolean(companyId) &&
      (can('employees.view') || can('users.view') || can('settings.view'));

    const access = {
      employees: employeesVisible,
      attendance: Boolean(attendanceScope),
      attendanceScope,
      leave: Boolean(leaveScope),
      leaveScope,
      payroll: Boolean(payrollScope),
      payrollScope,
      documents: Boolean(documentsScope),
      documentsScope,
      activity: activityVisible,
      events: Boolean(companyId),
      canManageAttendance,
      canManageLeave,
    };

    const company = await section('company', () => this.getCompany(companyId));
    const employees = employeesVisible
      ? await section('employees', () => this.employeesSection(companyId!))
      : null;
    const attendance = attendanceScope
      ? await section('attendance', () =>
          this.attendanceSection(companyId!, attendanceScope, employeeId, range),
        )
      : null;
    const leave = leaveScope
      ? await section('leave', () =>
          this.leaveSection(companyId!, leaveScope, employeeId, range),
        )
      : null;
    const payroll = payrollScope
      ? await section('payroll', () =>
          this.payrollSection(companyId!, payrollScope, employeeId),
        )
      : null;
    const documents = documentsScope
      ? await section('documents', () =>
          this.documentsSection(companyId!, documentsScope, employeeId),
        )
      : null;
    const activity = activityVisible
      ? await section('activity', () => this.activitySection(companyId!))
      : null;
    const events = await section('events', () =>
      this.eventsSection(companyId!, employeeId, employeesVisible, today),
    );
    const self = employeeId
      ? await section('self', () => this.selfSection(companyId!, employeeId, today))
      : null;

    return {
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        period,
        range,
        company,
        access,
        employees,
        attendance,
        leave,
        payroll,
        documents,
        activity,
        events,
        self,
        errors,
      },
    };
  }

  private resolveRange(period: DashboardPeriod, today: string) {
    const end = new Date(`${today}T00:00:00Z`);
    let start: Date;
    if (period === 'month') {
      start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
    } else if (period === 'day') {
      start = new Date(end);
    } else {
      start = new Date(end.getTime() - 6 * 86400000);
    }
    return { from: ISO(start), to: today };
  }

  private resolveScope(
    companyId: string | null,
    employeeId: string | null,
    canView: boolean,
    canManage: boolean,
  ): DashboardScope | null {
    if (!companyId || !canView) return null;
    if (canManage) return 'ORG';
    return employeeId ? 'SELF' : 'ORG';
  }

  private async getCompany(companyId: string) {
    const row = await this.db.query.companies.findFirst({
      where: (c: any, { eq }: any) => eq(c.id, companyId),
      columns: { id: true, name: true, currency: true, timezone: true },
    });
    return row ?? null;
  }

  private async employeesSection(companyId: string) {
    const monthStart = `${new Date().toISOString().slice(0, 7)}-01`;

    const [stats] = await this.db
      .select({
        total: sql<number>`count(*) filter (where ${schema.employees.deletedAt} is null)`,
        active: sql<number>`count(*) filter (where ${schema.employees.isActive} = true and ${schema.employees.deletedAt} is null)`,
        joinedThisMonth: sql<number>`count(*) filter (where ${schema.employees.joiningDate} >= ${monthStart} and ${schema.employees.deletedAt} is null)`,
      })
      .from(schema.employees)
      .where(eq(schema.employees.companyId, companyId));

    const baseConditions = and(
      eq(schema.employees.companyId, companyId),
      isNull(schema.employees.deletedAt),
    );

    const groupBy = async (dimension: 'department' | 'designation' | 'employmentType') => {
      let query: any;
      if (dimension === 'department') {
        query = this.db
          .select({
            name: sql<string>`coalesce(${schema.departments.name}, 'Unassigned')`,
            count: sql<number>`count(*)`,
          })
          .from(schema.employees)
          .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id));
      } else if (dimension === 'designation') {
        query = this.db
          .select({
            name: sql<string>`coalesce(${schema.designations.name}, 'Unassigned')`,
            count: sql<number>`count(*)`,
          })
          .from(schema.employees)
          .leftJoin(schema.designations, eq(schema.employees.designationId, schema.designations.id));
      } else {
        query = this.db
          .select({
            name: sql<string>`coalesce(${schema.employmentTypes.name}, 'Unassigned')`,
            count: sql<number>`count(*)`,
          })
          .from(schema.employees)
          .leftJoin(
            schema.employmentTypes,
            eq(schema.employees.employmentTypeId, schema.employmentTypes.id),
          );
      }
      const rows = await query
        .where(baseConditions)
        .groupBy(sql`1`)
        .orderBy(desc(sql`count(*)`));
      return rows.map((r: any) => ({ name: r.name, count: Number(r.count) }));
    };

    const [departments, designations, employmentTypes] = await Promise.all([
      groupBy('department'),
      groupBy('designation'),
      groupBy('employmentType'),
    ]);

    const total = Number(stats?.total ?? 0);
    const active = Number(stats?.active ?? 0);

    return {
      total,
      active,
      inactive: Math.max(0, total - active),
      joinedThisMonth: Number(stats?.joinedThisMonth ?? 0),
      distribution: { departments, designations, employmentTypes },
    };
  }

  private async attendanceSection(
    companyId: string,
    scope: DashboardScope,
    employeeId: string | null,
    range: { from: string; to: string },
  ) {
    const scopedEmployeeId = scope === 'SELF' ? employeeId! : undefined;
    const today = range.to;

    const [kpiRes, series, rowsResult] = await Promise.all([
      this.attendanceService.summary(companyId, {
        date: today,
        employeeId: scopedEmployeeId,
      }),
      this.attendanceService.statusSeries(companyId, {
        fromDate: range.from,
        toDate: range.to,
        employeeId: scopedEmployeeId,
      }),
      this.todayAttendanceRows(companyId, scopedEmployeeId, today, scope === 'ORG' ? 25 : 5),
    ]);

    const kpi = (kpiRes as any)?.data ?? {};
    const present = Number(kpi.present ?? 0);
    const late = Number(kpi.late ?? 0);
    const halfDay = Number(kpi.halfDay ?? 0);
    const presentToday = present + late + halfDay;
    const totalEmployees = Number(kpi.totalEmployees ?? 0);

    const byDate = new Map<string, Record<string, number>>();
    for (const point of series) {
      const key = String(point.date).slice(0, 10);
      if (!byDate.has(key)) {
        byDate.set(key, {
          present: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          absent: 0,
          holiday: 0,
          weekOff: 0,
          records: 0,
        });
      }
      const bucket = byDate.get(key)!;
      const count = Number(point.count);
      bucket.records += count;
      if (point.status === 'PRESENT') bucket.present += count;
      else if (point.status === 'LATE') bucket.late += count;
      else if (point.status === 'HALF_DAY') bucket.halfDay += count;
      else if (point.status === 'ON_LEAVE') bucket.onLeave += count;
      else if (point.status === 'ABSENT') bucket.absent += count;
      else if (point.status === 'HOLIDAY') bucket.holiday += count;
      else if (point.status === 'WEEK_OFF') bucket.weekOff += count;
    }

    const seriesPoints: any[] = [];
    let cursor = new Date(`${range.from}T00:00:00Z`);
    const end = new Date(`${range.to}T00:00:00Z`);
    while (cursor.getTime() <= end.getTime()) {
      const key = ISO(cursor);
      const bucket = byDate.get(key) ?? {
        present: 0,
        late: 0,
        halfDay: 0,
        onLeave: 0,
        absent: 0,
        holiday: 0,
        weekOff: 0,
        records: 0,
      };
      seriesPoints.push({
        date: key,
        present: bucket.present,
        late: bucket.late,
        halfDay: bucket.halfDay,
        onLeave: bucket.onLeave,
        absent: bucket.absent,
        holiday: bucket.holiday,
        weekOff: bucket.weekOff,
        records: bucket.records,
        presentTotal: bucket.present + bucket.late + bucket.halfDay,
      });
      cursor = new Date(cursor.getTime() + 86400000);
    }

    return {
      scope,
      today: {
        date: range.to,
        totalEmployees,
        present: presentToday,
        presentOnly: present,
        late,
        halfDay,
        onLeave: Number(kpi.onLeave ?? 0),
        absent: Number(kpi.absent ?? 0),
        holiday: Number(kpi.holiday ?? 0),
        attendanceRate:
          totalEmployees > 0
            ? Math.round((presentToday / totalEmployees) * 1000) / 10
            : 0,
        overtimeMinutes: Number(kpi.overtimeMinutes ?? 0),
      },
      series: seriesPoints,
      todayRows: rowsResult.rows,
      todayRowsTotal: rowsResult.total,
    };
  }

  private async todayAttendanceRows(
    companyId: string,
    employeeId: string | undefined,
    today: string,
    limit: number,
  ) {
    const conditions = [
      eq(schema.attendance.companyId, companyId),
      eq(schema.attendance.attendanceDate, today as any),
    ];
    if (employeeId) conditions.push(eq(schema.attendance.employeeId, employeeId));
    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.attendance)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db
      .select({
        id: schema.attendance.id,
        employeeId: schema.attendance.employeeId,
        checkIn: schema.attendance.checkIn,
        checkOut: schema.attendance.checkOut,
        status: schema.attendance.status,
        breakMinutes: schema.attendance.breakMinutes,
        overtimeMinutes: schema.attendance.overtimeMinutes,
        remarks: schema.attendance.remarks,
        employeeCode: schema.employees.employeeCode,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        departmentName: schema.departments.name,
        designationName: schema.designations.name,
      })
      .from(schema.attendance)
      .innerJoin(schema.employees, eq(schema.attendance.employeeId, schema.employees.id))
      .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
      .leftJoin(schema.designations, eq(schema.employees.designationId, schema.designations.id))
      .where(where)
      .orderBy(asc(schema.employees.firstName), asc(schema.employees.lastName))
      .limit(limit);

    const shifts = await this.resolveShifts(
      rows.map((r: any) => r.employeeId),
      today,
    );

    return {
      total,
      rows: rows.map((r: any) => {
        const shift = shifts.get(r.employeeId);
        return {
          id: r.id,
          employeeId: r.employeeId,
          employeeCode: r.employeeCode,
          employeeName: `${r.firstName} ${r.lastName}`.trim(),
          department: r.departmentName ?? null,
          designation: r.designationName ?? null,
          status: r.status,
          checkIn: r.checkIn ? new Date(r.checkIn).toISOString() : null,
          checkOut: r.checkOut ? new Date(r.checkOut).toISOString() : null,
          overtimeMinutes: Number(r.overtimeMinutes ?? 0),
          remarks: r.remarks ?? null,
          shift: shift ?? null,
        };
      }),
    };
  }

  private async resolveShifts(employeeIds: string[], date: string) {
    const map = new Map<string, any>();
    if (!employeeIds.length) return map;

    const rows = await this.db
      .select({
        employeeId: schema.employeeShiftAssignments.employeeId,
        effectiveFrom: schema.employeeShiftAssignments.effectiveFrom,
        name: schema.shifts.name,
        code: schema.shifts.code,
        startTime: schema.shifts.startTime,
        endTime: schema.shifts.endTime,
        isNightShift: schema.shifts.isNightShift,
      })
      .from(schema.employeeShiftAssignments)
      .innerJoin(
        schema.shifts,
        eq(schema.employeeShiftAssignments.shiftId, schema.shifts.id),
      )
      .where(
        and(
          inArray(schema.employeeShiftAssignments.employeeId, employeeIds),
          lte(schema.employeeShiftAssignments.effectiveFrom, date as any),
          or(
            isNull(schema.employeeShiftAssignments.effectiveTo),
            gte(schema.employeeShiftAssignments.effectiveTo, date as any),
          ) as any,
        ),
      )
      .orderBy(desc(schema.employeeShiftAssignments.effectiveFrom));

    for (const row of rows) {
      if (!map.has(row.employeeId)) {
        map.set(row.employeeId, {
          name: row.name,
          code: row.code,
          startTime: row.startTime,
          endTime: row.endTime,
          isNightShift: Boolean(row.isNightShift),
          effectiveFrom: String(row.effectiveFrom).slice(0, 10),
        });
      }
    }
    return map;
  }

  private async leaveSection(
    companyId: string,
    scope: DashboardScope,
    employeeId: string | null,
    range: { from: string; to: string },
  ) {
    const summary = await this.leaveService.summary(companyId, {
      fromDate: range.from,
      toDate: range.to,
      employeeId: scope === 'SELF' ? employeeId! : undefined,
    });

    return {
      scope,
      period: summary.period,
      byType: summary.byType,
      onLeaveToday: summary.onLeaveToday,
    };
  }

  private async payrollSection(
    companyId: string,
    scope: DashboardScope,
    employeeId: string | null,
  ) {
    if (scope === 'SELF') {
      return this.selfPayrollSection(employeeId!);
    }

    const twelveMonthsAgo = new Date(Date.now() - 365 * 86400000)
      .toISOString()
      .slice(0, 10);

    const monthly = await this.db
      .select({
        month: sql<string>`to_char(${schema.payrollRuns.periodStart}, 'YYYY-MM')`,
        gross: sql<string>`coalesce(sum(${schema.payrollRuns.grossAmount}), 0)`,
        deductions: sql<string>`coalesce(sum(${schema.payrollRuns.totalDeductions}), 0)`,
        net: sql<string>`coalesce(sum(${schema.payrollRuns.netAmount}), 0)`,
        runs: sql<number>`count(*)`,
        employees: sql<number>`coalesce(max(${schema.payrollRuns.employeeCount}), 0)`,
      })
      .from(schema.payrollRuns)
      .where(
        and(
          eq(schema.payrollRuns.companyId, companyId),
          gte(schema.payrollRuns.periodStart, twelveMonthsAgo as any),
          ne(schema.payrollRuns.status, 'CANCELLED'),
        ),
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    const current = await this.db.query.payrollRuns.findFirst({
      where: (p: any, { eq }: any) => eq(p.companyId, companyId),
      orderBy: (p: any, { desc }: any) => desc(p.periodStart),
    });

    const [payslipStats] = await this.db
      .select({
        total: sql<number>`count(*)`,
        currentPeriod: sql<number>`count(*) filter (where ${schema.payslips.periodYear} = ${new Date().getUTCFullYear()} and ${schema.payslips.periodMonth} = ${new Date().getUTCMonth() + 1})`,
      })
      .from(schema.payslips)
      .innerJoin(
        schema.payrollRuns,
        eq(schema.payslips.payrollRunId, schema.payrollRuns.id),
      )
      .where(eq(schema.payrollRuns.companyId, companyId));

    return {
      scope,
      monthly: monthly.map((m: any) => ({
        month: m.month,
        gross: Number(m.gross),
        deductions: Number(m.deductions),
        net: Number(m.net),
        runs: Number(m.runs),
        employees: Number(m.employees),
      })),
      current: current
        ? {
            id: current.id,
            month: this.runMonthLabel(current),
            status: current.status,
            gross: Number(current.grossAmount ?? 0),
            deductions: Number(current.totalDeductions ?? 0),
            net: Number(current.netAmount ?? 0),
            employeeCount: Number(current.employeeCount ?? 0),
            finalizedAt: current.finalizedAt ?? null,
            payDate: current.payDate ?? null,
          }
        : null,
      payslips: {
        total: Number(payslipStats?.total ?? 0),
        currentPeriod: Number(payslipStats?.currentPeriod ?? 0),
      },
    };
  }

  private async selfPayrollSection(employeeId: string) {
    const monthly = await this.db
      .select({
        month: sql<string>`to_char(make_date(${schema.payslips.periodYear}, ${schema.payslips.periodMonth}, 1), 'YYYY-MM')`,
        gross: sql<string>`coalesce(sum(${schema.payslips.grossSalary}), 0)`,
        deductions: sql<string>`coalesce(sum(${schema.payslips.totalDeductions}), 0)`,
        net: sql<string>`coalesce(sum(${schema.payslips.netSalary}), 0)`,
        runs: sql<number>`count(*)`,
      })
      .from(schema.payslips)
      .where(
        and(
          eq(schema.payslips.employeeId, employeeId),
          isNotNull(schema.payslips.periodYear),
          isNotNull(schema.payslips.periodMonth),
        ),
      )
      .groupBy(sql`1`)
      .orderBy(desc(sql`1`))
      .limit(12);

    const latest = await this.db.query.payslips.findFirst({
      where: (p: any, { eq }: any) => eq(p.employeeId, employeeId),
      orderBy: (p: any, { desc }: any) => desc(p.generatedAt),
    });

    return {
      scope: 'SELF' as const,
      monthly: monthly
        .map((m: any) => ({
          month: m.month,
          gross: Number(m.gross),
          deductions: Number(m.deductions),
          net: Number(m.net),
          runs: Number(m.runs),
        }))
        .reverse(),
      current: latest
        ? {
            id: latest.id,
            month:
              latest.periodYear && latest.periodMonth
                ? `${latest.periodYear}-${String(latest.periodMonth).padStart(2, '0')}`
                : null,
            status: latest.status,
            gross: Number(latest.grossSalary ?? 0),
            deductions: Number(latest.totalDeductions ?? 0),
            net: Number(latest.netSalary ?? 0),
            employeeCount: 1,
            finalizedAt: latest.generatedAt ?? null,
            payDate: null,
          }
        : null,
      payslips: {
        total: monthly.reduce((sum: number, m: any) => sum + Number(m.runs ?? 0), 0),
        currentPeriod: 0,
      },
    };
  }

  private runMonthLabel(run: any) {
    if (run.periodYear && run.periodMonth) {
      return `${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}`;
    }
    return String(run.periodStart ?? '').slice(0, 7);
  }

  private async documentsSection(
    companyId: string,
    scope: DashboardScope,
    employeeId: string | null,
  ) {
    const conditions = [
      isNull(schema.employeeDocumentAssignments.deletedAt),
      eq(schema.employees.companyId, companyId),
    ];
    if (scope === 'SELF') {
      conditions.push(eq(schema.employeeDocumentAssignments.employeeId, employeeId!));
    }

    const rows = await this.db
      .select({
        status: schema.employeeDocumentAssignments.status,
        count: sql<number>`count(*)`,
      })
      .from(schema.employeeDocumentAssignments)
      .innerJoin(
        schema.employees,
        eq(schema.employeeDocumentAssignments.employeeId, schema.employees.id),
      )
      .where(and(...conditions))
      .groupBy(schema.employeeDocumentAssignments.status);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const r of rows) {
      const count = Number(r.count);
      byStatus[r.status] = count;
      total += count;
    }

    return {
      scope,
      total,
      byStatus,
      pending: byStatus['PENDING'] ?? 0,
      completed: byStatus['COMPLETED'] ?? 0,
      acknowledged: byStatus['ACKNOWLEDGED'] ?? 0,
      available: (byStatus['AVAILABLE'] ?? 0) + (byStatus['GENERATED'] ?? 0),
    };
  }

  private async activitySection(companyId: string) {
    const rows = await this.db.query.auditLogs.findMany({
      where: (a: any, { and, eq, ne }: any) =>
        and(eq(a.companyId, companyId), ne(a.module, 'auth')),
      limit: 8,
      orderBy: (a: any, { desc }: any) => desc(a.createdAt),
      with: { user: true },
    });

    return rows.map((row: any) => ({
      id: row.id,
      module: row.module,
      entityType: row.entityType,
      action: row.action,
      entityId: row.entityId,
      createdAt: row.createdAt,
      actor: row.user?.email ?? null,
    }));
  }

  private async eventsSection(
    companyId: string,
    employeeId: string | null,
    orgEventsVisible: boolean,
    today: string,
  ) {
    const windowDays = 30;
    const windowKeys = new Map<string, string>();
    const base = new Date(`${today}T00:00:00Z`);
    for (let i = 0; i <= windowDays; i++) {
      const d = new Date(base.getTime() + i * 86400000);
      windowKeys.set(ISO(d).slice(5), ISO(d));
    }

    const monthCandidates = [
      Number(today.slice(5, 7)),
      Number(new Date(base.getTime() + windowDays * 86400000).toISOString().slice(5, 7)),
    ];

    const holidays = await this.db.query.holidays.findMany({
      where: (h: any, { and, eq, gte }: any) =>
        and(
          eq(h.companyId, companyId),
          eq(h.isActive, true),
          gte(h.holidayDate, today as any),
        ),
      orderBy: (h: any, { asc }: any) => asc(h.holidayDate),
      limit: 5,
    });

    const birthdays: any[] = [];
    const anniversaries: any[] = [];

    const monthFilter = (column: any) =>
      sql`extract(month from ${column}) in (${monthCandidates[0]}, ${monthCandidates[1]})`;

    const employeeRows = await this.db
      .select({
        id: schema.employees.id,
        firstName: schema.employees.firstName,
        lastName: schema.employees.lastName,
        dateOfBirth: schema.employees.dateOfBirth,
        joiningDate: schema.employees.joiningDate,
      })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.companyId, companyId),
          eq(schema.employees.isActive, true),
          isNull(schema.employees.deletedAt),
          or(
            monthFilter(schema.employees.dateOfBirth),
            monthFilter(schema.employees.joiningDate),
          ) as any,
        ),
      )
      .limit(500);

    const currentYear = Number(today.slice(0, 4));
    for (const row of employeeRows) {
      const name = `${row.firstName} ${row.lastName}`.trim();
      const isSelf = employeeId ? row.id === employeeId : false;
      if (!orgEventsVisible && !isSelf) continue;

      const dobKey = String(row.dateOfBirth ?? '').slice(5);
      const birthDate = windowKeys.get(dobKey);
      if (birthDate && birthdays.length < 8) {
        birthdays.push({
          employeeId: row.id,
          name,
          date: birthDate,
          turning: currentYear - Number(String(row.dateOfBirth).slice(0, 4)),
        });
      }

      const joinKey = String(row.joiningDate ?? '').slice(5);
      const anniversaryDate = windowKeys.get(joinKey);
      if (anniversaryDate && anniversaries.length < 8) {
        const joinYear = Number(String(row.joiningDate).slice(0, 4));
        anniversaries.push({
          employeeId: row.id,
          name,
          date: anniversaryDate,
          years: Math.max(1, currentYear - joinYear),
        });
      }
    }

    birthdays.sort((a: any, b: any) => a.date.localeCompare(b.date));
    anniversaries.sort((a: any, b: any) => a.date.localeCompare(b.date));

    return {
      holidays: holidays.map((h: any) => ({
        id: h.id,
        name: h.name,
        date: String(h.holidayDate).slice(0, 10),
        type: h.holidayType,
      })),
      birthdays,
      anniversaries,
    };
  }

  private async selfSection(companyId: string, employeeId: string, today: string) {
    const employee = await this.db.query.employees.findFirst({
      where: (e: any, { and, eq }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
      with: { department: true, designation: true, branch: true },
    });
    if (!employee) return null;

    const shifts = await this.resolveShifts([employeeId], today);
    const attendance = await this.db.query.attendance.findFirst({
      where: (a: any, { and, eq }: any) =>
        and(eq(a.employeeId, employeeId), eq(a.attendanceDate, today as any)),
    });

    return {
      employeeId,
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      employeeCode: employee.employeeCode,
      department: employee.department?.name ?? null,
      designation: employee.designation?.name ?? null,
      branch: employee.branch?.name ?? null,
      shift: shifts.get(employeeId) ?? null,
      todayAttendance: attendance
        ? {
            status: attendance.status,
            checkIn: attendance.checkIn ? new Date(attendance.checkIn).toISOString() : null,
            checkOut: attendance.checkOut ? new Date(attendance.checkOut).toISOString() : null,
          }
        : null,
    };
  }
}
