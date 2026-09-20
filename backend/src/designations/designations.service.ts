import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/create-designation.dto';

@Injectable()
export class DesignationsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto & { departmentId?: string }) {
    let base = eq(schema.designations.companyId, companyId);
    let where: any = base;
    if ((dto as any).departmentId) where = and(where, eq(schema.designations.departmentId, (dto as any).departmentId));
    if (dto.search) where = and(where, ilike(schema.designations.name, `%${dto.search}%`));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.designations).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.designations.findMany({ where, limit: dto.limit, offset: dto.offset, with: { department: true } });
    return paginated(rows, total, dto, 'Designations fetched');
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.designations.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)), with: { department: true } });
    if (!row) throw new NotFoundException({ code: 'DESIGNATION_NOT_FOUND', message: 'Designation not found' });
    return { success: true, data: row };
  }
  async create(companyId: string, dto: CreateDesignationDto, userId: string) {
    try {
      const [row] = await this.db.insert(schema.designations).values({ ...dto, companyId, code: dto.code.toUpperCase(), minimumSalary: dto.minimumSalary?.toString() as any, maximumSalary: dto.maximumSalary?.toString() as any }).returning();
      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'designations', entityType: 'designation', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Designation created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException({ code: 'DESIGNATION_CODE_EXISTS', message: 'Code exists' }); throw e; }
  }
  async update(companyId: string, id: string, dto: UpdateDesignationDto, userId: string) {
    const existing = await this.db.query.designations.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DESIGNATION_NOT_FOUND', message: 'Designation not found' });
    const [row] = await this.db.update(schema.designations).set({ ...dto, minimumSalary: dto.minimumSalary?.toString() as any, maximumSalary: dto.maximumSalary?.toString() as any, updatedAt: new Date() }).where(and(eq(schema.designations.id, id), eq(schema.designations.companyId, companyId))).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'designations', entityType: 'designation', entityId: id, action: 'UPDATE', oldValues: existing as any, newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Designation updated' };
  }
  async remove(companyId: string, id: string) {
    const existing = await this.db.query.designations.findFirst({ where: (d: any, { eq, and }: any) => and(eq(d.id, id), eq(d.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DESIGNATION_NOT_FOUND', message: 'Designation not found' });
    await this.db.update(schema.designations).set({ deletedAt: new Date() } as any).where(eq(schema.designations.id, id));
    return { success: true, data: null, message: 'Designation deleted' };
  }
}

