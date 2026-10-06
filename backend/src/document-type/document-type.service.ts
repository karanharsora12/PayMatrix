import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { and, eq, ilike, isNull, sql } from "drizzle-orm";
import { DRIZZLE } from "../database/database.module";
import * as schema from "../db/schema";
import { PaginationDto, paginated } from "../common/dto/pagination.dto";
import {
  CreateDocumentTypeDto,
  UpdateDocumentTypeDto,
} from "./dto/create-document-type.dto";

const STANDARD_VARIABLES = [
  {
    label: "Employee Name",
    variable: "EmployeeName",
    type: "Text",
    required: true,
    order: 1,
  },
  {
    label: "Employee Code",
    variable: "EmployeeCode",
    type: "Text",
    required: true,
    order: 2,
  },
  {
    label: "Date of Joining",
    variable: "DateOfJoining",
    type: "Date",
    required: true,
    order: 3,
  },
  {
    label: "Designation",
    variable: "Designation",
    type: "Text",
    required: true,
    order: 4,
  },
  {
    label: "Department",
    variable: "Department",
    type: "Text",
    required: true,
    order: 5,
  },
  {
    label: "Company Name",
    variable: "CompanyName",
    type: "Text",
    required: true,
    order: 6,
  },
  {
    label: "Current Date",
    variable: "CurrentDate",
    type: "Date",
    required: true,
    order: 7,
  },
];

const TYPE_SPECIFIC_VARIABLES: Record<string, any[]> = {
  SALARY: [
    {
      label: "Basic Salary",
      variable: "BasicSalary",
      type: "Currency",
      required: true,
      order: 8,
    },
    {
      label: "Gross Salary",
      variable: "GrossSalary",
      type: "Currency",
      required: true,
      order: 9,
    },
    {
      label: "Effective Date",
      variable: "EffectiveDate",
      type: "Date",
      required: true,
      order: 10,
    },
  ],
  PROMOTION: [
    {
      label: "Old Designation",
      variable: "OldDesignation",
      type: "Text",
      required: true,
      order: 8,
    },
    {
      label: "New Designation",
      variable: "NewDesignation",
      type: "Text",
      required: true,
      order: 9,
    },
    {
      label: "Effective Date",
      variable: "EffectiveDate",
      type: "Date",
      required: true,
      order: 10,
    },
  ],
};

