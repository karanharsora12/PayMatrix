import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto & { module?: string; entityType?: string }) {
    let where: any = eq(schema.auditLogs.companyId, companyId);
    if ((dto as any).module) where = and(where, eq(schema.auditLogs.module, (dto as any).module));
    if ((dto as any).entityType) where = and(where, eq(schema.auditLogs.entityType, (dto as any).entityType));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.auditLogs).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.auditLogs.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (a: any, { desc }: any) => desc(a.createdAt), with: { user: true } });
    return paginated(rows, total, dto, 'Audit logs fetched');
  }
}

