import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { AttendanceCalculationService } from './attendance-calculation.service';

@Injectable()
export class AttendanceService {
  constructor(@Inject(DRIZZLE) private db: any, private calc: AttendanceCalculationService) {}

  async list(companyId: string, dto: PaginationDto & { fromDate?: string; toDate?: string; employeeId?: string; status?: string }) {
    let where: any = eq(schema.attendance.companyId, companyId);
    if ((dto as any).employeeId) where = and(where, eq(schema.attendance.employeeId, (dto as any).employeeId));
    if ((dto as any).fromDate) where = and(where, gte(schema.attendance.attendanceDate, (dto as any).fromDate));
    if ((dto as any).toDate) where = and(where, lte(schema.attendance.attendanceDate, (dto as any).toDate));
    if ((dto as any).status) where = and(where, eq(schema.attendance.status, (dto as any).status));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.attendance).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.attendance.findMany({ where, limit: dto.limit, offset: dto.offset, with: { employee: true }, orderBy: (a: any, { desc }: any) => desc(a.attendanceDate) });
    return paginated(rows, total, dto, 'Attendance fetched');
  }

  async summary(companyId: string, fromDate: string, toDate: string) {
    const rows: any[] = await this.db.select({ status: schema.attendance.status, count: sql`count(*)` }).from(schema.attendance).where(and(eq(schema.attendance.companyId, companyId), gte(schema.attendance.attendanceDate, fromDate), lte(schema.attendance.attendanceDate, toDate))).groupBy(schema.attendance.status);
    const map: any = {};
    for (const r of rows) map[r.status.toLowerCase()] = Number(r.count);
    return { success: true, data: { present: map.present ?? 0, absent: map.absent ?? 0, late: map.late ?? 0, halfDay: map.half_day ?? 0, onLeave: map.on_leave ?? 0, holiday: map.holiday ?? 0, overtime: 0 } };
  }

  async create(companyId: string, dto: any, userId: string) {
    // Use calculation service if checkIn/checkOut provided
    let calc: any = {};
    if (dto.checkIn && dto.checkOut) {
      const res = this.calc.calculate({ checkIn: new Date(dto.checkIn), checkOut: new Date(dto.checkOut), shiftStart: '09:30', shiftEnd: '18:30', breakMinutes: dto.breakMinutes ?? 60, graceMinutes: 15 });
      calc = res;
    }
    const [row] = await this.db.insert(schema.attendance).values({ companyId, employeeId: dto.employeeId, attendanceDate: dto.attendanceDate, checkIn: dto.checkIn ? new Date(dto.checkIn) as any : null, checkOut: dto.checkOut ? new Date(dto.checkOut) as any : null, workingMinutes: calc.workingMinutes ?? dto.workingMinutes, breakMinutes: calc.breakMinutes ?? dto.breakMinutes, overtimeMinutes: calc.overtimeMinutes ?? dto.overtimeMinutes, status: calc.status ?? dto.status ?? 'PRESENT', remarks: dto.remarks }).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'attendance', entityType: 'attendance', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Attendance recorded' };
  }

  async update(companyId: string, id: string, dto: any, userId: string) {
    const ex = await this.db.query.attendance.findFirst({ where: (a: any, { eq, and }: any) => and(eq(a.id, id), eq(a.companyId, companyId)) });
    if (!ex) throw new NotFoundException({ code: 'ATTENDANCE_NOT_FOUND', message: 'Attendance not found' });
    const [row] = await this.db.update(schema.attendance).set({ ...dto, updatedAt: new Date() } as any).where(and(eq(schema.attendance.id, id), eq(schema.attendance.companyId, companyId))).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'attendance', entityType: 'attendance', entityId: id, action: 'UPDATE', oldValues: ex as any, newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Attendance updated' };
  }

  async calendar(companyId: string, employeeId: string, month: string) {
    // month = "2026-09"
    const from = `${month}-01`;
    const to = `${month}-31`;
    const rows = await this.db.query.attendance.findMany({ where: (a: any, { eq, and, gte, lte }: any) => and(eq(a.companyId, companyId), eq(a.employeeId, employeeId), gte(a.attendanceDate, from), lte(a.attendanceDate, to)), orderBy: (a: any, { asc }: any) => asc(a.attendanceDate) });
    return { success: true, data: rows };
  }
}

