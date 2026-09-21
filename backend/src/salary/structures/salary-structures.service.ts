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
  CreateSalaryStructureDto,
  FilterSalaryStructureDto,
  PreviewStructureDto,
  StructureComponentInputDto,
  UpdateSalaryStructureDto,
} from './dto/salary-structure.dto';
import { SalaryCalculationService } from '../calculation/salary-calculation.service';
import { SafeFormulaEvaluator } from '../calculation/safe-formula-evaluator';

@Injectable()
export class SalaryStructuresService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private readonly calculationService: SalaryCalculationService,
  ) {}

  async list(companyId: string, query: FilterSalaryStructureDto) {
    let where: any = eq(schema.salaryStructures.companyId, companyId);

    if (query.isActive !== undefined) {
      where = and(where, eq(schema.salaryStructures.isActive, query.isActive));
    }
    if (query.search) {
      const s = `%${query.search}%`;
      where = and(
        where,
        or(ilike(schema.salaryStructures.code, s), ilike(schema.salaryStructures.name, s)),
      );
    }

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.salaryStructures)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.salaryStructures.findMany({
      where,
      with: {
        components: {
          with: {
            salaryComponent: true,
          },
        },
      },
      limit: query.limit,
      offset: query.offset,
      orderBy: (s: any, { asc }: any) => [asc(s.name)],
    });

    return paginated(rows, total, query, 'Salary structures fetched successfully');
  }

  async getById(companyId: string, id: string) {
    const row = await this.db.query.salaryStructures.findFirst({
      where: and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)),
      with: {
        components: {
          with: {
            salaryComponent: true,
          },
        },
      },
    });

    if (!row) {
      throw new NotFoundException({
        code: 'SALARY_STRUCTURE_NOT_FOUND',
        message: 'Salary structure not found',
      });
    }

    // Sort components by displayOrder
    if (row.components) {
      row.components.sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateSalaryStructureDto, userId: string) {
    const code = dto.code.trim().toUpperCase();

    // Check duplicate code
    const existing = await this.db.query.salaryStructures.findFirst({
      where: and(eq(schema.salaryStructures.companyId, companyId), eq(schema.salaryStructures.code, code)),
    });
    if (existing) {
      throw new ConflictException({
        code: 'SALARY_STRUCTURE_CODE_EXISTS',
        message: `Salary structure code '${code}' already exists in your company`,
      });
    }

    // Validate formula tokens if any
    for (const c of dto.components || []) {
      if (c.calculationType === 'FORMULA' && c.formula) {
        SafeFormulaEvaluator.tokenize(c.formula);
      }
    }

    const effectiveFrom = dto.effectiveFrom || new Date().toISOString().slice(0, 10);

    const structure = await this.db.transaction(async (tx: any) => {
      const [newStruct] = await tx
        .insert(schema.salaryStructures)
        .values({
          companyId,
          code,
          name: dto.name.trim(),
          description: dto.description?.trim(),
          effectiveFrom,
          effectiveTo: dto.effectiveTo || null,
          isActive: dto.isActive ?? true,
        })
        .returning();

      if (dto.components && dto.components.length > 0) {
        for (let i = 0; i < dto.components.length; i++) {
          const comp = dto.components[i];
          await tx.insert(schema.salaryStructureComponents).values({
            salaryStructureId: newStruct.id,
            salaryComponentId: comp.salaryComponentId,
            calculationType: comp.calculationType,
            amount: comp.amount != null ? comp.amount.toString() : null,
            percentage: comp.percentage != null ? comp.percentage.toString() : null,
            percentageOf: comp.percentageOf?.trim().toUpperCase(),
            formula: comp.formula?.trim(),
            minimumAmount: comp.minimumAmount != null ? comp.minimumAmount.toString() : null,
            maximumAmount: comp.maximumAmount != null ? comp.maximumAmount.toString() : null,
            displayOrder: comp.displayOrder ?? i,
          });
        }
      }

      return newStruct;
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'salary_structure',
        entityId: structure.id,
        action: 'CREATE',
        newValues: dto as any,
      })
      .catch(() => {});

    return this.getById(companyId, structure.id);
  }

  async update(companyId: string, id: string, dto: UpdateSalaryStructureDto, userId: string) {
    const existing = await this.db.query.salaryStructures.findFirst({
      where: and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)),
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SALARY_STRUCTURE_NOT_FOUND',
        message: 'Salary structure not found',
      });
    }

    await this.db.transaction(async (tx: any) => {
      const updateData: any = { updatedAt: new Date() };
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.description !== undefined) updateData.description = dto.description?.trim();
      if (dto.effectiveFrom !== undefined) updateData.effectiveFrom = dto.effectiveFrom;
      if (dto.effectiveTo !== undefined) updateData.effectiveTo = dto.effectiveTo;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      await tx
        .update(schema.salaryStructures)
        .set(updateData)
        .where(and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)));

      // If components are supplied, replace all existing structure components
      if (dto.components !== undefined) {
        await tx
          .delete(schema.salaryStructureComponents)
          .where(eq(schema.salaryStructureComponents.salaryStructureId, id));

        for (let i = 0; i < dto.components.length; i++) {
          const comp = dto.components[i];
          await tx.insert(schema.salaryStructureComponents).values({
            salaryStructureId: id,
            salaryComponentId: comp.salaryComponentId,
            calculationType: comp.calculationType,
            amount: comp.amount != null ? comp.amount.toString() : null,
            percentage: comp.percentage != null ? comp.percentage.toString() : null,
            percentageOf: comp.percentageOf?.trim().toUpperCase(),
            formula: comp.formula?.trim(),
            minimumAmount: comp.minimumAmount != null ? comp.minimumAmount.toString() : null,
            maximumAmount: comp.maximumAmount != null ? comp.maximumAmount.toString() : null,
            displayOrder: comp.displayOrder ?? i,
          });
        }
      }
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'salary_structure',
        entityId: id,
        action: 'UPDATE',
        oldValues: existing as any,
        newValues: dto as any,
      })
      .catch(() => {});

    return this.getById(companyId, id);
  }

  async delete(companyId: string, id: string, userId: string) {
    const existing = await this.db.query.salaryStructures.findFirst({
      where: and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)),
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'SALARY_STRUCTURE_NOT_FOUND',
        message: 'Salary structure not found',
      });
    }

    // Check if referenced in employee salary structures
    const empRefCount = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.employeeSalaryStructures)
      .where(eq(schema.employeeSalaryStructures.salaryStructureId, id))
      .then((r: any) => Number(r[0].count));

    if (empRefCount > 0) {
      throw new BadRequestException({
        code: 'SALARY_STRUCTURE_IN_USE',
        message: `Cannot delete structure '${existing.name}' because it is assigned to ${empRefCount} employee(s)`,
      });
    }

    await this.db.transaction(async (tx: any) => {
      await tx
        .delete(schema.salaryStructureComponents)
        .where(eq(schema.salaryStructureComponents.salaryStructureId, id));
      await tx
        .delete(schema.salaryStructures)
        .where(and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)));
    });

    await this.db
      .insert(schema.auditLogs)
      .values({
        userId,
        module: 'salary',
        entityType: 'salary_structure',
        entityId: id,
        action: 'DELETE',
        oldValues: existing as any,
      })
      .catch(() => {});

    return { success: true, data: null, message: 'Salary structure deleted successfully' };
  }

  // Nested component endpoints
  async listComponents(companyId: string, structureId: string) {
    const struct = await this.getById(companyId, structureId);
    return { success: true, data: struct.data.components ?? [] };
  }

  async addComponent(
    companyId: string,
    structureId: string,
    dto: StructureComponentInputDto,
    userId: string,
  ) {
    await this.getById(companyId, structureId);

    // Verify component belongs to company
    const comp = await this.db.query.salaryComponents.findFirst({
      where: and(
        eq(schema.salaryComponents.id, dto.salaryComponentId),
        eq(schema.salaryComponents.companyId, companyId),
      ),
    });
    if (!comp) {
      throw new NotFoundException({
        code: 'SALARY_COMPONENT_NOT_FOUND',
        message: 'Salary component not found in this company',
      });
    }

    const [row] = await this.db
      .insert(schema.salaryStructureComponents)
      .values({
        salaryStructureId: structureId,
        salaryComponentId: dto.salaryComponentId,
        calculationType: dto.calculationType,
        amount: dto.amount != null ? dto.amount.toString() : null,
        percentage: dto.percentage != null ? dto.percentage.toString() : null,
        percentageOf: dto.percentageOf?.trim().toUpperCase(),
        formula: dto.formula?.trim(),
        minimumAmount: dto.minimumAmount != null ? dto.minimumAmount.toString() : null,
        maximumAmount: dto.maximumAmount != null ? dto.maximumAmount.toString() : null,
        displayOrder: dto.displayOrder ?? 0,
      })
      .returning();

    return { success: true, data: row, message: 'Component added to structure' };
  }

  async updateComponent(
    companyId: string,
    structureId: string,
    componentId: string,
    dto: Partial<StructureComponentInputDto>,
  ) {
    await this.getById(companyId, structureId);

    const updateData: any = { updatedAt: new Date() };
    if (dto.calculationType !== undefined) updateData.calculationType = dto.calculationType;
    if (dto.amount !== undefined)
      updateData.amount = dto.amount != null ? dto.amount.toString() : null;
    if (dto.percentage !== undefined)
      updateData.percentage = dto.percentage != null ? dto.percentage.toString() : null;
    if (dto.percentageOf !== undefined) updateData.percentageOf = dto.percentageOf?.trim().toUpperCase();
    if (dto.formula !== undefined) updateData.formula = dto.formula?.trim();
    if (dto.minimumAmount !== undefined)
      updateData.minimumAmount = dto.minimumAmount != null ? dto.minimumAmount.toString() : null;
    if (dto.maximumAmount !== undefined)
      updateData.maximumAmount = dto.maximumAmount != null ? dto.maximumAmount.toString() : null;
    if (dto.displayOrder !== undefined) updateData.displayOrder = dto.displayOrder;

    const [row] = await this.db
      .update(schema.salaryStructureComponents)
      .set(updateData)
      .where(
        and(
          eq(schema.salaryStructureComponents.salaryStructureId, structureId),
          eq(schema.salaryStructureComponents.salaryComponentId, componentId),
        ),
      )
      .returning();

    if (!row) {
      throw new NotFoundException({
        code: 'STRUCTURE_COMPONENT_NOT_FOUND',
        message: 'Component not found in this structure',
      });
    }

    return { success: true, data: row, message: 'Structure component updated' };
  }

  async removeComponent(companyId: string, structureId: string, componentId: string) {
    await this.getById(companyId, structureId);

    await this.db
      .delete(schema.salaryStructureComponents)
      .where(
        and(
          eq(schema.salaryStructureComponents.salaryStructureId, structureId),
          eq(schema.salaryStructureComponents.salaryComponentId, componentId),
        ),
      );

    return { success: true, data: null, message: 'Component removed from structure' };
  }

  async preview(companyId: string, dto: PreviewStructureDto) {
    const res = await this.calculationService.previewStructure(companyId, dto.components);
    return { success: true, data: res };
  }
}
