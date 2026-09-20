import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const base = eq(schema.departments.companyId, companyId);
    const where = dto.search ? and(base, ilike(schema.departments.name, `%${dto.search}%`)) : base;
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.departments).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.departments.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (d: any, { desc }: any) => desc(d.createdAt) });
    return paginated(rows, total, dto, 'Departments fetched');
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.departments.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)) });
    if (!row) throw new NotFoundException({ code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' });
    return { success: true, data: row };
  }
  async create(companyId: string, dto: CreateDepartmentDto, userId: string) {
    try {
      const [row] = await this.db.insert(schema.departments).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'departments', entityType: 'department', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Department created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException({ code: 'DEPARTMENT_CODE_EXISTS', message: 'Department code exists' }); throw e; }
  }
  async update(companyId: string, id: string, dto: UpdateDepartmentDto, userId: string) {
    const existing = await this.db.query.departments.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' });
    const [row] = await this.db.update(schema.departments).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.departments.id, id), eq(schema.departments.companyId, companyId))).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'departments', entityType: 'department', entityId: id, action: 'UPDATE', oldValues: existing as any, newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Department updated' };
  }
  async remove(companyId: string, id: string) {
    const existing = await this.db.query.departments.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found' });
    const cnt = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(and(eq(schema.employees.departmentId, id), eq(schema.employees.companyId, companyId))).then((r: any) => Number(r[0].count));
    if (cnt > 0) throw new ConflictException({ code: 'DEPARTMENT_HAS_EMPLOYEES', message: 'Cannot delete department with active employees' });
    await this.db.update(schema.departments).set({ deletedAt: new Date() } as any).where(eq(schema.departments.id, id));
    return { success: true, data: null, message: 'Department deleted' };
  }
  async employees(companyId: string, id: string, dto: PaginationDto) {
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(and(eq(schema.employees.companyId, companyId), eq(schema.employees.departmentId, id))).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employees.findMany({ where: (e: any, { eq, and }: any) => and(eq(e.companyId, companyId), eq(e.departmentId, id)), limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto);
  }
}

