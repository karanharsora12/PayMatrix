import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateEmployeeGroupDto, UpdateEmployeeGroupDto } from './dto/create-employee-group.dto';

@Injectable()
export class EmployeeGroupsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, dto: PaginationDto) {
    const base = eq(schema.employeeGroups.companyId, companyId);
    const where = dto.search ? and(base, ilike(schema.employeeGroups.name, `%${dto.search}%`)) : base;
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employeeGroups).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employeeGroups.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (d: any, { desc }: any) => desc(d.createdAt) });
    return paginated(rows, total, dto, 'Employee groups fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.employeeGroups.findFirst({ where: (g: any, { eq, and }: any) => and(eq(g.id, id), eq(g.companyId, companyId)) });
    if (!row) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateEmployeeGroupDto) {
    try {
      const [row] = await this.db.insert(schema.employeeGroups).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      return { success: true, data: row, message: 'Group created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException({ code: 'GROUP_CODE_EXISTS', message: 'Code exists' }); throw e; }
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeGroupDto) {
    const existing = await this.db.query.employeeGroups.findFirst({ where: (g: any, { eq, and }: any) => and(eq(g.id, id), eq(g.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    const [row] = await this.db.update(schema.employeeGroups).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.employeeGroups.id, id), eq(schema.employeeGroups.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Group updated' };
  }

  async remove(companyId: string, id: string) {
    const [existing] = await this.db.delete(schema.employeeGroups).where(and(eq(schema.employeeGroups.id, id), eq(schema.employeeGroups.companyId, companyId))).returning();
    if (!existing) throw new NotFoundException({ code: 'GROUP_NOT_FOUND', message: 'Group not found' });
    return { success: true, data: null, message: 'Group deleted' };
  }
}
