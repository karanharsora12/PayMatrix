import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class AdvancesService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = eq(schema.employeeAdvances.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employeeAdvances).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employeeAdvances.findMany({ where, with: { employee: true }, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Advances fetched');
  }
  async create(companyId: string, dto: any, userId: string) {
    const [row] = await this.db.insert(schema.employeeAdvances).values({ ...dto, companyId, amount: dto.amount.toString() as any, status: 'PENDING', createdBy: userId }).returning();
    return { success: true, data: row, message: 'Advance created' };
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.employeeAdvances.findFirst({ where: (a: any, { eq, and }: any) => and(eq(a.id, id), eq(a.companyId, companyId)) });
    return { success: true, data: row };
  }
  async update(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.employeeAdvances).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.employeeAdvances.id, id), eq(schema.employeeAdvances.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Advance updated' };
  }
}

