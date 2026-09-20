import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { eq, ilike, sql, and, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompaniesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(dto: PaginationDto) {
    const where = dto.search ? ilike(schema.companies.name, `%${dto.search}%`) : undefined;
    const total = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.companies)
      .where(where ? where : undefined)
      .then((r: any) => Number(r[0]?.count ?? 0));
    const rows = await this.db.query.companies.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (c: any, { desc, asc }: any) =>
        dto.sortBy ? (dto.sortOrder === 'desc' ? desc(c[dto.sortBy]) : asc(c[dto.sortBy])) : desc(c.createdAt),
    });
    return paginated(rows, total, dto, 'Companies fetched');
  }

  async get(id: string) {
    const row = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!row) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    return { success: true, data: row };
  }

  async create(dto: CreateCompanyDto, userId?: string) {
    try {
      const [row] = await this.db.insert(schema.companies).values({ ...dto, code: dto.code.toUpperCase() }).returning();
      if (userId) {
        await this.db.insert(schema.auditLogs).values({
          companyId: row.id,
          userId,
          module: 'companies',
          entityType: 'company',
          entityId: row.id,
          action: 'CREATE',
          newValues: dto as any,
        }).catch(()=>{});
      }
      return { success: true, data: row, message: 'Company created' };
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException({ code: 'COMPANY_CODE_EXISTS', message: 'Company code already exists' });
      throw e;
    }
  }

  async update(id: string, dto: UpdateCompanyDto, userId?: string) {
    const existing = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!existing) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    const [row] = await this.db.update(schema.companies).set({ ...dto, updatedAt: new Date() }).where(eq(schema.companies.id, id)).returning();
    if (userId) {
      await this.db.insert(schema.auditLogs).values({
        companyId: id,
        userId,
        module: 'companies',
        entityType: 'company',
        entityId: id,
        action: 'UPDATE',
        oldValues: existing as any,
        newValues: dto as any,
      }).catch(()=>{});
    }
    return { success: true, data: row, message: 'Company updated' };
  }

  async remove(id: string) {
    const row = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!row) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    await this.db.update(schema.companies).set({ deletedAt: new Date() } as any).where(eq(schema.companies.id, id));
    return { success: true, data: null, message: 'Company deleted' };
  }
}

