import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';

@Injectable()
export class ShiftsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.shifts.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.shifts).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.shifts.findMany({ where, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Shifts fetched');
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.shifts.findFirst({ where: (s: any, { eq, and }: any) => and(eq(s.id, id), eq(s.companyId, companyId)) });
    if (!row) throw new NotFoundException({ code: 'SHIFT_NOT_FOUND', message: 'Shift not found' });
    return { success: true, data: row };
  }
  async create(companyId: string, dto: any, userId: string) {
    try {
      const [row] = await this.db.insert(schema.shifts).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'shifts', entityType: 'shift', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Shift created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException('Shift code exists'); throw e; }
  }
  async update(companyId: string, id: string, dto: any, userId: string) {
    const ex = await this.db.query.shifts.findFirst({ where: (s: any, { eq, and }: any) => and(eq(s.id, id), eq(s.companyId, companyId)) });
    if (!ex) throw new NotFoundException('Shift not found');
    const [row] = await this.db.update(schema.shifts).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.shifts.id, id), eq(schema.shifts.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Shift updated' };
  }
  async remove(companyId: string, id: string) {
    await this.db.delete(schema.shifts).where(and(eq(schema.shifts.id, id), eq(schema.shifts.companyId, companyId)));
    return { success: true, data: null, message: 'Shift deleted' };
  }
  async assign(companyId: string, employeeId: string, shiftId: string, effectiveFrom: string, effectiveTo?: string) {
    // Verify employee belongs to company
    const emp = await this.db.query.employees.findFirst({ where: (e: any, { eq, and }: any) => and(eq(e.id, employeeId), eq(e.companyId, companyId)) });
    if (!emp) throw new NotFoundException('Employee not found in company');
    const [row] = await this.db.insert(schema.employeeShiftAssignments).values({ employeeId, shiftId, effectiveFrom: effectiveFrom as any, effectiveTo: effectiveTo as any }).returning();
    return { success: true, data: row, message: 'Shift assigned' };
  }
  async assignments(employeeId: string) {
    const rows = await this.db.query.employeeShiftAssignments.findMany({ where: (a: any, { eq }: any) => eq(a.employeeId, employeeId), with: { shift: true } });
    return { success: true, data: rows };
  }
}

