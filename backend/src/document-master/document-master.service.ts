import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { and, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import {
  CreateDocumentMasterDto,
  UpdateDocumentMasterDto,
} from './dto/create-document-master.dto';

@Injectable()
export class DocumentMasterService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async stats(companyId: string) {
    const [total] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentMaster)
      .where(
        and(
          eq(schema.documentMaster.companyId, companyId),
          isNull(schema.documentMaster.deletedAt),
        ),
      );
    const [active] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentMaster)
      .where(
        and(
          eq(schema.documentMaster.companyId, companyId),
          eq(schema.documentMaster.isActive, true),
          isNull(schema.documentMaster.deletedAt),
        ),
      );
    const [required] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentMaster)
      .where(
        and(
          eq(schema.documentMaster.companyId, companyId),
          eq(schema.documentMaster.isRequired, true),
          isNull(schema.documentMaster.deletedAt),
        ),
      );
    const [typeCount] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentTypes)
      .where(
        and(
          eq(schema.documentTypes.companyId, companyId),
          eq(schema.documentTypes.isActive, true),
          isNull(schema.documentTypes.deletedAt),
        ),
      );
    return {
      success: true,
      data: {
        total: Number(total?.count ?? 0),
        active: Number(active?.count ?? 0),
        required: Number(required?.count ?? 0),
        documentTypes: Number(typeCount?.count ?? 0),
      },
    };
  }

  async list(companyId: string, dto: PaginationDto & Record<string, any>) {
    const conditions: any[] = [
      eq(schema.documentMaster.companyId, companyId),
      isNull(schema.documentMaster.deletedAt),
    ];

    if (dto.search) {
      const s = `%${dto.search}%`;
      conditions.push(
        or(
          ilike(schema.documentMaster.name, s),
          ilike(schema.documentMaster.code, s),
          ilike(schema.documentMaster.description, s),
        ),
      );
    }
    if (dto['documentTypeId'])
      conditions.push(
        eq(schema.documentMaster.documentTypeId, dto['documentTypeId']),
      );
    if (dto['isActive'] !== undefined && dto['isActive'] !== '')
      conditions.push(
        eq(schema.documentMaster.isActive, dto['isActive'] === 'true'),
      );
    if (dto['isRequired'] !== undefined && dto['isRequired'] !== '')
      conditions.push(
        eq(schema.documentMaster.isRequired, dto['isRequired'] === 'true'),
      );
    if (dto['isRepeatable'] !== undefined && dto['isRepeatable'] !== '')
      conditions.push(
        eq(schema.documentMaster.isRepeatable, dto['isRepeatable'] === 'true'),
      );

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentMaster)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.documentMaster.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      with: { documentType: true },
      orderBy: (d: any, { desc }: any) => desc(d.createdAt),
    });

    return paginated(rows, total, dto, 'Document master fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.documentMaster.findFirst({
      where: (g: any, { eq, and }: any) =>
        and(
          eq(g.id, id),
          eq(g.companyId, companyId),
          isNull(g.deletedAt),
        ),
      with: { documentType: true },
    });
    if (!row)
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
    return { success: true, data: row };
  }

  async create(
    companyId: string,
    dto: CreateDocumentMasterDto,
    userId: string,
  ) {
    // Validate documentTypeId if provided
    if (dto.documentTypeId) {
      await this._assertDocumentType(companyId, dto.documentTypeId);
    }
    try {
      const [row] = await this.db
        .insert(schema.documentMaster)
        .values({ ...dto, companyId, code: dto.code.toUpperCase() })
        .returning();
      const full = await this.db.query.documentMaster.findFirst({
        where: (d: any, { eq }: any) => eq(d.id, row.id),
        with: { documentType: true },
      });
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'document-master',
          entityType: 'document_master',
          entityId: row.id,
          action: 'CREATE',
          newValues: { ...dto, code: dto.code.toUpperCase() },
        })
        .catch(() => {});
      return {
        success: true,
        data: full,
        message: 'Document master created',
      };
    } catch (e: any) {
      if (e.code === '23505')
        throw new ConflictException({
          code: 'DOCUMENT_CODE_EXISTS',
          message: 'A document with this code already exists',
        });
      throw e;
    }
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateDocumentMasterDto,
    userId: string,
  ) {
    const existing = await this._assert(companyId, id);
    if (dto.documentTypeId) {
      await this._assertDocumentType(companyId, dto.documentTypeId);
    }
    try {
      const [row] = await this.db
        .update(schema.documentMaster)
        .set({
          ...dto,
          ...(dto.code && { code: dto.code.toUpperCase() }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.documentMaster.id, id),
            eq(schema.documentMaster.companyId, companyId),
          ),
        )
        .returning();
      const full = await this.db.query.documentMaster.findFirst({
        where: (d: any, { eq }: any) => eq(d.id, row.id),
        with: { documentType: true },
      });
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'document-master',
          entityType: 'document_master',
          entityId: id,
          action: 'UPDATE',
          oldValues: existing,
          newValues: dto,
        })
        .catch(() => {});
      return {
        success: true,
        data: full,
        message: 'Document master updated',
      };
    } catch (e: any) {
      if (e.code === '23505')
        throw new ConflictException({
          code: 'DOCUMENT_CODE_EXISTS',
          message: 'A document with this code already exists',
        });
      throw e;
    }
  }

  async activate(companyId: string, id: string, userId: string) {
    await this._assert(companyId, id);
    const [row] = await this.db
      .update(schema.documentMaster)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentMaster.id, id),
          eq(schema.documentMaster.companyId, companyId),
        ),
      )
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'document-master',
        entityType: 'document_master',
        entityId: id,
        action: 'RESTORE',
      })
      .catch(() => {});
    return { success: true, data: row, message: 'Document activated' };
  }

  async deactivate(companyId: string, id: string, userId: string) {
    await this._assert(companyId, id);
    const [row] = await this.db
      .update(schema.documentMaster)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentMaster.id, id),
          eq(schema.documentMaster.companyId, companyId),
        ),
      )
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'document-master',
        entityType: 'document_master',
        entityId: id,
        action: 'SOFT_DELETE',
      })
      .catch(() => {});
    return { success: true, data: row, message: 'Document deactivated' };
  }

  async duplicate(companyId: string, id: string, userId: string) {
    const existing = await this._assert(companyId, id);
    // Generate unique code
    const newCode = `${existing.code}_COPY_${Date.now().toString(36).toUpperCase()}`.slice(0, 30);
    try {
      const [row] = await this.db
        .insert(schema.documentMaster)
        .values({
          companyId,
          documentTypeId: existing.documentTypeId,
          code: newCode,
          name: `Copy of ${existing.name}`,
          description: existing.description,
          isRequired: existing.isRequired,
          isRepeatable: existing.isRepeatable,
          isActive: false, // Start inactive until HR reviews
          fields: existing.fields,
          templateContent: existing.templateContent,
        })
        .returning();
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'document-master',
          entityType: 'document_master',
          entityId: row.id,
          action: 'CREATE',
          newValues: { duplicatedFrom: id },
        })
        .catch(() => {});
      return { success: true, data: row, message: 'Document duplicated' };
    } catch (e: any) {
      if (e.code === '23505')
        throw new ConflictException({
          code: 'DOCUMENT_CODE_EXISTS',
          message: 'Duplicate code conflict; try again',
        });
      throw e;
    }
  }

  async remove(companyId: string, id: string, userId: string) {
    const existing = await this._assert(companyId, id);
    // Check if assignments exist
    const [usage] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.employeeDocumentAssignments)
      .where(
        and(
          eq(schema.employeeDocumentAssignments.documentId, id),
          isNull(schema.employeeDocumentAssignments.deletedAt),
        ),
      );
    if (Number(usage?.count) > 0) {
      // Prefer deactivation
      throw new BadRequestException({
        code: 'DOCUMENT_IN_USE',
        message: `This document has ${usage.count} assignment(s). Deactivate instead of deleting to preserve history.`,
      });
    }
    await this.db
      .update(schema.documentMaster)
      .set({ deletedAt: new Date() } as any)
      .where(
        and(
          eq(schema.documentMaster.id, id),
          eq(schema.documentMaster.companyId, companyId),
        ),
      );
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'document-master',
        entityType: 'document_master',
        entityId: id,
        action: 'DELETE',
        oldValues: existing,
      })
      .catch(() => {});
    return { success: true, data: null, message: 'Document deleted' };
  }

  private async _assert(companyId: string, id: string) {
    const row = await this.db.query.documentMaster.findFirst({
      where: (g: any, { eq, and }: any) =>
        and(eq(g.id, id), eq(g.companyId, companyId), isNull(g.deletedAt)),
    });
    if (!row)
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found',
      });
    return row;
  }

  private async _assertDocumentType(companyId: string, documentTypeId: string) {
    const docType = await this.db.query.documentTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(
          eq(t.id, documentTypeId),
          eq(t.companyId, companyId),
          isNull(t.deletedAt),
        ),
    });
    if (!docType)
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_NOT_FOUND',
        message: 'Document type not found or does not belong to this company',
      });
    if (!docType.isActive)
      throw new BadRequestException({
        code: 'DOCUMENT_TYPE_INACTIVE',
        message: 'Cannot use an inactive document type',
      });
    return docType;
  }
}
