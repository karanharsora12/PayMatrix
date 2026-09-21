import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';

@Injectable()
export class LeaveBalanceService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async initializeYear(companyId: string, year: number, employeeId?: string) {
    // 1. Get employees
    const empWhere = [
      eq(schema.employees.companyId, companyId),
      eq(schema.employees.isActive, true),
    ];
    if (employeeId) {
      empWhere.push(eq(schema.employees.id, employeeId));
    }
    const employees = await this.db.query.employees.findMany({
      where: and(...empWhere),
    });

    // 2. Get active leave types
    const leaveTypes = await this.db.query.leaveTypes.findMany({
      where: (lt: any, { eq, and }: any) =>
        and(eq(lt.companyId, companyId), eq(lt.isActive, true)),
    });

    const createdBalances: any[] = [];

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const existing = await this.db.query.employeeLeaveBalances.findFirst({
          where: (b: any, { eq, and }: any) =>
            and(
              eq(b.employeeId, emp.id),
              eq(b.leaveTypeId, lt.id),
              eq(b.year, year),
            ),
        });

        if (!existing) {
          const allowance = String(lt.annualAllowance ?? 0);
          const [row] = await this.db
            .insert(schema.employeeLeaveBalances)
            .values({
              employeeId: emp.id,
              leaveTypeId: lt.id,
              year,
              openingBalance: '0',
              allocatedDays: allowance as any,
              usedDays: '0',
              pendingDays: '0',
              remainingDays: allowance as any,
            })
            .returning();
          createdBalances.push(row);
        }
      }
    }

    return {
      success: true,
      message: `Initialized leave balances for year ${year}`,
      count: createdBalances.length,
    };
  }

  async allocateLeave(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    days: number,
  ) {
    const bal = await this.db.query.employeeLeaveBalances.findFirst({
      where: (b: any, { eq, and }: any) =>
        and(
          eq(b.employeeId, employeeId),
          eq(b.leaveTypeId, leaveTypeId),
          eq(b.year, year),
        ),
    });

    if (bal) {
      const newAllocated = Number(bal.allocatedDays) + days;
      const newRemaining =
        Number(bal.openingBalance) + newAllocated - Number(bal.usedDays);
      const [updated] = await this.db
        .update(schema.employeeLeaveBalances)
        .set({
          allocatedDays: String(newAllocated) as any,
          remainingDays: String(Math.max(0, newRemaining)) as any,
          updatedAt: new Date(),
        })
        .where(eq(schema.employeeLeaveBalances.id, bal.id))
        .returning();
      return { success: true, data: updated };
    } else {
      const [created] = await this.db
        .insert(schema.employeeLeaveBalances)
        .values({
          employeeId,
          leaveTypeId,
          year,
          openingBalance: '0',
          allocatedDays: String(days) as any,
          usedDays: '0',
          pendingDays: '0',
          remainingDays: String(days) as any,
        })
        .returning();
      return { success: true, data: created };
    }
  }

  async carryForward(companyId: string, fromYear: number, toYear: number) {
    const carryForwardTypes = await this.db.query.leaveTypes.findMany({
      where: (lt: any, { eq, and }: any) =>
        and(
          eq(lt.companyId, companyId),
          eq(lt.carryForwardAllowed, true),
          eq(lt.isActive, true),
        ),
    });

    let carriedCount = 0;

    for (const lt of carryForwardTypes) {
      const maxCarry = lt.maxCarryForwardDays
        ? Number(lt.maxCarryForwardDays)
        : Infinity;

      const prevBalances = await this.db.query.employeeLeaveBalances.findMany({
        where: (b: any, { eq, and }: any) =>
          and(eq(b.leaveTypeId, lt.id), eq(b.year, fromYear)),
      });

      for (const pb of prevBalances) {
        const remaining = Number(pb.remainingDays);
        if (remaining <= 0) continue;

        const carryAmount = Math.min(remaining, maxCarry);

        const nextBal = await this.db.query.employeeLeaveBalances.findFirst({
          where: (b: any, { eq, and }: any) =>
            and(
              eq(b.employeeId, pb.employeeId),
              eq(b.leaveTypeId, lt.id),
              eq(b.year, toYear),
            ),
        });

        if (nextBal) {
          const newOpening = carryAmount;
          const newRemaining =
            newOpening +
            Number(nextBal.allocatedDays) -
            Number(nextBal.usedDays);
          await this.db
            .update(schema.employeeLeaveBalances)
            .set({
              openingBalance: String(newOpening) as any,
              remainingDays: String(Math.max(0, newRemaining)) as any,
              updatedAt: new Date(),
            })
            .where(eq(schema.employeeLeaveBalances.id, nextBal.id));
        } else {
          const allowance = Number(lt.annualAllowance ?? 0);
          await this.db.insert(schema.employeeLeaveBalances).values({
            employeeId: pb.employeeId,
            leaveTypeId: lt.id,
            year: toYear,
            openingBalance: String(carryAmount) as any,
            allocatedDays: String(allowance) as any,
            usedDays: '0',
            pendingDays: '0',
            remainingDays: String(carryAmount + allowance) as any,
          });
        }
        carriedCount++;
      }
    }

    return {
      success: true,
      message: `Carried forward balances for ${carriedCount} employee records from ${fromYear} to ${toYear}`,
    };
  }

  async adjustBalance(
    employeeId: string,
    leaveTypeId: string,
    year: number,
    adjustmentDays: number,
    reason?: string,
  ) {
    const bal = await this.db.query.employeeLeaveBalances.findFirst({
      where: (b: any, { eq, and }: any) =>
        and(
          eq(b.employeeId, employeeId),
          eq(b.leaveTypeId, leaveTypeId),
          eq(b.year, year),
        ),
    });
    if (!bal) {
      throw new NotFoundException({
        code: 'BALANCE_NOT_FOUND',
        message: 'Leave balance not found for year',
      });
    }

    const newAllocated = Number(bal.allocatedDays) + adjustmentDays;
    const newRemaining =
      Number(bal.openingBalance) + newAllocated - Number(bal.usedDays);

    const [updated] = await this.db
      .update(schema.employeeLeaveBalances)
      .set({
        allocatedDays: String(newAllocated) as any,
        remainingDays: String(Math.max(0, newRemaining)) as any,
        updatedAt: new Date(),
      })
      .where(eq(schema.employeeLeaveBalances.id, bal.id))
      .returning();

    return {
      success: true,
      data: updated,
      message: `Leave balance adjusted by ${adjustmentDays} days`,
    };
  }

  async getBalances(companyId: string, employeeId: string, year?: number) {
    const currentYear = year ?? new Date().getFullYear();

    // Verify employee belongs to company
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

    let rows = await this.db.query.employeeLeaveBalances.findMany({
      where: (b: any, { eq, and }: any) =>
        and(eq(b.employeeId, employeeId), eq(b.year, currentYear)),
      with: { leaveType: true },
    });

    // If no balances found for this employee, auto-initialize them
    if (rows.length === 0) {
      await this.initializeYear(companyId, currentYear, employeeId);
      rows = await this.db.query.employeeLeaveBalances.findMany({
        where: (b: any, { eq, and }: any) =>
          and(eq(b.employeeId, employeeId), eq(b.year, currentYear)),
        with: { leaveType: true },
      });
    }

    return { success: true, data: rows };
  }
}