@Injectable()
export class DocumentTypeService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, dto: PaginationDto) {
    const base = and(
      eq(schema.documentTypes.companyId, companyId),
      isNull(schema.documentTypes.deletedAt),
    );
    const where = dto.search
      ? and(base, ilike(schema.documentTypes.name, `%${dto.search}%`))
      : base;

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentTypes)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.documentTypes.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (d: any, { asc, desc }: any) =>
        d.displayOrder ? asc(d.displayOrder) : desc(d.createdAt),
    });

    // Attach document count per type
    const typesWithCount = await Promise.all(
      rows.map(async (row: any) => {
        const [countResult] = await this.db
          .select({ count: sql`count(*)` })
          .from(schema.documentMaster)
          .where(
            and(
              eq(schema.documentMaster.documentTypeId, row.id),
              isNull(schema.documentMaster.deletedAt),
            ),
          );
        return { ...row, documentCount: Number(countResult?.count ?? 0) };
      }),
    );

    return paginated(typesWithCount, total, dto, "Document types fetched");
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.documentTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(eq(t.id, id), eq(t.companyId, companyId), isNull(t.deletedAt)),
    });
    if (!row)
      throw new NotFoundException({
        code: "DOCUMENT_TYPE_NOT_FOUND",
        message: "Document type not found",
      });
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateDocumentTypeDto, userId: string) {
    try {
      const [row] = await this.db
        .insert(schema.documentTypes)
        .values({ ...dto, companyId, code: dto.code.toUpperCase() })
        .returning();
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "document-master",
          entityType: "document_type",
          entityId: row.id,
          action: "CREATE",
          newValues: dto,
        })
        .catch(() => {});
      return { success: true, data: row, message: "Document type created" };
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException({
          code: "DOCUMENT_TYPE_CODE_EXISTS",
          message: "A document type with this code already exists",
        });
      throw e;
    }
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateDocumentTypeDto,
    userId: string,
  ) {
    const existing = await this._assert(companyId, id);
    try {
      const [row] = await this.db
        .update(schema.documentTypes)
        .set({
          ...dto,
          ...(dto.code && { code: dto.code.toUpperCase() }),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.documentTypes.id, id),
            eq(schema.documentTypes.companyId, companyId),
          ),
        )
        .returning();
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "document-master",
          entityType: "document_type",
          entityId: id,
          action: "UPDATE",
          oldValues: existing,
          newValues: dto,
        })
        .catch(() => {});
      return { success: true, data: row, message: "Document type updated" };
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException({
          code: "DOCUMENT_TYPE_CODE_EXISTS",
          message: "A document type with this code already exists",
        });
      throw e;
    }
  }

  async activate(companyId: string, id: string, userId: string) {
    await this._assert(companyId, id);
    const [row] = await this.db
      .update(schema.documentTypes)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentTypes.id, id),
          eq(schema.documentTypes.companyId, companyId),
        ),
      )
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "document-master",
        entityType: "document_type",
        entityId: id,
        action: "RESTORE",
      })
      .catch(() => {});
    return { success: true, data: row, message: "Document type activated" };
  }

  async deactivate(companyId: string, id: string, userId: string) {
    await this._assert(companyId, id);
    const [row] = await this.db
      .update(schema.documentTypes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(schema.documentTypes.id, id),
          eq(schema.documentTypes.companyId, companyId),
        ),
      )
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "document-master",
        entityType: "document_type",
        entityId: id,
        action: "SOFT_DELETE",
      })
      .catch(() => {});
    return { success: true, data: row, message: "Document type deactivated" };
  }

  async remove(companyId: string, id: string, userId: string) {
    const existing = await this._assert(companyId, id);
    // Check if any active documents use this type
    const [usageResult] = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.documentMaster)
      .where(
        and(
          eq(schema.documentMaster.documentTypeId, id),
          isNull(schema.documentMaster.deletedAt),
        ),
      );
    if (Number(usageResult?.count) > 0) {
      throw new BadRequestException({
        code: "DOCUMENT_TYPE_IN_USE",
        message: `Cannot delete: ${usageResult.count} document(s) use this type. Deactivate instead.`,
      });
    }
    await this.db
      .update(schema.documentTypes)
      .set({ deletedAt: new Date() } as any)
      .where(
        and(
          eq(schema.documentTypes.id, id),
          eq(schema.documentTypes.companyId, companyId),
        ),
      );
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "document-master",
        entityType: "document_type",
        entityId: id,
        action: "DELETE",
        oldValues: existing,
      })
      .catch(() => {});
    return { success: true, data: null, message: "Document type deleted" };
  }

  async getVariables(companyId: string, id: string) {
    const row = await this._assert(companyId, id);
    let variables = [...STANDARD_VARIABLES];

    // Check if code matches any specific variables
    for (const [key, vars] of Object.entries(TYPE_SPECIFIC_VARIABLES)) {
      if (row.code.includes(key)) {
        variables = [...variables, ...vars];
      }
    }

    return {
      success: true,
      data: variables,
      message: "Variables fetched successfully",
    };
  }

  private async _assert(companyId: string, id: string) {
    const row = await this.db.query.documentTypes.findFirst({
      where: (t: any, { eq, and }: any) =>
        and(eq(t.id, id), eq(t.companyId, companyId), isNull(t.deletedAt)),
    });
    if (!row)
      throw new NotFoundException({
        code: "DOCUMENT_TYPE_NOT_FOUND",
        message: "Document type not found",
      });
    return row;
  }
}
