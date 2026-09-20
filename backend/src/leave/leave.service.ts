import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';

@Injectable()
export class LeaveService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async types(companyId: string, dto: PaginationDto) {
    const where = eq(schema.leaveTypes.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.leaveTypes).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.leaveTypes.findMany({ where, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Leave types fetched');
  }
  async createType(companyId: string, dto: any, userId: string) {
    const [row] = await this.db.insert(schema.leaveTypes).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
    return { success: true, data: row, message: 'Leave type created' };
  }
  async updateType(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.leaveTypes).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.leaveTypes.id, id), eq(schema.leaveTypes.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('Leave type not found');
    return { success: true, data: row, message: 'Leave type updated' };
  }
  async deleteType(companyId: string, id: string) {
    await this.db.delete(schema.leaveTypes).where(and(eq(schema.leaveTypes.id, id), eq(schema.leaveTypes.companyId, companyId)));
    return { success: true, data: null, message: 'Leave type deleted' };
  }

  async requests(companyId: string, dto: PaginationDto & { employeeId?: string; status?: string }) {
    let where: any = eq(schema.leaveRequests.companyId, companyId);
    if ((dto as any).employeeId) where = and(where, eq(schema.leaveRequests.employeeId, (dto as any).employeeId));
    if ((dto as any).status) where = and(where, eq(schema.leaveRequests.status, (dto as any).status));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.leaveRequests).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.leaveRequests.findMany({ where, limit: dto.limit, offset: dto.offset, with: { employee: true, leaveType: true }, orderBy: (r: any, { desc }: any) => desc(r.createdAt) });
    return paginated(rows, total, dto, 'Leave requests fetched');
  }

  async createRequest(companyId: string, dto: any, userId: string) {
    // Check overlapping
    const overlapping = await this.db.query.leaveRequests.findFirst({
      where: (r: any, { eq, and, sql }: any) => and(eq(r.employeeId, dto.employeeId), eq(r.companyId, companyId), sql`${r.status} IN ('PENDING','APPROVED')`, sql`${r.fromDate} <= ${dto.toDate} AND ${r.toDate} >= ${dto.fromDate}`),
    });
    if (overlapping) throw new ConflictException({ code: 'LEAVE_OVERLAPPING_REQUEST', message: 'Overlapping leave request exists' });
    // Check balance
    const year = new Date(dto.fromDate).getFullYear();
    const bal: any = await this.db.query.employeeLeaveBalances.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.employeeId, dto.employeeId), eq(b.leaveTypeId, dto.leaveTypeId), eq(b.year, year)) });
    if (bal && Number(bal.remainingDays) < Number(dto.totalDays)) throw new BadRequestException({ code: 'LEAVE_INSUFFICIENT_BALANCE', message: 'Insufficient leave balance' });
    const [row] = await this.db.insert(schema.leaveRequests).values({ ...dto, companyId, status: 'PENDING' }).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'leave', entityType: 'leave_request', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
    // Notify via notifications
    await this.db.insert(schema.notifications).values({ companyId, userId: dto.employeeId, type: 'LEAVE', title: 'Leave request created', message: `${dto.totalDays} days requested`, entityType: 'leave_request', entityId: row.id }).catch(()=>{});
    return { success: true, data: row, message: 'Leave request created' };
  }

  async approve(companyId: string, id: string, approverId: string) {
    return this.db.transaction(async (tx: any) => {
      const req: any = await tx.query.leaveRequests.findFirst({ where: (r: any, { eq, and }: any) => and(eq(r.id, id), eq(r.companyId, companyId)) });
      if (!req) throw new NotFoundException({ code: 'LEAVE_NOT_FOUND', message: 'Leave request not found' });
      if (req.status !== 'PENDING') throw new BadRequestException({ code: 'LEAVE_INVALID_STATUS', message: 'Only pending requests can be approved' });
      const year = new Date(req.fromDate).getFullYear();
      const bal: any = await tx.query.employeeLeaveBalances.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.employeeId, req.employeeId), eq(b.leaveTypeId, req.leaveTypeId), eq(b.year, year)) });
      if (bal && Number(bal.remainingDays) < Number(req.totalDays)) throw new BadRequestException({ code: 'LEAVE_INSUFFICIENT_BALANCE', message: 'Insufficient balance' });
      // Overlapping re-check
      const [updated] = await tx.update(schema.leaveRequests).set({ status: 'APPROVED', approvedBy: approverId, approvedAt: new Date().toISOString() as any, updatedAt: new Date() }).where(eq(schema.leaveRequests.id, id)).returning();
      if (bal) {
        await tx.update(schema.employeeLeaveBalances).set({ usedDays: sql`${schema.employeeLeaveBalances.usedDays} + ${req.totalDays}`, remainingDays: sql`${schema.employeeLeaveBalances.remainingDays} - ${req.totalDays}`, updatedAt: new Date() }).where(eq(schema.employeeLeaveBalances.id, bal.id));
      }
      await tx.insert(schema.auditLogs).values({ companyId, userId: approverId, module: 'leave', entityType: 'leave_request', entityId: id, action: 'APPROVE', newValues: { status: 'APPROVED' } as any }).catch(()=>{});
      await tx.insert(schema.notifications).values({ companyId, userId: req.employeeId, type: 'LEAVE', title: 'Leave approved', message: `Your leave ${req.fromDate} to ${req.toDate} approved`, entityType: 'leave_request', entityId: id }).catch(()=>{});
      return { success: true, data: updated, message: 'Leave approved' };
    });
  }

  async reject(companyId: string, id: string, approverId: string, reason?: string) {
    const req: any = await this.db.query.leaveRequests.findFirst({ where: (r: any, { eq, and }: any) => and(eq(r.id, id), eq(r.companyId, companyId)) });
    if (!req) throw new NotFoundException('Leave not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Only pending can be rejected');
    const [row] = await this.db.update(schema.leaveRequests).set({ status: 'REJECTED', rejectionReason: reason, approvedBy: approverId, updatedAt: new Date() }).where(eq(schema.leaveRequests.id, id)).returning();
    return { success: true, data: row, message: 'Leave rejected' };
  }

  async cancel(companyId: string, id: string, userId: string) {
    const req: any = await this.db.query.leaveRequests.findFirst({ where: (r: any, { eq, and }: any) => and(eq(r.id, id), eq(r.companyId, companyId)) });
    if (!req) throw new NotFoundException('Leave not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Only pending can be cancelled');
    const [row] = await this.db.update(schema.leaveRequests).set({ status: 'CANCELLED', updatedAt: new Date() }).where(eq(schema.leaveRequests.id, id)).returning();
    return { success: true, data: row, message: 'Leave cancelled' };
  }

  async balances(employeeId: string) {
    const rows = await this.db.query.employeeLeaveBalances.findMany({ where: (b: any, { eq }: any) => eq(b.employeeId, employeeId), with: { leaveType: true } });
    return { success: true, data: rows };
  }

  async calendar(companyId: string, from: string, to: string) {
    const rows = await this.db.query.leaveRequests.findMany({ where: (r: any, { eq, and, gte, lte }: any) => and(eq(r.companyId, companyId), eq(r.status, 'APPROVED'), gte(r.fromDate, from), lte(r.toDate, to)) });
    return { success: true, data: rows };
  }
}

