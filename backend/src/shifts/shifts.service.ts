import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { AssignShiftDto, CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';

@Injectable()
export class ShiftsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.shifts.companyId, companyId);
    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.shifts)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.shifts.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (s: any, { asc }: any) => asc(s.name),
    });

    return paginated(rows, total, dto, 'Shifts fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.shifts.findFirst({
      where: (s: any, { eq, and }: any) =>
        and(eq(s.id, id), eq(s.companyId, companyId)),
    });
    if (!row) {
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Shift not found',
      });
    }
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateShiftDto, userId: string) {
    // Check if code exists
    const existing = await this.db.query.shifts.findFirst({
      where: (s: any, { eq, and }: any) =>
        and(
          eq(s.companyId, companyId),
          eq(s.code, dto.code.trim().toUpperCase()),
        ),
    });
    if (existing) {
      throw new ConflictException({
        code: 'SHIFT_CODE_EXISTS',
        message: `Shift code '${dto.code}' already exists in company`,
      });
    }

    // Auto-detect night shift if endTime <= startTime
    const isNightShift =
      dto.isNightShift ?? (dto.endTime <= dto.startTime ? true : false);

    const [row] = await this.db
      .insert(schema.shifts)
      .values({
        companyId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakMinutes: dto.breakMinutes ?? 0,
        workingHours: String(dto.workingHours) as any,
        graceMinutes: dto.graceMinutes ?? 0,
        overtimeAllowed: dto.overtimeAllowed ?? false,
        isNightShift,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'shifts',
        entityType: 'shift',
        entityId: row.id,
        action: 'CREATE',
        newValues: row as any,
      })
      .catch(() => {});

    return { success: true, data: row, message: 'Shift created successfully' };
  }

  async update(companyId: string, id: string, dto: UpdateShiftDto, userId: string) {
    const ex = await this.db.query.shifts.findFirst({
      where: (s: any, { eq, and }: any) =>
        and(eq(s.id, id), eq(s.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Shift not found',
      });
    }

    if (dto.code && dto.code.trim().toUpperCase() !== ex.code) {
      const codeExists = await this.db.query.shifts.findFirst({
        where: (s: any, { eq, and }: any) =>
          and(
            eq(s.companyId, companyId),
            eq(s.code, dto.code!.trim().toUpperCase()),
          ),
      });
      if (codeExists) {
        throw new ConflictException({
          code: 'SHIFT_CODE_EXISTS',
          message: `Shift code '${dto.code}' already exists`,
        });
      }
    }

    const payload: any = { ...dto, updatedAt: new Date() };
    if (dto.code) payload.code = dto.code.trim().toUpperCase();
    if (dto.name) payload.name = dto.name.trim();
    if (dto.workingHours !== undefined) {
      payload.workingHours = String(dto.workingHours);
    }
    const start = dto.startTime ?? ex.startTime;
    const end = dto.endTime ?? ex.endTime;
    if (dto.isNightShift === undefined && (dto.startTime || dto.endTime)) {
      payload.isNightShift = end <= start;
    }

    const [row] = await this.db
      .update(schema.shifts)
      .set(payload)
      .where(
        and(eq(schema.shifts.id, id), eq(schema.shifts.companyId, companyId)),
      )
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'shifts',
        entityType: 'shift',
        entityId: id,
        action: 'UPDATE',
        oldValues: ex as any,
        newValues: row as any,
      })
      .catch(() => {});

    return { success: true, data: row, message: 'Shift updated successfully' };
  }

  async remove(companyId: string, id: string, userId?: string) {
    const ex = await this.db.query.shifts.findFirst({
      where: (s: any, { eq, and }: any) =>
        and(eq(s.id, id), eq(s.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Shift not found',
      });
    }

    // Check if shift is actively assigned
    const assigned = await this.db.query.employeeShiftAssignments.findFirst({
      where: (a: any, { eq }: any) => eq(a.shiftId, id),
    });
    if (assigned) {
      throw new BadRequestException({
        code: 'SHIFT_IN_USE',
        message: 'Cannot delete shift that has employee assignments',
      });
    }

    await this.db
      .delete(schema.shifts)
      .where(
        and(eq(schema.shifts.id, id), eq(schema.shifts.companyId, companyId)),
      );

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'shifts',
          entityType: 'shift',
          entityId: id,
          action: 'DELETE',
          oldValues: ex as any,
        })
        .catch(() => {});
    }

    return { success: true, data: null, message: 'Shift deleted successfully' };
  }

  async assign(
    companyId: string,
    employeeId: string,
    dto: AssignShiftDto,
    userId?: string,
  ) {
    // 1. Verify employee belongs to company
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in company',
      });
    }

    // 2. Verify shift exists in company
    const shift = await this.db.query.shifts.findFirst({
      where: (s: any, { eq, and }: any) =>
        and(eq(s.id, dto.shiftId), eq(s.companyId, companyId)),
    });
    if (!shift) {
      throw new NotFoundException({
        code: 'SHIFT_NOT_FOUND',
        message: 'Shift not found in company',
      });
    }

    // 3. Date ordering check
    if (dto.effectiveTo && dto.effectiveFrom > dto.effectiveTo) {
      throw new BadRequestException({
        code: 'INVALID_DATE_RANGE',
        message: 'effectiveFrom cannot be after effectiveTo',
      });
    }

    // 4. Overlap check: existing assignments for employee
    const existingAssignments =
      await this.db.query.employeeShiftAssignments.findMany({
        where: (a: any, { eq }: any) => eq(a.employeeId, employeeId),
      });

    const newFrom = dto.effectiveFrom;
    const newTo = dto.effectiveTo ?? null;

    for (const ea of existingAssignments) {
      const exFrom = ea.effectiveFrom;
      const exTo = ea.effectiveTo ?? null;

      // Overlap condition:
      // (exTo == null || exTo >= newFrom) && (newTo == null || newTo >= exFrom)
      const overlaps =
        (exTo === null || exTo >= newFrom) &&
        (newTo === null || newTo >= exFrom);

      if (overlaps) {
        throw new ConflictException({
          code: 'SHIFT_ASSIGNMENT_OVERLAP',
          message: `Shift assignment overlaps with existing assignment from ${exFrom} to ${exTo ?? 'indefinite'}`,
        });
      }
    }

    // 5. Insert new assignment
    const [row] = await this.db
      .insert(schema.employeeShiftAssignments)
      .values({
        employeeId,
        shiftId: dto.shiftId,
        effectiveFrom: dto.effectiveFrom as any,
        effectiveTo: (dto.effectiveTo as any) || null,
      })
      .returning();

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'shifts',
          entityType: 'employee_shift_assignment',
          entityId: row.id,
          action: 'CREATE',
          newValues: { ...dto, employeeId } as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: row,
      message: 'Shift assigned to employee successfully',
    };
  }

  async assignments(companyId: string, employeeId: string) {
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in company',
      });
    }

    const rows = await this.db.query.employeeShiftAssignments.findMany({
      where: (a: any, { eq }: any) => eq(a.employeeId, employeeId),
      with: { shift: true },
      orderBy: (a: any, { desc }: any) => desc(a.effectiveFrom),
    });
    return { success: true, data: rows };
  }

  async getCurrentShift(companyId: string, employeeId: string, onDate?: string) {
    const dateStr = onDate ?? new Date().toISOString().split('T')[0];

    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found in company',
      });
    }

    const assignments = await this.db.query.employeeShiftAssignments.findMany({
      where: (a: any, { eq, and, lte }: any) =>
        and(eq(a.employeeId, employeeId), lte(a.effectiveFrom, dateStr)),
      with: { shift: true },
      orderBy: (a: any, { desc }: any) => desc(a.effectiveFrom),
    });

    const current = assignments.find((a: any) => {
      if (!a.effectiveTo) return true;
      return a.effectiveTo >= dateStr;
    });

    return {
      success: true,
      data: current ?? null,
      message: current ? 'Current shift retrieved' : 'No active shift assignment for date',
    };
  }
}
