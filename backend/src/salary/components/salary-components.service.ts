import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/database.module';
import * as schema from '../../db/schema';
import { paginated } from '../../common/dto/pagination.dto';
import {
  CreateSalaryComponentDto,
  FilterSalaryComponentDto,
  UpdateSalaryComponentDto,
} from './dto/salary-component.dto';
import { SafeFormulaEvaluator } from '../calculation/safe-formula-evaluator';

@Injectable()
export class SalaryComponentsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, query: FilterSalaryComponentDto) {
    let where: any = eq(schema.salaryComponents.companyId, companyId);

    if (query.componentType) {
      where = and(where, eq(schema.salaryComponents.componentType, query.componentType as any));
    }
    if (query.calculationType) {
      where = and(where, eq(schema.salaryComponents.calculationType, query.calculationType as any));
    }
    if (query.isActive !== undefined) {
      where = and(where, eq(schema.salaryComponents.isActive, query.isActive));
    }
    if (query.search) {
      const s = `%${query.search}%`;
      where = and(
        where,
        or(
          ilike(schema.salaryComponents.code, s),
          ilike(schema.salaryComponents.name, s),
          ilike(schema.salaryComponents.description, s),
        ),
      );
    }

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.salaryComponents)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.salaryComponents.findMany({
      where,
      limit: query.limit,
      offset: query.offset,
      orderBy: (c: any, { asc }: any) => [asc(c.displayOrder), asc(c.code)],
    });

    return paginated(rows, total, query, 'Salary components fetched successfully');
  }

  async getById(companyId: string, id: string) {
    const row = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)),
    });
    if (!row) {
      throw new NotFoundException({
        code: 'SALARY_COMPONENT_NOT_FOUND',
        message: 'Salary component not found',
      });
    }
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateSalaryComponentDto, userId: string) {
    const code = dto.code.trim().toUpperCase();

    // Check duplicate code
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.companyId, companyId), eq(schema.salaryComponents.code, code)),
    });
    if (existing) {
      throw new ConflictException({
        code: 'SALARY_COMPONENT_CODE_EXISTS',
        message: `Salary component code '${code}' already exists in your company`,
      });
    }

    // Validate formula if applicable
    if (dto.calculationType === 'FORMULA' && dto.formula) {
      SafeFormulaEvaluator.tokenize(dto.formula);
    }

    try {
      const [row] = await this.db
        .insert(schema.salaryComponents)
        .values({
          companyId,
          code,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          componentType: dto.componentType,
          calculationType: dto.calculationType,
          defaultAmount: dto.defaultAmount != null ? dto.defaultAmount.toString() : null,
          defaultPercentage: dto.defaultPercentage != null ? dto.defaultPercentage.toString() : null,
          calculationBasis: dto.calculationBasis?.trim().toUpperCase(),
          formula: dto.formula?.trim(),
          isTaxable: dto.isTaxable ?? true,
          isStatutory: dto.isStatutory ?? false,
          isRecurring: dto.isRecurring ?? true,
          displayOrder: dto.displayOrder ?? 0,
          isActive: dto.isActive ?? true,
        })
        .returning();

      // Audit log outside critical transaction
      await this.db
        .insert(schema.auditLogs)
        .values({
          userId,
          module: 'salary',
          entityType: 'salary_component',
          entityId: row.id,
          action: 'CREATE',
          newValues: row as any,
        })
        .catch(() => {});

      return { success: true, data: row, message: 'Salary component created successfully' };
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictException({
          code: 'SALARY_COMPONENT_CODE_EXISTS',
          message: `Salary component code '${code}' already exists`,
        });
      }
      throw err;
    }
  }

  async update(companyId: string, id: string, dto: UpdateSalaryComponentDto, userId: string) {
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)),
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SALARY_COMPONENT_NOT_FOUND',
        message: 'Salary component not found',
      });
    }

    if (dto.calculationType === 'FORMULA' && dto.formula) {
      SafeFormulaEvaluator.tokenize(dto.formula);
    }

    const updateValues: any = {
      updatedAt: new Date(),
    };

    if (dto.name !== undefined) updateValues.name = dto.name.trim();
    if (dto.description !== undefined) updateValues.description = dto.description?.trim();
    if (dto.componentType !== undefined) updateValues.componentType = dto.componentType;
    if (dto.calculationType !== undefined) updateValues.calculationType = dto.calculationType;
    if (dto.defaultAmount !== undefined)
      updateValues.defaultAmount = dto.defaultAmount != null ? dto.defaultAmount.toString() : null;
    if (dto.defaultPercentage !== undefined)
      updateValues.defaultPercentage =
        dto.defaultPercentage != null ? dto.defaultPercentage.toString() : null;
    if (dto.calculationBasis !== undefined)
      updateValues.calculationBasis = dto.calculationBasis?.trim().toUpperCase();
    if (dto.formula !== undefined) updateValues.formula = dto.formula?.trim();
    if (dto.isTaxable !== undefined) updateValues.isTaxable = dto.isTaxable;
    if (dto.isStatutory !== undefined) updateValues.isStatutory = dto.isStatutory;
    if (dto.isRecurring !== undefined) updateValues.isRecurring = dto.isRecurring;
    if (dto.displayOrder !== undefined) updateValues.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) updateValues.isActive = dto.isActive;

    const [updated] = await this.db
      .update(schema.salaryComponents)
      .set(updateValues)
      .where(and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)))
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'salary_component',
        entityId: id,
        action: 'UPDATE',
        oldValues: existing as any,
        newValues: updated as any,
      })
      .catch(() => {});

    return { success: true, data: updated, message: 'Salary component updated successfully' };
  }

  async delete(companyId: string, id: string, userId: string) {
    const existing = await this.db.query.salaryComponents.findFirst({
      where: and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)),
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SALARY_COMPONENT_NOT_FOUND',
        message: 'Salary component not found',
      });
    }

    // Check if referenced in structure components
    const structureRefCount = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.salaryStructureComponents)
      .where(eq(schema.salaryStructureComponents.salaryComponentId, id))
      .then((r: any) => Number(r[0].count));

    if (structureRefCount > 0) {
      throw new BadRequestException({
        code: 'SALARY_COMPONENT_IN_USE',
        message: `Cannot delete component '${existing.code}' because it is in use by ${structureRefCount} salary structure(s)`,
      });
    }

    await this.db
      .delete(schema.salaryComponents)
      .where(and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)));

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'salary_component',
        entityId: id,
        action: 'DELETE',
        oldValues: existing as any,
      })
      .catch(() => {});

    return { success: true, data: null, message: 'Salary component deleted successfully' };
  }
}
