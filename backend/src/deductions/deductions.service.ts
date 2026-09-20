import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class DeductionsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.employeeDeductions.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employeeDeductions).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employeeDeductions.findMany({ where, limit: dto.limit, offset: dto.offset, with: { employee: true, salaryComponent: true } });
    return paginated(rows, total, dto, 'Deductions fetched');
  }
  async create(companyId: string, dto: any, userId: string) {
    const [row] = await this.db.insert(schema.employeeDeductions).values({ ...dto, companyId }).returning();
    return { success: true, data: row, message: 'Deduction created' };
  }
  async update(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.employeeDeductions).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.employeeDeductions.id, id), eq(schema.employeeDeductions.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Deduction updated' };
  }
  async remove(companyId: string, id: string) {
    await this.db.delete(schema.employeeDeductions).where(and(eq(schema.employeeDeductions.id, id), eq(schema.employeeDeductions.companyId, companyId)));
    return { success: true, data: null, message: 'Deduction deleted' };
  }
}

