import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, sql, isNull } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateDocumentMasterDto, UpdateDocumentMasterDto } from './dto/create-document-master.dto';

@Injectable()
export class DocumentMasterService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, dto: PaginationDto) {
    const base = and(eq(schema.documentMaster.companyId, companyId), isNull(schema.documentMaster.deletedAt));
    const where = dto.search ? and(base, ilike(schema.documentMaster.name, `%${dto.search}%`)) : base;
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.documentMaster).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.documentMaster.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (d: any, { desc }: any) => desc(d.createdAt) });
    return paginated(rows, total, dto, 'Document master fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.documentMaster.findFirst({ where: (g: any, { eq, and }: any) => and(eq(g.id, id), eq(g.companyId, companyId)) });
    if (!row) throw new NotFoundException({ code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' });
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateDocumentMasterDto) {
    try {
      const [row] = await this.db.insert(schema.documentMaster).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      return { success: true, data: row, message: 'Document type created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException({ code: 'DOCUMENT_CODE_EXISTS', message: 'Code exists' }); throw e; }
  }

  async update(companyId: string, id: string, dto: UpdateDocumentMasterDto) {
    const existing = await this.db.query.documentMaster.findFirst({ where: (g: any, { eq, and }: any) => and(eq(g.id, id), eq(g.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' });
    const [row] = await this.db.update(schema.documentMaster).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.documentMaster.id, id), eq(schema.documentMaster.companyId, companyId))).returning();
    return { success: true, data: row, message: 'Document type updated' };
  }

  async remove(companyId: string, id: string) {
    const existing = await this.db.query.documentMaster.findFirst({ where: (g: any, { eq, and }: any) => and(eq(g.id, id), eq(g.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' });
    await this.db.update(schema.documentMaster).set({ deletedAt: new Date() } as any).where(eq(schema.documentMaster.id, id));
    return { success: true, data: null, message: 'Document type deleted' };
  }
}
