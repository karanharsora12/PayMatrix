import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { paginated } from "../common/dto/pagination.dto";
import { DRIZZLE } from "../database/database.module";
import * as schema from "../db/schema";
import {
  CreateEmailTemplateDto,
  DuplicateEmailTemplateDto,
  QueryEmailTemplateDto,
  TestEmailDto,
  UpdateEmailTemplateDto,
} from "./dto/email-template.dto";
import {
  DEFAULT_EMAIL_TEMPLATES,
  EMAIL_TEMPLATE_TYPES,
  EMAIL_VARIABLE_DEFINITIONS,
} from "./email-templates.constants";
import { EmailVariableResolver } from "./email-variable-resolver";
import { EmailSenderService } from "./email-sender.service";

@Injectable()
export class EmailTemplatesService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly emailSender: EmailSenderService,
  ) {}

  /**
   * Automatically populates standard default templates for a company if empty.
   */
  async seedDefaultsIfEmpty(
    companyId: string,
    userId?: string | null,
  ): Promise<void> {
    const existing = await this.db.query.emailTemplates.findFirst({
      where: eq(schema.emailTemplates.companyId, companyId),
    });
    if (!existing) {
      for (const tpl of DEFAULT_EMAIL_TEMPLATES) {
        try {
          const [inserted] = await this.db
            .insert(schema.emailTemplates)
            .values({
              companyId,
              templateCode: tpl.templateCode,
              templateName: tpl.templateName,
              templateType: tpl.templateType,
              description: tpl.description,
              subject: tpl.subject,
              bodyHtml: tpl.bodyHtml,
              status: "ACTIVE",
              isDefault: tpl.isDefault,
              createdBy: userId || null,
            })
            .returning();

          if (inserted) {
            await this.db.insert(schema.emailTemplateVersions).values({
              templateId: inserted.id,
              versionNo: 1,
              subject: tpl.subject,
              bodyHtml: tpl.bodyHtml,
              changeSummary: "Initial default system template",
              createdBy: userId || null,
            });
          }
        } catch {
          // Ignore duplicate code during concurrent initialization
        }
      }
    }
  }

  /**
   * Lists email templates with server-side filtering and pagination.
   */
  async list(companyId: string, query: QueryEmailTemplateDto, userId?: string) {
    // Seed standard defaults on first view if company has none
    await this.seedDefaultsIfEmpty(companyId, userId);

    const conditions: any[] = [eq(schema.emailTemplates.companyId, companyId)];

    if (query.templateType && query.templateType !== "ALL") {
      conditions.push(
        eq(schema.emailTemplates.templateType, query.templateType),
      );
    }
    if (query.status && (query.status as any) !== "ALL") {
      conditions.push(eq(schema.emailTemplates.status, query.status as any));
    }
    if (query.isDefault !== undefined && query.isDefault !== "ALL") {
      const boolVal = query.isDefault === true || query.isDefault === "true";
      conditions.push(eq(schema.emailTemplates.isDefault, boolVal));
    }
    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.emailTemplates.templateCode, term),
          ilike(schema.emailTemplates.templateName, term),
          ilike(schema.emailTemplates.subject, term),
          ilike(schema.emailTemplates.description, term),
        ),
      );
    }

    const where = and(...conditions);
    const countQuery = this.db
      .select({ count: sql`count(*)` })
      .from(schema.emailTemplates)
      .where(where);
    const total = await countQuery.then((r: any) => Number(r[0].count));

    const rows = await this.db.query.emailTemplates.findMany({
      where,
      limit: query.limit,
      offset: query.offset,
      orderBy: (t: any, { desc }: any) => [
        desc(t.isDefault),
        desc(t.updatedAt),
      ],
      with: {
        creator: {
          columns: { id: true, name: true, email: true },
        },
        updater: {
          columns: { id: true, name: true, email: true },
        },
      },
    });

    return paginated(
      rows,
      total,
      query,
      "Email templates fetched successfully",
    );
  }

  /**
   * Gets a single email template by ID with its revision versions.
   */
  async get(companyId: string, id: string) {
    const row = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
      with: {
        creator: {
          columns: { id: true, name: true, email: true },
        },
        updater: {
          columns: { id: true, name: true, email: true },
        },
        versions: {
          orderBy: (v: any, { desc }: any) => desc(v.versionNo),
          with: {
            creator: {
              columns: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException({
        code: "EMAIL_TEMPLATE_NOT_FOUND",
        message: "Email template not found",
      });
    }

    return {
      success: true,
      data: row,
    };
  }

  /**
   * Creates a new email template.
   */
  async create(
    companyId: string,
    dto: CreateEmailTemplateDto,
    userId?: string,
  ) {
    const code = dto.templateCode.trim().toUpperCase();

    // 1. Check duplicate code
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.companyId, companyId),
        eq(schema.emailTemplates.templateCode, code),
      ),
    });
    if (existing) {
      throw new ConflictException({
        code: "TEMPLATE_CODE_EXISTS",
        message: `Template code '${code}' already exists in this company. Please choose another code.`,
      });
    }

    // 2. Validate placeholders used in subject and body
    const validation = EmailVariableResolver.validateTemplateVariables(
      dto.templateType,
      dto.subject,
      dto.bodyHtml,
    );
    if (!validation.isValid) {
      throw new BadRequestException({
        code: "INVALID_TEMPLATE_VARIABLES",
        message: `Template contains unsupported placeholders for '${dto.templateType}': {{${validation.invalidVariables.join("}}, {{")}}}`,
        invalidVariables: validation.invalidVariables,
      });
    }

    // 3. Transactional insert and default flag management
    const result = await this.db.transaction(async (tx: any) => {
      // If marked as default, unset other defaults of this templateType
      if (dto.isDefault) {
        await tx
          .update(schema.emailTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(schema.emailTemplates.companyId, companyId),
              eq(schema.emailTemplates.templateType, dto.templateType),
              eq(schema.emailTemplates.isDefault, true),
            ),
          );
      }

      const [row] = await tx
        .insert(schema.emailTemplates)
        .values({
          companyId,
          templateCode: code,
          templateName: dto.templateName.trim(),
          templateType: dto.templateType.trim(),
          description: dto.description?.trim() || null,
          subject: dto.subject.trim(),
          bodyHtml: dto.bodyHtml.trim(),
          status: dto.status || "ACTIVE",
          isDefault: dto.isDefault ?? false,
          createdBy: userId || null,
          updatedBy: userId || null,
        })
        .returning();

      // Create Version 1
      await tx.insert(schema.emailTemplateVersions).values({
        templateId: row.id,
        versionNo: 1,
        subject: row.subject,
        bodyHtml: row.bodyHtml,
        changeSummary: "Initial creation",
        createdBy: userId || null,
      });

      return row;
    });

    // Record audit log
    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "email_templates",
          entityType: "email_template",
          entityId: result.id,
          action: "CREATE",
          newValues: result as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: result,
      message: "Email template created successfully",
    };
  }

  /**
   * Updates an existing email template and records version history if content changed.
   */
  async update(
    companyId: string,
    id: string,
    dto: UpdateEmailTemplateDto,
    userId?: string,
  ) {
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
    });

    if (!existing) {
      throw new NotFoundException({
        code: "EMAIL_TEMPLATE_NOT_FOUND",
        message: "Email template not found",
      });
    }

    const newCode = dto.templateCode
      ? dto.templateCode.trim().toUpperCase()
      : existing.templateCode;
    const newType = dto.templateType
      ? dto.templateType.trim()
      : existing.templateType;
    const newSubject =
      dto.subject !== undefined ? dto.subject.trim() : existing.subject;
    const newBodyHtml =
      dto.bodyHtml !== undefined ? dto.bodyHtml.trim() : existing.bodyHtml;

    // Check code collision
    if (newCode !== existing.templateCode) {
      const codeClash = await this.db.query.emailTemplates.findFirst({
        where: and(
          eq(schema.emailTemplates.companyId, companyId),
          eq(schema.emailTemplates.templateCode, newCode),
        ),
      });
      if (codeClash && codeClash.id !== id) {
        throw new ConflictException({
          code: "TEMPLATE_CODE_EXISTS",
          message: `Template code '${newCode}' already exists`,
        });
      }
    }

    // Validate variables
    const validation = EmailVariableResolver.validateTemplateVariables(
      newType,
      newSubject,
      newBodyHtml,
    );
    if (!validation.isValid) {
      throw new BadRequestException({
        code: "INVALID_TEMPLATE_VARIABLES",
        message: `Template contains unsupported placeholders for '${newType}': {{${validation.invalidVariables.join("}}, {{")}}}`,
        invalidVariables: validation.invalidVariables,
      });
    }

    const contentChanged =
      newSubject !== existing.subject || newBodyHtml !== existing.bodyHtml;

    const updated = await this.db.transaction(async (tx: any) => {
      // If set as default, clear others
      if (dto.isDefault === true && !existing.isDefault) {
        await tx
          .update(schema.emailTemplates)
          .set({ isDefault: false, updatedAt: new Date() })
          .where(
            and(
              eq(schema.emailTemplates.companyId, companyId),
              eq(schema.emailTemplates.templateType, newType),
              eq(schema.emailTemplates.isDefault, true),
            ),
          );
      }

      const [row] = await tx
        .update(schema.emailTemplates)
        .set({
          templateCode: newCode,
          templateName: dto.templateName
            ? dto.templateName.trim()
            : existing.templateName,
          templateType: newType,
          description:
            dto.description !== undefined
              ? dto.description?.trim() || null
              : existing.description,
          subject: newSubject,
          bodyHtml: newBodyHtml,
          status: dto.status || existing.status,
          isDefault:
            dto.isDefault !== undefined ? dto.isDefault : existing.isDefault,
          updatedBy: userId || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.emailTemplates.id, id),
            eq(schema.emailTemplates.companyId, companyId),
          ),
        )
        .returning();

      // Record new version in history if content modified
      if (contentChanged) {
        const lastVersion = await tx.query.emailTemplateVersions.findFirst({
          where: eq(schema.emailTemplateVersions.templateId, id),
          orderBy: (v: any, { desc }: any) => desc(v.versionNo),
        });
        const nextVer = (lastVersion?.versionNo || 1) + 1;

        await tx.insert(schema.emailTemplateVersions).values({
          templateId: id,
          versionNo: nextVer,
          subject: newSubject,
          bodyHtml: newBodyHtml,
          changeSummary: dto.changeSummary?.trim() || `Revision ${nextVer}`,
          createdBy: userId || null,
        });
      }

      return row;
    });

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "email_templates",
          entityType: "email_template",
          entityId: id,
          action: "UPDATE",
          oldValues: existing as any,
          newValues: updated as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: updated,
      message: "Email template updated successfully",
    };
  }

  /**
   * Duplicates an existing template with a new code and name.
   */
  async duplicate(
    companyId: string,
    id: string,
    dto: DuplicateEmailTemplateDto,
    userId?: string,
  ) {
    const source = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
    });

    if (!source) {
      throw new NotFoundException({
        code: "EMAIL_TEMPLATE_NOT_FOUND",
        message: "Source email template not found",
      });
    }

    const newCode = dto.templateCode.trim().toUpperCase();

    // Check collision
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.companyId, companyId),
        eq(schema.emailTemplates.templateCode, newCode),
      ),
    });
    if (existing) {
      throw new ConflictException({
        code: "TEMPLATE_CODE_EXISTS",
        message: `Template code '${newCode}' already exists`,
      });
    }

    const [cloned] = await this.db
      .insert(schema.emailTemplates)
      .values({
        companyId,
        templateCode: newCode,
        templateName: dto.templateName.trim(),
        templateType: source.templateType,
        description: source.description
          ? `(Copy of ${source.templateCode}) ${source.description}`
          : `Copy of ${source.templateName}`,
        subject: source.subject,
        bodyHtml: source.bodyHtml,
        status: "ACTIVE",
        isDefault: false, // Duplicates are never default automatically
        createdBy: userId || null,
        updatedBy: userId || null,
      })
      .returning();

    // Create initial version for copy
    await this.db.insert(schema.emailTemplateVersions).values({
      templateId: cloned.id,
      versionNo: 1,
      subject: cloned.subject,
      bodyHtml: cloned.bodyHtml,
      changeSummary: `Cloned from ${source.templateCode}`,
      createdBy: userId || null,
    });

    return {
      success: true,
      data: cloned,
      message: "Email template duplicated successfully",
    };
  }

  /**
   * Deletes an email template.
   */
  async remove(companyId: string, id: string, userId?: string) {
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
    });

    if (!existing) {
      throw new NotFoundException({
        code: "EMAIL_TEMPLATE_NOT_FOUND",
        message: "Email template not found",
      });
    }

    await this.db
      .delete(schema.emailTemplates)
      .where(
        and(
          eq(schema.emailTemplates.id, id),
          eq(schema.emailTemplates.companyId, companyId),
        ),
      );

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "email_templates",
          entityType: "email_template",
          entityId: id,
          action: "DELETE",
          oldValues: existing as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: null,
      message: "Email template deleted successfully",
    };
  }

  /**
   * Toggles active / inactive status of an email template.
   */
  async toggleStatus(companyId: string, id: string, userId?: string) {
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
    });

    if (!existing) {
      throw new NotFoundException("Template not found");
    }

    const nextStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const nextIsDefault =
      nextStatus === "INACTIVE" ? false : existing.isDefault;

    const [updated] = await this.db
      .update(schema.emailTemplates)
      .set({
        status: nextStatus,
        isDefault: nextIsDefault,
        updatedBy: userId || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.emailTemplates.id, id),
          eq(schema.emailTemplates.companyId, companyId),
        ),
      )
      .returning();

    return {
      success: true,
      data: updated,
      message: `Template status changed to ${nextStatus}`,
    };
  }

  /**
   * Sets a template as the default active template for its templateType.
   */
  async setDefault(companyId: string, id: string, userId?: string) {
    const existing = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.id, id),
        eq(schema.emailTemplates.companyId, companyId),
      ),
    });

    if (!existing) {
      throw new NotFoundException("Template not found");
    }

    if (existing.status !== "ACTIVE") {
      throw new BadRequestException({
        code: "TEMPLATE_INACTIVE",
        message:
          "Cannot set an inactive template as default. Please activate it first.",
      });
    }

    const updated = await this.db.transaction(async (tx: any) => {
      // Clear existing default
      await tx
        .update(schema.emailTemplates)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(
          and(
            eq(schema.emailTemplates.companyId, companyId),
            eq(schema.emailTemplates.templateType, existing.templateType),
            eq(schema.emailTemplates.isDefault, true),
          ),
        );

      const [row] = await tx
        .update(schema.emailTemplates)
        .set({
          isDefault: true,
          updatedAt: new Date(),
          updatedBy: userId || null,
        })
        .where(
          and(
            eq(schema.emailTemplates.id, id),
            eq(schema.emailTemplates.companyId, companyId),
          ),
        )
        .returning();

      return row;
    });

    return {
      success: true,
      data: updated,
      message: `'${existing.templateName}' is now the default template for ${existing.templateType}`,
    };
  }

  /**
   * Returns supported variable definitions, optionally filtered by templateType.
   */
  getVariables(templateType?: string) {
    if (templateType && templateType !== "ALL") {
      const vars =
        EmailVariableResolver.getAllowedVariablesForType(templateType);
      return {
        success: true,
        data: vars,
        templateTypes: EMAIL_TEMPLATE_TYPES,
      };
    }
    return {
      success: true,
      data: EMAIL_VARIABLE_DEFINITIONS,
      templateTypes: EMAIL_TEMPLATE_TYPES,
    };
  }

  /**
   * Dispatches a test email to verify SMTP and template rendering.
   */
  async sendTestEmail(
    companyId: string,
    templateId: string | null,
    dto: TestEmailDto,
    userId?: string,
  ) {
    let subject = dto.subject || "";
    let bodyHtml = dto.bodyHtml || "";

    // If templateId provided, load it
    if (templateId) {
      const tpl = await this.db.query.emailTemplates.findFirst({
        where: and(
          eq(schema.emailTemplates.id, templateId),
          eq(schema.emailTemplates.companyId, companyId),
        ),
      });
      if (tpl) {
        if (!subject) subject = tpl.subject;
        if (!bodyHtml) bodyHtml = tpl.bodyHtml;
      }
    }

    if (!subject || !bodyHtml) {
      throw new BadRequestException(
        "Subject and bodyHtml are required for test email",
      );
    }

    const renderedSubject = `[TEST EMAIL] ${subject}`;
    const renderedBody = bodyHtml;

    const targetEmail = dto.toEmail || dto.recipientEmail;
    if (!targetEmail) {
      throw new BadRequestException(
        "toEmail is required and must be a valid email address",
      );
    }

    const result = await this.emailSender.sendEmail({
      companyId,
      templateId,
      referenceType: "Test",
      referenceId: "TEST-RUN",
      toEmail: targetEmail,
      subject: renderedSubject,
      bodyHtml: renderedBody,
      userId,
    });

    return {
      success: result.success,
      data: result,
      message: result.message,
    };
  }

  /**
   * Returns paginated email log entries for audit and troubleshooting.
   */
  async listLogs(companyId: string, query: any) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const offset = (page - 1) * limit;

    const conditions: any[] = [eq(schema.emailLogs.companyId, companyId)];
    if (query.referenceType && query.referenceType !== "ALL") {
      conditions.push(eq(schema.emailLogs.referenceType, query.referenceType));
    }
    if (query.status && query.status !== "ALL") {
      conditions.push(eq(schema.emailLogs.status, query.status as any));
    }
    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(schema.emailLogs.toEmail, term),
          ilike(schema.emailLogs.subject, term),
          ilike(schema.emailLogs.referenceId, term),
        ),
      );
    }

    const where = and(...conditions);
    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.emailLogs)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.emailLogs.findMany({
      where,
      limit,
      offset,
      orderBy: (l: any, { desc }: any) => desc(l.createdAt),
      with: {
        template: {
          columns: { id: true, templateCode: true, templateName: true },
        },
      },
    });

    return paginated(
      rows,
      total,
      { page, pageSize: limit, offset } as any,
      "Email logs fetched",
    );
  }

  /**
   * Core generic rendering method invoked by Payslip, Leave, Attendance, etc.
   * Resolves active template and substitutes runtime business data.
   */
  async renderTemplate(
    companyId: string,
    templateCodeOrType: string,
    data: Record<string, any>,
  ): Promise<{
    template: any;
    subject: string;
    bodyHtml: string;
  }> {
    // 1. Try to find by explicit templateCode
    let template = await this.db.query.emailTemplates.findFirst({
      where: and(
        eq(schema.emailTemplates.companyId, companyId),
        eq(
          schema.emailTemplates.templateCode,
          templateCodeOrType.toUpperCase(),
        ),
        eq(schema.emailTemplates.status, "ACTIVE"),
      ),
    });

    // 2. If not found by code, try by templateType where isDefault = true
    if (!template) {
      template = await this.db.query.emailTemplates.findFirst({
        where: and(
          eq(schema.emailTemplates.companyId, companyId),
          eq(schema.emailTemplates.templateType, templateCodeOrType),
          eq(schema.emailTemplates.status, "ACTIVE"),
          eq(schema.emailTemplates.isDefault, true),
        ),
      });
    }

    // 3. If still not found, try any active template of that templateType
    if (!template) {
      template = await this.db.query.emailTemplates.findFirst({
        where: and(
          eq(schema.emailTemplates.companyId, companyId),
          eq(schema.emailTemplates.templateType, templateCodeOrType),
          eq(schema.emailTemplates.status, "ACTIVE"),
        ),
      });
    }

    // 4. Fallback to hardcoded default template if none configured in DB
    if (!template) {
      const fallback =
        DEFAULT_EMAIL_TEMPLATES.find(
          (t) =>
            t.templateCode === templateCodeOrType.toUpperCase() ||
            t.templateType.toLowerCase() === templateCodeOrType.toLowerCase(),
        ) || DEFAULT_EMAIL_TEMPLATES[0];

      template = {
        id: null,
        templateCode: fallback.templateCode,
        templateName: fallback.templateName,
        templateType: fallback.templateType,
        subject: fallback.subject,
        bodyHtml: fallback.bodyHtml,
      };
    }

    const resolvedSubject = EmailVariableResolver.resolve(
      template.subject,
      data,
    );
    const resolvedBody = EmailVariableResolver.resolve(template.bodyHtml, data);

    return {
      template,
      subject: resolvedSubject,
      bodyHtml: resolvedBody,
    };
  }
}
