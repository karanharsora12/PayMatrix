import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { paginated } from '../common/dto/pagination.dto';
import {
  AttendanceFilterDto,
  AttendanceSummaryFilterDto,
  CreateAttendanceDto,
  CreateAttendancePunchDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';
import { AttendanceCalculationService } from './attendance-calculation.service';

@Injectable()
export class AttendanceService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly calc: AttendanceCalculationService,
  ) {}

  async list(companyId: string, filter: AttendanceFilterDto) {
    let conditions = [eq(schema.attendance.companyId, companyId)];

    if (filter.employeeId) {
      conditions.push(eq(schema.attendance.employeeId, filter.employeeId));
    }
    if (filter.fromDate) {
      conditions.push(gte(schema.attendance.attendanceDate, filter.fromDate as any));
    }
    if (filter.toDate) {
      conditions.push(lte(schema.attendance.attendanceDate, filter.toDate as any));
    }
    if (filter.status) {
      conditions.push(eq(schema.attendance.status, filter.status as any));
    }

    // Branch / Department filtering: match via employee
    if (filter.branchId || filter.departmentId) {
      const empConditions = [eq(schema.employees.companyId, companyId)];
      if (filter.branchId) {
        empConditions.push(eq(schema.employees.branchId, filter.branchId));
      }
      if (filter.departmentId) {
        empConditions.push(eq(schema.employees.departmentId, filter.departmentId));
      }

      const matchingEmps = await this.db
        .select({ id: schema.employees.id })
        .from(schema.employees)
        .where(and(...empConditions));

      const empIds = matchingEmps.map((e: any) => e.id);
      if (empIds.length === 0) {
        return paginated([], 0, filter, 'Attendance fetched');
      }
      conditions.push(inArray(schema.attendance.employeeId, empIds));
    }

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.attendance)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.attendance.findMany({
      where,
      limit: filter.limit,
      offset: filter.offset,
      with: {
        employee: {
          with: {
            department: true,
            designation: true,
            branch: true,
          },
        },
      },
      orderBy: (a: any, { desc }: any) => desc(a.attendanceDate),
    });

    return paginated(rows, total, filter, 'Attendance fetched successfully');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.attendance.findFirst({
      where: (a: any, { eq, and }: any) =>
        and(eq(a.id, id), eq(a.companyId, companyId)),
      with: {
        employee: {
          with: {
            department: true,
            designation: true,
            branch: true,
          },
        },
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'ATTENDANCE_NOT_FOUND',
        message: 'Attendance record not found',
      });
    }
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateAttendanceDto, userId: string) {
    // 1. Validate employee belongs to company
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, dto.employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in company',
      });
    }

    // 2. Prevent duplicate attendance on same date
    const existing = await this.db.query.attendance.findFirst({
      where: (a: any, { eq, and }: any) =>
        and(
          eq(a.employeeId, dto.employeeId),
          eq(a.attendanceDate, dto.attendanceDate as any),
        ),
    });
    if (existing) {
      throw new ConflictException({
        code: 'ATTENDANCE_ALREADY_EXISTS',
        message: `Attendance already recorded for ${dto.attendanceDate}`,
      });
    }

    // 3. Resolve assigned shift on date
    const assignment = await this.db.query.employeeShiftAssignments.findFirst({
      where: (a: any, { eq, and, lte }: any) =>
        and(
          eq(a.employeeId, dto.employeeId),
          lte(a.effectiveFrom, dto.attendanceDate as any),
        ),
      with: { shift: true },
      orderBy: (a: any, { desc }: any) => desc(a.effectiveFrom),
    });

    const shift = assignment?.shift ?? null;

    // 4. Check approved leave on date
    const approvedLeave = await this.db.query.leaveRequests.findFirst({
      where: (r: any, { eq, and, lte, gte }: any) =>
        and(
          eq(r.employeeId, dto.employeeId),
          eq(r.companyId, companyId),
          eq(r.status, 'APPROVED'),
          lte(r.fromDate, dto.attendanceDate as any),
          gte(r.toDate, dto.attendanceDate as any),
        ),
    });

    // 5. Check company holiday on date
    const holiday = await this.db.query.holidays.findFirst({
      where: (h: any, { eq, and }: any) =>
        and(
          eq(h.companyId, companyId),
          eq(h.holidayDate, dto.attendanceDate as any),
          eq(h.isActive, true),
        ),
    });

    // 6. Check weekly off (default Sunday: day 0)
    const dateObj = new Date(dto.attendanceDate + 'T00:00:00Z');
    const isWeeklyOff = dateObj.getUTCDay() === 0;

    // 7. Run calculation
    const checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    const checkOut = dto.checkOut ? new Date(dto.checkOut) : null;

    const calcResult = this.calc.calculate({
      checkIn,
      checkOut,
      shift: shift
        ? {
            startTime: shift.startTime,
            endTime: shift.endTime,
            breakMinutes: shift.breakMinutes,
            workingHours: shift.workingHours,
            graceMinutes: shift.graceMinutes,
            overtimeAllowed: shift.overtimeAllowed,
            isNightShift: shift.isNightShift,
          }
        : null,
      hasApprovedLeave: !!approvedLeave,
      isHoliday: !!holiday,
      isWeeklyOff,
    });

    const workingMinutes = dto.workingMinutes ?? calcResult.workingMinutes;
    const breakMinutes = dto.breakMinutes ?? calcResult.breakMinutes;
    const overtimeMinutes = dto.overtimeMinutes ?? calcResult.overtimeMinutes;
    const status = dto.status ?? calcResult.status;
    const remarks = dto.remarks ?? calcResult.remarks ?? null;

    const [row] = await this.db
      .insert(schema.attendance)
      .values({
        companyId,
        employeeId: dto.employeeId,
        attendanceDate: dto.attendanceDate as any,
        checkIn: checkIn as any,
        checkOut: checkOut as any,
        workingMinutes,
        breakMinutes,
        overtimeMinutes,
        status,
        remarks,
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'attendance',
        entityType: 'attendance',
        entityId: row.id,
        action: 'CREATE',
        newValues: row as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: 'Attendance recorded successfully',
    };
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateAttendanceDto,
    userId: string,
  ) {
    const ex = await this.db.query.attendance.findFirst({
      where: (a: any, { eq, and }: any) =>
        and(eq(a.id, id), eq(a.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'ATTENDANCE_NOT_FOUND',
        message: 'Attendance record not found',
      });
    }

    const payload: any = { ...dto, updatedAt: new Date() };

    if (dto.checkIn !== undefined) {
      payload.checkIn = dto.checkIn ? new Date(dto.checkIn) : null;
    }
    if (dto.checkOut !== undefined) {
      payload.checkOut = dto.checkOut ? new Date(dto.checkOut) : null;
    }

    const [row] = await this.db
      .update(schema.attendance)
      .set(payload)
      .where(
        and(
          eq(schema.attendance.id, id),
          eq(schema.attendance.companyId, companyId),
        ),
      )
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'attendance',
        entityType: 'attendance',
        entityId: id,
        action: 'UPDATE',
        oldValues: ex as any,
        newValues: row as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: 'Attendance updated successfully',
    };
  }

  async summary(companyId: string, filter: AttendanceSummaryFilterDto) {
    let conditions = [eq(schema.attendance.companyId, companyId)];

    const dateVal =
      filter.date ?? (filter.fromDate && filter.toDate ? null : new Date().toISOString().split('T')[0]);

    if (dateVal) {
      conditions.push(eq(schema.attendance.attendanceDate, dateVal as any));
    } else {
      if (filter.fromDate) {
        conditions.push(gte(schema.attendance.attendanceDate, filter.fromDate as any));
      }
      if (filter.toDate) {
        conditions.push(lte(schema.attendance.attendanceDate, filter.toDate as any));
      }
    }

    if (filter.branchId || filter.departmentId) {
      const empConditions = [eq(schema.employees.companyId, companyId)];
      if (filter.branchId) empConditions.push(eq(schema.employees.branchId, filter.branchId));
      if (filter.departmentId) empConditions.push(eq(schema.employees.departmentId, filter.departmentId));

      const emps = await this.db
        .select({ id: schema.employees.id })
        .from(schema.employees)
        .where(and(...empConditions));
      const empIds = emps.map((e: any) => e.id);
      if (empIds.length === 0) {
        return {
          success: true,
          data: {
            totalEmployees: 0,
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
            holiday: 0,
            overtimeMinutes: 0,
          },
        };
      }
      conditions.push(inArray(schema.attendance.employeeId, empIds));
    }

    const where = and(...conditions);

    // Total employees count in company (or filtered branch/dept)
    const empCountWhere = [
      eq(schema.employees.companyId, companyId),
      eq(schema.employees.isActive, true),
    ];
    if (filter.branchId) empCountWhere.push(eq(schema.employees.branchId, filter.branchId));
    if (filter.departmentId) empCountWhere.push(eq(schema.employees.departmentId, filter.departmentId));

    const totalEmployees = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.employees)
      .where(and(...empCountWhere))
      .then((r: any) => Number(r[0].count));

    const statusCounts = await this.db
      .select({
        status: schema.attendance.status,
        count: sql`count(*)`,
        totalOvertime: sql`coalesce(sum(${schema.attendance.overtimeMinutes}), 0)`,
      })
      .from(schema.attendance)
      .where(where)
      .groupBy(schema.attendance.status);

    const map: Record<string, number> = {};
    let totalOvertimeMinutes = 0;

    for (const r of statusCounts) {
      map[r.status] = Number(r.count);
      totalOvertimeMinutes += Number(r.totalOvertime);
    }

    const present = map['PRESENT'] ?? 0;
    const late = map['LATE'] ?? 0;
    const halfDay = map['HALF_DAY'] ?? 0;
    const onLeave = map['ON_LEAVE'] ?? 0;
    const holiday = map['HOLIDAY'] ?? 0;
    const recordedAbsent = map['ABSENT'] ?? 0;

    // Derived absent: employees without attendance records
    const recordedTotal = present + late + halfDay + onLeave + holiday + recordedAbsent;
    const absent = Math.max(recordedAbsent, totalEmployees - (recordedTotal - recordedAbsent));

    return {
      success: true,
      data: {
        totalEmployees,
        present,
        absent,
        late,
        halfDay,
        onLeave,
        holiday,
        overtimeMinutes: totalOvertimeMinutes,
      },
    };
  }

  async calendar(companyId: string, employeeId?: string, month?: string) {
    const targetMonth = month ?? new Date().toISOString().substring(0, 7); // "YYYY-MM"
    const from = `${targetMonth}-01`;
    const to = `${targetMonth}-31`;

    let conditions = [
      eq(schema.attendance.companyId, companyId),
      gte(schema.attendance.attendanceDate, from as any),
      lte(schema.attendance.attendanceDate, to as any),
    ];
    if (employeeId) {
      conditions.push(eq(schema.attendance.employeeId, employeeId));
    }

    const rows = await this.db.query.attendance.findMany({
      where: and(...conditions),
      with: {
        employee: true,
      },
      orderBy: (a: any, { asc }: any) => asc(a.attendanceDate),
    });

    return { success: true, data: rows, month: targetMonth };
  }

  async getEmployeeAttendance(
    companyId: string,
    employeeId: string,
    filter: { fromDate?: string; toDate?: string; status?: string },
  ) {
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found',
      });
    }

    let conditions = [
      eq(schema.attendance.companyId, companyId),
      eq(schema.attendance.employeeId, employeeId),
    ];
    if (filter.fromDate) {
      conditions.push(gte(schema.attendance.attendanceDate, filter.fromDate as any));
    }
    if (filter.toDate) {
      conditions.push(lte(schema.attendance.attendanceDate, filter.toDate as any));
    }
    if (filter.status) {
      conditions.push(eq(schema.attendance.status, filter.status as any));
    }

    const rows = await this.db.query.attendance.findMany({
      where: and(...conditions),
      orderBy: (a: any, { desc }: any) => desc(a.attendanceDate),
    });

    return { success: true, data: rows };
  }

  async recordPunch(companyId: string, dto: CreateAttendancePunchDto) {
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, dto.employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found',
      });
    }

    const [punch] = await this.db
      .insert(schema.attendanceLogs)
      .values({
        companyId,
        employeeId: dto.employeeId,
        punchTime: new Date(dto.punchTime) as any,
        punchType: dto.punchType,
        source: dto.source ?? 'WEB',
        deviceId: dto.deviceId ?? null,
      })
      .returning();

    return {
      success: true,
      data: punch,
      message: 'Punch logged successfully',
    };
  }

  async getPunches(
    companyId: string,
    filter: { employeeId?: string; fromDate?: string; toDate?: string },
  ) {
    let conditions = [eq(schema.attendanceLogs.companyId, companyId)];
    if (filter.employeeId) {
      conditions.push(eq(schema.attendanceLogs.employeeId, filter.employeeId));
    }
    if (filter.fromDate) {
      conditions.push(
        gte(schema.attendanceLogs.punchTime, new Date(filter.fromDate) as any),
      );
    }
    if (filter.toDate) {
      conditions.push(
        lte(
          schema.attendanceLogs.punchTime,
          new Date(filter.toDate + 'T23:59:59Z') as any,
        ),
      );
    }

    const rows = await this.db.query.attendanceLogs.findMany({
      where: and(...conditions),
      with: { employee: true },
      orderBy: (p: any, { desc }: any) => desc(p.punchTime),
      limit: 100,
    });

    return { success: true, data: rows };
  }
}
