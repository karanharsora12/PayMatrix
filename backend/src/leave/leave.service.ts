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
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveCalendarFilterDto,
  LeaveRequestFilterDto,
  RejectLeaveDto,
  UpdateLeaveTypeDto,
} from './dto/leave.dto';
import { WorkingDaysCalculationService } from './working-days-calculation.service';
import { LeaveBalanceService } from './leave-balance.service';

@Injectable()
export class LeaveService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly workingDaysCalc: WorkingDaysCalculationService,
    private readonly balanceService: LeaveBalanceService,
  ) {}

  // ---------------------------------------------------------------------------
  // Leave Types
  // ---------------------------------------------------------------------------
  async types(companyId: string, dto: PaginationDto) {
    const where = eq(schema.leaveTypes.companyId, companyId);
    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.leaveTypes)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.leaveTypes.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (t: any, { asc }: any) => asc(t.name),
    });

    return paginated(rows, total, dto, 'Leave types fetched successfully');
  }

  async getType(companyId: string, id: string) {
    const row = await this.db.query.leaveTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(eq(t.id, id), eq(t.companyId, companyId)),
    });
    if (!row) {
      throw new NotFoundException({
        code: 'LEAVE_TYPE_NOT_FOUND',
        message: 'Leave type not found',
      });
    }
    return { success: true, data: row };
  }

  async createType(companyId: string, dto: CreateLeaveTypeDto, userId: string) {
    const existing = await this.db.query.leaveTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(
          eq(t.companyId, companyId),
          eq(t.code, dto.code.trim().toUpperCase()),
        ),
    });
    if (existing) {
      throw new ConflictException({
        code: 'LEAVE_TYPE_CODE_EXISTS',
        message: `Leave type with code '${dto.code}' already exists`,
      });
    }

    const [row] = await this.db
      .insert(schema.leaveTypes)
      .values({
        companyId,
        code: dto.code.trim().toUpperCase(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        isPaid: dto.isPaid ?? true,
        annualAllowance: String(dto.annualAllowance ?? 0) as any,
        carryForwardAllowed: dto.carryForwardAllowed ?? false,
        maxCarryForwardDays: dto.maxCarryForwardDays
          ? (String(dto.maxCarryForwardDays) as any)
          : null,
        maxConsecutiveDays: dto.maxConsecutiveDays ?? null,
        requiresApproval: dto.requiresApproval ?? true,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'leave',
        entityType: 'leave_type',
        entityId: row.id,
        action: 'CREATE',
        newValues: row as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: 'Leave type created successfully',
    };
  }

  async updateType(
    companyId: string,
    id: string,
    dto: UpdateLeaveTypeDto,
    userId?: string,
  ) {
    const ex = await this.db.query.leaveTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(eq(t.id, id), eq(t.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'LEAVE_TYPE_NOT_FOUND',
        message: 'Leave type not found',
      });
    }

    if (dto.code && dto.code.trim().toUpperCase() !== ex.code) {
      const codeExists = await this.db.query.leaveTypes.findFirst({
        where: (t: any, { eq, and }: any) =>
          and(
            eq(t.companyId, companyId),
            eq(t.code, dto.code!.trim().toUpperCase()),
          ),
      });
      if (codeExists) {
        throw new ConflictException({
          code: 'LEAVE_TYPE_CODE_EXISTS',
          message: `Leave type code '${dto.code}' already exists`,
        });
      }
    }

    const payload: any = { ...dto, updatedAt: new Date() };
    if (dto.code) payload.code = dto.code.trim().toUpperCase();
    if (dto.name) payload.name = dto.name.trim();
    if (dto.annualAllowance !== undefined) {
      payload.annualAllowance = String(dto.annualAllowance);
    }
    if (dto.maxCarryForwardDays !== undefined) {
      payload.maxCarryForwardDays = String(dto.maxCarryForwardDays);
    }

    const [row] = await this.db
      .update(schema.leaveTypes)
      .set(payload)
      .where(
        and(
          eq(schema.leaveTypes.id, id),
          eq(schema.leaveTypes.companyId, companyId),
        ),
      )
      .returning();

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'leave',
          entityType: 'leave_type',
          entityId: id,
          action: 'UPDATE',
          oldValues: ex as any,
          newValues: row as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: row,
      message: 'Leave type updated successfully',
    };
  }

  async deleteType(companyId: string, id: string, userId?: string) {
    const ex = await this.db.query.leaveTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(eq(t.id, id), eq(t.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'LEAVE_TYPE_NOT_FOUND',
        message: 'Leave type not found',
      });
    }

    // Check if leave requests exist
    const hasRequests = await this.db.query.leaveRequests.findFirst({
      where: (r: any, { eq }: any) => eq(r.leaveTypeId, id),
    });
    if (hasRequests) {
      throw new BadRequestException({
        code: 'LEAVE_TYPE_IN_USE',
        message: 'Cannot delete leave type that has associated leave requests',
      });
    }

    await this.db
      .delete(schema.leaveTypes)
      .where(
        and(
          eq(schema.leaveTypes.id, id),
          eq(schema.leaveTypes.companyId, companyId),
        ),
      );

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'leave',
          entityType: 'leave_type',
          entityId: id,
          action: 'DELETE',
          oldValues: ex as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: null,
      message: 'Leave type deleted successfully',
    };
  }

  // ---------------------------------------------------------------------------
  // Leave Requests
  // ---------------------------------------------------------------------------
  async requests(companyId: string, filter: LeaveRequestFilterDto) {
    let conditions = [eq(schema.leaveRequests.companyId, companyId)];

    if (filter.employeeId) {
      conditions.push(eq(schema.leaveRequests.employeeId, filter.employeeId));
    }
    if (filter.status) {
      conditions.push(eq(schema.leaveRequests.status, filter.status as any));
    }
    if (filter.fromDate) {
      conditions.push(gte(schema.leaveRequests.fromDate, filter.fromDate as any));
    }
    if (filter.toDate) {
      conditions.push(lte(schema.leaveRequests.toDate, filter.toDate as any));
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
        return paginated([], 0, filter, 'Leave requests fetched');
      }
      conditions.push(inArray(schema.leaveRequests.employeeId, empIds));
    }

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.leaveRequests)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.leaveRequests.findMany({
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
        leaveType: true,
      },
      orderBy: (r: any, { desc }: any) => desc(r.createdAt),
    });

    return paginated(rows, total, filter, 'Leave requests fetched successfully');
  }

  async getRequest(companyId: string, id: string) {
    const row = await this.db.query.leaveRequests.findFirst({
      where: (r: any, { eq, and }: any) =>
        and(eq(r.id, id), eq(r.companyId, companyId)),
      with: {
        employee: {
          with: {
            department: true,
            designation: true,
            branch: true,
          },
        },
        leaveType: true,
      },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'LEAVE_NOT_FOUND',
        message: 'Leave request not found',
      });
    }
    return { success: true, data: row };
  }

  async createRequest(
    companyId: string,
    dto: CreateLeaveRequestDto,
    userId: string,
  ) {
    // 1. Validate employee
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

    // 2. Validate leave type
    const lt = await this.db.query.leaveTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(
          eq(t.id, dto.leaveTypeId),
          eq(t.companyId, companyId),
          eq(t.isActive, true),
        ),
    });
    if (!lt) {
      throw new NotFoundException({
        code: 'LEAVE_TYPE_NOT_FOUND',
        message: 'Active leave type not found in company',
      });
    }

    // 3. Validate dates
    if (dto.fromDate > dto.toDate) {
      throw new BadRequestException({
        code: 'INVALID_LEAVE_DATES',
        message: 'fromDate cannot be after toDate',
      });
    }

    // 4. Overlapping request check: status IN ('PENDING', 'APPROVED')
    const overlapping = await this.db.query.leaveRequests.findFirst({
      where: (r: any, { eq, and, sql }: any) =>
        and(
          eq(r.employeeId, dto.employeeId),
          eq(r.companyId, companyId),
          sql`${r.status} IN ('PENDING', 'APPROVED')`,
          sql`${r.fromDate} <= ${dto.toDate} AND ${r.toDate} >= ${dto.fromDate}`,
        ),
    });
    if (overlapping) {
      throw new ConflictException({
        code: 'OVERLAPPING_LEAVE',
        message: `Overlapping leave request (${overlapping.status}) already exists from ${overlapping.fromDate} to ${overlapping.toDate}`,
      });
    }

    // 5. Calculate working days excluding weekends & company holidays
    const { workingDays, excludedWeekendDates, excludedHolidayDates } =
      await this.workingDaysCalc.calculateWorkingDays(
        companyId,
        dto.fromDate,
        dto.toDate,
      );

    if (workingDays === 0) {
      throw new BadRequestException({
        code: 'INVALID_LEAVE_DATES',
        message:
          'No working days in the selected date range (all dates are weekends or company holidays)',
      });
    }

    // 6. Max consecutive days check
    if (lt.maxConsecutiveDays && workingDays > lt.maxConsecutiveDays) {
      throw new BadRequestException({
        code: 'MAX_CONSECUTIVE_DAYS_EXCEEDED',
        message: `Maximum consecutive days allowed for ${lt.name} is ${lt.maxConsecutiveDays} days`,
      });
    }

    // 7. Check leave balance for the year
    const year = new Date(dto.fromDate + 'T00:00:00Z').getUTCFullYear();
    let bal = await this.db.query.employeeLeaveBalances.findFirst({
      where: (b: any, { eq, and }: any) =>
        and(
          eq(b.employeeId, dto.employeeId),
          eq(b.leaveTypeId, dto.leaveTypeId),
          eq(b.year, year),
        ),
    });

    if (!bal) {
      // Auto-initialize if not present
      await this.balanceService.initializeYear(companyId, year, dto.employeeId);
      bal = await this.db.query.employeeLeaveBalances.findFirst({
        where: (b: any, { eq, and }: any) =>
          and(
            eq(b.employeeId, dto.employeeId),
            eq(b.leaveTypeId, dto.leaveTypeId),
            eq(b.year, year),
          ),
      });
    }

    if (bal) {
      const remaining = Number(bal.remainingDays);
      if (remaining < workingDays) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_LEAVE_BALANCE',
          message: `Insufficient leave balance. Available: ${remaining} days, Requested: ${workingDays} days`,
        });
      }
    }

    // 8. Transactionally create leave request and increment pending days
    const result = await this.db.transaction(async (tx: any) => {
      const [row] = await tx
        .insert(schema.leaveRequests)
        .values({
          companyId,
          employeeId: dto.employeeId,
          leaveTypeId: dto.leaveTypeId,
          fromDate: dto.fromDate as any,
          toDate: dto.toDate as any,
          totalDays: String(workingDays) as any,
          reason: dto.reason?.trim() || null,
          status: 'PENDING',
        })
        .returning();

      if (bal) {
        await tx
          .update(schema.employeeLeaveBalances)
          .set({
            pendingDays: sql`${schema.employeeLeaveBalances.pendingDays} + ${workingDays}`,
            updatedAt: new Date(),
          })
          .where(eq(schema.employeeLeaveBalances.id, bal.id));
      }

      return row;
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'leave',
        entityType: 'leave_request',
        entityId: result.id,
        action: 'CREATE',
        newValues: { ...result, workingDays, excludedWeekendDates, excludedHolidayDates } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: result,
      workingDays,
      message: `Leave request submitted for ${workingDays} working days`,
    };
  }

  // ---------------------------------------------------------------------------
  // Leave Approval Workflow
  // ---------------------------------------------------------------------------
  async approve(companyId: string, id: string, approverId: string) {
    const updated = await this.db.transaction(async (tx: any) => {
      const req = await tx.query.leaveRequests.findFirst({
        where: (r: any, { eq, and }: any) =>
          and(eq(r.id, id), eq(r.companyId, companyId)),
      });
      if (!req) {
        throw new NotFoundException({
          code: 'LEAVE_NOT_FOUND',
          message: 'Leave request not found',
        });
      }
      if (req.status !== 'PENDING') {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Only PENDING leave requests can be approved. Current status: ${req.status}`,
        });
      }

      const totalDays = Number(req.totalDays);
      const year = new Date(req.fromDate + 'T00:00:00Z').getUTCFullYear();

      const bal = await tx.query.employeeLeaveBalances.findFirst({
        where: (b: any, { eq, and }: any) =>
          and(
            eq(b.employeeId, req.employeeId),
            eq(b.leaveTypeId, req.leaveTypeId),
            eq(b.year, year),
          ),
      });

      if (bal && Number(bal.remainingDays) < totalDays) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_LEAVE_BALANCE',
          message: `Insufficient leave balance at approval. Available: ${bal.remainingDays} days, Requested: ${totalDays} days`,
        });
      }

      // Update Request status to APPROVED
      const [row] = await tx
        .update(schema.leaveRequests)
        .set({
          status: 'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date().toISOString().substring(0, 10) as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.leaveRequests.id, id))
        .returning();

      // Deduct from Balance
      if (bal) {
        await tx
          .update(schema.employeeLeaveBalances)
          .set({
            usedDays: sql`${schema.employeeLeaveBalances.usedDays} + ${totalDays}`,
            pendingDays: sql`greatest(0, ${schema.employeeLeaveBalances.pendingDays} - ${totalDays})`,
            remainingDays: sql`greatest(0, ${schema.employeeLeaveBalances.remainingDays} - ${totalDays})`,
            updatedAt: new Date(),
          })
          .where(eq(schema.employeeLeaveBalances.id, bal.id));
      }

      return row;
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId: approverId,
        module: 'leave',
        entityType: 'leave_request',
        entityId: id,
        action: 'APPROVE',
        newValues: { status: 'APPROVED', approvedBy: approverId } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: updated,
      message: 'Leave request approved successfully',
    };
  }

  async reject(
    companyId: string,
    id: string,
    approverId: string,
    dto: RejectLeaveDto,
  ) {
    const updated = await this.db.transaction(async (tx: any) => {
      const req = await tx.query.leaveRequests.findFirst({
        where: (r: any, { eq, and }: any) =>
          and(eq(r.id, id), eq(r.companyId, companyId)),
      });
      if (!req) {
        throw new NotFoundException({
          code: 'LEAVE_NOT_FOUND',
          message: 'Leave request not found',
        });
      }
      if (req.status !== 'PENDING') {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Only PENDING leave requests can be rejected. Current status: ${req.status}`,
        });
      }

      const totalDays = Number(req.totalDays);
      const year = new Date(req.fromDate + 'T00:00:00Z').getUTCFullYear();

      const [row] = await tx
        .update(schema.leaveRequests)
        .set({
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason.trim(),
          approvedBy: approverId,
          updatedAt: new Date(),
        })
        .where(eq(schema.leaveRequests.id, id))
        .returning();

      // Release pending days on balance without modifying used/remaining
      const bal = await tx.query.employeeLeaveBalances.findFirst({
        where: (b: any, { eq, and }: any) =>
          and(
            eq(b.employeeId, req.employeeId),
            eq(b.leaveTypeId, req.leaveTypeId),
            eq(b.year, year),
          ),
      });

      if (bal) {
        await tx
          .update(schema.employeeLeaveBalances)
          .set({
            pendingDays: sql`greatest(0, ${schema.employeeLeaveBalances.pendingDays} - ${totalDays})`,
            updatedAt: new Date(),
          })
          .where(eq(schema.employeeLeaveBalances.id, bal.id));
      }

      return row;
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId: approverId,
        module: 'leave',
        entityType: 'leave_request',
        entityId: id,
        action: 'REJECT',
        newValues: {
          status: 'REJECTED',
          rejectionReason: dto.rejectionReason,
        } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: updated,
      message: 'Leave request rejected successfully',
    };
  }

  async cancel(companyId: string, id: string, userId: string) {
    const updated = await this.db.transaction(async (tx: any) => {
      const req = await tx.query.leaveRequests.findFirst({
        where: (r: any, { eq, and }: any) =>
          and(eq(r.id, id), eq(r.companyId, companyId)),
      });
      if (!req) {
        throw new NotFoundException({
          code: 'LEAVE_NOT_FOUND',
          message: 'Leave request not found',
        });
      }
      if (req.status !== 'PENDING' && req.status !== 'APPROVED') {
        throw new BadRequestException({
          code: 'INVALID_STATUS',
          message: `Cannot cancel a leave request with status ${req.status}`,
        });
      }

      const totalDays = Number(req.totalDays);
      const year = new Date(req.fromDate + 'T00:00:00Z').getUTCFullYear();
      const wasApproved = req.status === 'APPROVED';

      const [row] = await tx
        .update(schema.leaveRequests)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(schema.leaveRequests.id, id))
        .returning();

      const bal = await tx.query.employeeLeaveBalances.findFirst({
        where: (b: any, { eq, and }: any) =>
          and(
            eq(b.employeeId, req.employeeId),
            eq(b.leaveTypeId, req.leaveTypeId),
            eq(b.year, year),
          ),
      });

      if (bal) {
        if (wasApproved) {
          // Restore used and remaining balance
          await tx
            .update(schema.employeeLeaveBalances)
            .set({
              usedDays: sql`greatest(0, ${schema.employeeLeaveBalances.usedDays} - ${totalDays})`,
              remainingDays: sql`${schema.employeeLeaveBalances.remainingDays} + ${totalDays}`,
              updatedAt: new Date(),
            })
            .where(eq(schema.employeeLeaveBalances.id, bal.id));
        } else {
          // Was pending: just release pending days
          await tx
            .update(schema.employeeLeaveBalances)
            .set({
              pendingDays: sql`greatest(0, ${schema.employeeLeaveBalances.pendingDays} - ${totalDays})`,
              updatedAt: new Date(),
            })
            .where(eq(schema.employeeLeaveBalances.id, bal.id));
        }
      }

      return row;
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'leave',
        entityType: 'leave_request',
        entityId: id,
        action: 'CANCEL' as any,
        newValues: { status: 'CANCELLED' } as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: updated,
      message: 'Leave request cancelled and balance restored',
    };
  }

  // ---------------------------------------------------------------------------
  // Leave Calendar
  // ---------------------------------------------------------------------------
  async calendar(companyId: string, filter: LeaveCalendarFilterDto) {
    let conditions = [
      eq(schema.leaveRequests.companyId, companyId),
      eq(schema.leaveRequests.status, 'APPROVED'),
    ];

    if (filter.fromDate) {
      conditions.push(gte(schema.leaveRequests.toDate, filter.fromDate as any));
    }
    if (filter.toDate) {
      conditions.push(lte(schema.leaveRequests.fromDate, filter.toDate as any));
    }
    if (filter.employeeId) {
      conditions.push(eq(schema.leaveRequests.employeeId, filter.employeeId));
    }
    if (filter.leaveTypeId) {
      conditions.push(eq(schema.leaveRequests.leaveTypeId, filter.leaveTypeId));
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
      if (empIds.length === 0) return { success: true, data: [] };
      conditions.push(inArray(schema.leaveRequests.employeeId, empIds));
    }

    const rows = await this.db.query.leaveRequests.findMany({
      where: and(...conditions),
      with: {
        employee: {
          with: {
            department: true,
            designation: true,
            branch: true,
          },
        },
        leaveType: true,
      },
      orderBy: (r: any, { asc }: any) => asc(r.fromDate),
    });

    return { success: true, data: rows };
  }

  async balances(companyId: string, employeeId: string, year?: number) {
    return this.balanceService.getBalances(companyId, employeeId, year);
  }
}
