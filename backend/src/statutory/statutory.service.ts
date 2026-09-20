import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class StatutoryService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async rules(companyId: string, dto: PaginationDto) {
    const where = eq(schema.statutoryRules.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.statutoryRules).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.statutoryRules.findMany({ where, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Statutory rules fetched');
  }
  async createRule(companyId: string, dto: any) {
    const [row] = await this.db.insert(schema.statutoryRules).values({ ...dto, companyId }).returning();
    return { success: true, data: row, message: 'Rule created' };
  }
  async updateRule(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.statutoryRules).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.statutoryRules.id, id), eq(schema.statutoryRules.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Rule updated' };
  }
  async details(employeeId: string) {
    const row = await this.db.query.employeeStatutoryDetails.findFirst({ where: (d: any, { eq }: any) => eq(d.employeeId, employeeId) });
    return { success: true, data: row };
  }
  async upsertDetails(employeeId: string, dto: any) {
    const ex = await this.db.query.employeeStatutoryDetails.findFirst({ where: (d: any, { eq }: any) => eq(d.employeeId, employeeId) });
    if (ex) {
      const [row] = await this.db.update(schema.employeeStatutoryDetails).set({ ...dto, updatedAt: new Date() }).where(eq(schema.employeeStatutoryDetails.employeeId, employeeId)).returning();
      return { success: true, data: row, message: 'Statutory details updated' };
    }
    const [row] = await this.db.insert(schema.employeeStatutoryDetails).values({ employeeId, ...dto }).returning();
    return { success: true, data: row, message: 'Statutory details created' };
  }
  async declarations(employeeId: string) {
    const rows = await this.db.query.employeeTaxDeclarations.findMany({ where: (d: any, { eq }: any) => eq(d.employeeId, employeeId), orderBy: (d: any, { desc }: any) => desc(d.financialYear) });
    return { success: true, data: rows };
  }
}

