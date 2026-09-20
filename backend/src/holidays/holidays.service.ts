import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';

@Injectable()
export class HolidaysService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto & { from?: string; to?: string }) {
    let where: any = eq(schema.holidays.companyId, companyId);
    if ((dto as any).from) where = and(where, gte(schema.holidays.holidayDate, (dto as any).from));
    if ((dto as any).to) where = and(where, lte(schema.holidays.holidayDate, (dto as any).to));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.holidays).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.holidays.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (h: any, { asc }: any) => asc(h.holidayDate) });
    return paginated(rows, total, dto, 'Holidays fetched');
  }
  async create(companyId: string, dto: any, userId: string) {
    const [row] = await this.db.insert(schema.holidays).values({ ...dto, companyId }).returning();
    return { success: true, data: row, message: 'Holiday created' };
  }
  async update(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.holidays).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.holidays.id, id), eq(schema.holidays.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('Holiday not found');
    return { success: true, data: row, message: 'Holiday updated' };
  }
  async remove(companyId: string, id: string) {
    await this.db.delete(schema.holidays).where(and(eq(schema.holidays.id, id), eq(schema.holidays.companyId, companyId)));
    return { success: true, data: null, message: 'Holiday deleted' };
  }
}

