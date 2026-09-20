import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateBranchDto, UpdateBranchDto } from './dto/create-branch.dto';

@Injectable()
export class BranchesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, dto: PaginationDto) {
    const base = eq(schema.branches.companyId, companyId);
    const search = dto.search ? ilike(schema.branches.name, `%${dto.search}%`) : undefined;
    const where = search ? and(base, search) : base;
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.branches).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.branches.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (b: any, { desc }: any) => desc(b.createdAt),
    });
    // Add employee counts (optional)
    return paginated(rows, total, dto, 'Branches fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.branches.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.id, id), eq(b.companyId, companyId)) });
    if (!row) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Branch not found' });
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateBranchDto, userId: string) {
    try {
      const [row] = await this.db.insert(schema.branches).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'branches', entityType: 'branch', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Branch created' };
    } catch (e: any) {
      if (e.code === '23505') throw new ConflictException({ code: 'BRANCH_CODE_EXISTS', message: 'Branch code already exists in this company' });
      throw e;
    }
  }

  async update(companyId: string, id: string, dto: UpdateBranchDto, userId: string) {
    const existing = await this.db.query.branches.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.id, id), eq(b.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Branch not found' });
    const [row] = await this.db.update(schema.branches).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.branches.id, id), eq(schema.branches.companyId, companyId))).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'branches', entityType: 'branch', entityId: id, action: 'UPDATE', oldValues: existing as any, newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Branch updated' };
  }

  async remove(companyId: string, id: string) {
    const existing = await this.db.query.branches.findFirst({ where: (b: any, { eq, and }: any) => and(eq(b.id, id), eq(b.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'BRANCH_NOT_FOUND', message: 'Branch not found' });
    const empCount = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(and(eq(schema.employees.branchId, id), eq(schema.employees.companyId, companyId))).then((r: any) => Number(r[0].count));
    if (empCount > 0) throw new ConflictException({ code: 'BRANCH_HAS_EMPLOYEES', message: 'Cannot delete branch with active employees' });
    await this.db.update(schema.branches).set({ deletedAt: new Date() } as any).where(eq(schema.branches.id, id));
    return { success: true, data: null, message: 'Branch deleted' };
  }
}

