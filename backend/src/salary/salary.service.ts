import { BadRequestException, Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';

@Injectable()
export class SalaryService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  // Components
  async listComponents(companyId: string, dto: PaginationDto & { type?: string }) {
    let where: any = eq(schema.salaryComponents.companyId, companyId);
    if ((dto as any).type) where = and(where, eq(schema.salaryComponents.componentType, (dto as any).type as any));
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.salaryComponents).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.salaryComponents.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (c: any, { asc }: any) => asc(c.displayOrder) });
    return paginated(rows, total, dto, 'Salary components fetched');
  }
  async createComponent(companyId: string, dto: any, userId: string) {
    try {
      const [row] = await this.db.insert(schema.salaryComponents).values({ ...dto, companyId, code: dto.code.toUpperCase() }).returning();
      return { success: true, data: row, message: 'Component created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException('Component code exists'); throw e; }
  }
  async updateComponent(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.salaryComponents).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('Component not found');
    return { success: true, data: row, message: 'Component updated' };
  }
  async deleteComponent(companyId: string, id: string) {
    await this.db.delete(schema.salaryComponents).where(and(eq(schema.salaryComponents.id, id), eq(schema.salaryComponents.companyId, companyId)));
    return { success: true, data: null, message: 'Component deleted' };
  }

  // Structures
  async listStructures(companyId: string, dto: PaginationDto) {
    const where = eq(schema.salaryStructures.companyId, companyId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.salaryStructures).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.salaryStructures.findMany({ where, with: { components: { with: { salaryComponent: true } } }, limit: dto.limit, offset: dto.offset });
    return paginated(rows, total, dto, 'Salary structures fetched');
  }
  async getStructure(companyId: string, id: string) {
    const row = await this.db.query.salaryStructures.findFirst({ where: (s: any, { eq, and }: any) => and(eq(s.id, id), eq(s.companyId, companyId)), with: { components: { with: { salaryComponent: true } } } });
    if (!row) throw new NotFoundException({ code: 'SALARY_STRUCTURE_NOT_FOUND', message: 'Structure not found' });
    return { success: true, data: row };
  }
  async createStructure(companyId: string, dto: any, userId: string) {
    return this.db.transaction(async (tx: any) => {
      const [structure] = await tx.insert(schema.salaryStructures).values({ companyId, code: dto.code.toUpperCase(), name: dto.name, description: dto.description, effectiveFrom: dto.effectiveFrom, effectiveTo: dto.effectiveTo, isActive: dto.isActive ?? true }).returning();
      if (dto.components?.length) {
        for (const c of dto.components) {
          await tx.insert(schema.salaryStructureComponents).values({ salaryStructureId: structure.id, salaryComponentId: c.salaryComponentId, calculationType: c.calculationType, amount: c.amount?.toString(), percentage: c.percentage?.toString(), formula: c.formula, displayOrder: c.displayOrder ?? 0 });
        }
      }
      const full = await tx.query.salaryStructures.findFirst({ where: (s: any, { eq }: any) => eq(s.id, structure.id), with: { components: { with: { salaryComponent: true } } } });
      return { success: true, data: full, message: 'Structure created' };
    });
  }
  async updateStructure(companyId: string, id: string, dto: any) {
    const [row] = await this.db.update(schema.salaryStructures).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('Structure not found');
    return { success: true, data: row, message: 'Structure updated' };
  }
  async deleteStructure(companyId: string, id: string) {
    await this.db.delete(schema.salaryStructures).where(and(eq(schema.salaryStructures.id, id), eq(schema.salaryStructures.companyId, companyId)));
    return { success: true, data: null, message: 'Structure deleted' };
  }

  // Preview
  async preview(dto: any) {
    // dto: { salaryStructureId, overrides?: [{ salaryComponentId, amount, percentage }] }
    const structure: any = await this.db.query.salaryStructures.findFirst({ where: (s: any, { eq }: any) => eq(s.id, dto.salaryStructureId), with: { components: { with: { salaryComponent: true } } } });
    if (!structure) throw new NotFoundException('Structure not found');
    const overrides = new Map((dto.overrides ?? []).map((o: any) => [o.salaryComponentId, o]));
    let basic = 0;
    const earnings: any[] = [];
    const deductions: any[] = [];
    const employerContributions: any[] = [];

    // Simple calc: resolve FIXED / PERCENTAGE based on basic
    for (const sc of structure.components as any[]) {
      const ov: any = overrides.get((sc as any).salaryComponentId);
      const comp: any = (sc as any).salaryComponent;
      let amount = 0;
      if (ov?.amount != null) amount = Number((ov as any).amount);
      else if ((sc as any).calculationType === 'FIXED') amount = Number((sc as any).amount ?? 0);
      else if ((sc as any).calculationType === 'PERCENTAGE') {
        const pct = (ov as any)?.percentage ?? (sc as any).percentage ?? 0;
        amount = (basic * Number(pct)) / 100;
      }
      if (comp.code === 'BASIC') basic = amount;
      const entry = { componentId: comp.id, code: comp.code, name: comp.name, type: comp.componentType, calculationType: sc.calculationType, amount: amount.toFixed(2) };
      if (comp.componentType === 'EARNING') earnings.push(entry);
      else if (comp.componentType === 'DEDUCTION') deductions.push(entry);
      else employerContributions.push(entry);
    }
    const gross = earnings.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const totalDeductions = deductions.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const net = gross - totalDeductions;
    return { success: true, data: { earnings, deductions, employerContributions, grossSalary: gross.toFixed(2), totalDeductions: totalDeductions.toFixed(2), netSalary: net.toFixed(2) } };
  }

  // Employee salary
  async employeeSalary(employeeId: string) {
    const rows = await this.db.query.employeeSalaryStructures.findMany({ where: (e: any, { eq }: any) => eq(e.employeeId, employeeId), with: { salaryStructure: true, components: { with: { salaryComponent: true } } }, orderBy: (e: any, { desc }: any) => desc(e.effectiveFrom) });
    return { success: true, data: rows[0] ?? null };
  }
  async employeeHistory(employeeId: string) {
    const rows = await this.db.query.employeeSalaryStructures.findMany({ where: (e: any, { eq }: any) => eq(e.employeeId, employeeId), with: { salaryStructure: true }, orderBy: (e: any, { desc }: any) => desc(e.effectiveFrom) });
    return { success: true, data: rows };
  }
  async assignSalary(employeeId: string, dto: any, userId: string) {
    // Validate effective date not overlapping, close previous
    const existing = await this.db.query.employeeSalaryStructures.findMany({ where: (e: any, { eq }: any) => eq(e.employeeId, employeeId), orderBy: (e: any, { desc }: any) => desc(e.effectiveFrom) });
    if (existing.length && new Date(dto.effectiveFrom) <= new Date(existing[0].effectiveFrom)) throw new BadRequestException({ code: 'SALARY_INVALID_EFFECTIVE_DATE', message: 'Effective date must be after last assignment' });
    return this.db.transaction(async (tx: any) => {
      if (existing.length) await tx.update(schema.employeeSalaryStructures).set({ effectiveTo: dto.effectiveFrom, updatedAt: new Date() }).where(eq(schema.employeeSalaryStructures.id, existing[0].id));
      const [row] = await tx.insert(schema.employeeSalaryStructures).values({ employeeId, salaryStructureId: dto.salaryStructureId, effectiveFrom: dto.effectiveFrom, effectiveTo: dto.effectiveTo, grossSalary: dto.grossSalary?.toString(), annualCtc: dto.annualCtc?.toString(), status: 'ACTIVE' }).returning();
      if (dto.components?.length) {
        for (const c of dto.components) await tx.insert(schema.employeeSalaryComponents).values({ employeeSalaryStructureId: row.id, salaryComponentId: c.salaryComponentId, calculationType: c.calculationType, amount: c.amount?.toString(), percentage: c.percentage?.toString(), formula: c.formula });
      }
      await tx.insert(schema.auditLogs).values({ userId, module: 'salary', entityType: 'employee_salary', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Salary assigned' };
    });
  }
}

