import { ConflictException, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, filters: any, pagination: PaginationDto) {
    const conditions: any[] = [eq(schema.employees.companyId, companyId), sql`${schema.employees.deletedAt} IS NULL`];
    if (filters.search) {
      const s = `%${filters.search}%`;
      conditions.push(or(ilike(schema.employees.firstName, s), ilike(schema.employees.lastName, s), ilike(schema.employees.employeeCode, s), ilike(schema.employees.email, s)));
    }
    if (filters.departmentId) conditions.push(eq(schema.employees.departmentId, filters.departmentId));
    if (filters.branchId) conditions.push(eq(schema.employees.branchId, filters.branchId));
    if (filters.designationId) conditions.push(eq(schema.employees.designationId, filters.designationId));
    if (filters.status) conditions.push(eq(schema.employees.employmentStatus, filters.status as any));
    const where = and(...conditions);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.employees).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employees.findMany({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      with: { branch: true, department: true, designation: true, manager: true },
      orderBy: (e: any, { desc, asc }: any) => {
        const col = (e as any)[filters.sortBy ?? pagination.sortBy ?? 'createdAt'];
        if (col) return pagination.sortOrder === 'desc' || filters.sortOrder === 'desc' ? desc(col) : asc(col);
        return desc(e.createdAt);
      },
    });
    return paginated(rows, total, pagination, 'Employees fetched');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) => and(eq(e.id, id), eq(e.companyId, companyId)),
      with: { branch: true, department: true, designation: true, manager: true },
    });
    if (!row || row.deletedAt) throw new NotFoundException({ code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' });
    // Load docs/bank/addresses
    const [addresses, banks, docs] = await Promise.all([
      this.db.query.employeeAddresses.findMany({ where: (a: any, { eq }: any) => eq(a.employeeId, id) }),
      this.db.query.employeeBankAccounts.findMany({ where: (b: any, { eq }: any) => eq(b.employeeId, id) }),
      this.db.query.employeeDocuments.findMany({ where: (d: any, { eq }: any) => eq(d.employeeId, id) }),
    ]);
    return { success: true, data: { ...row, addresses, banks, docs } };
  }

  async create(companyId: string, dto: CreateEmployeeDto, userId: string) {
    // Validate FKs belong to same company
    if (dto.branchId) {
      const b = await this.db.query.branches.findFirst({ where: (x: any, { eq, and }: any) => and(eq(x.id, dto.branchId), eq(x.companyId, companyId)) });
      if (!b) throw new BadRequestException({ code: 'BRANCH_NOT_FOUND', message: 'Branch not found in company' });
    }
    if (dto.departmentId) {
      const d = await this.db.query.departments.findFirst({ where: (x: any, { eq, and }: any) => and(eq(x.id, dto.departmentId), eq(x.companyId, companyId)) });
      if (!d) throw new BadRequestException({ code: 'DEPARTMENT_NOT_FOUND', message: 'Department not found in company' });
    }
    if (dto.designationId) {
      const des = await this.db.query.designations.findFirst({ where: (x: any, { eq, and }: any) => and(eq(x.id, dto.designationId), eq(x.companyId, companyId)) });
      if (!des) throw new BadRequestException({ code: 'DESIGNATION_NOT_FOUND', message: 'Designation not found' });
    }
    // Transaction: employee + audit
    try {
      const [row] = await this.db.insert(schema.employees).values({ ...dto, companyId, employeeCode: dto.employeeCode.toUpperCase(), joiningDate: dto.joiningDate as any }).returning();
      await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'employees', entityType: 'employee', entityId: row.id, action: 'CREATE', newValues: dto as any }).catch(()=>{});
      return { success: true, data: row, message: 'Employee created' };
    } catch (e: any) {
      if (e.code === '23505') throw new ConflictException({ code: 'EMPLOYEE_ALREADY_EXISTS', message: 'Employee code or email already exists in this company' });
      throw e;
    }
  }

  async update(companyId: string, id: string, dto: UpdateEmployeeDto, userId: string) {
    const existing = await this.db.query.employees.findFirst({ where: (e: any, { eq, and }: any) => and(eq(e.id, id), eq(e.companyId, companyId)) });
    if (!existing || existing.deletedAt) throw new NotFoundException({ code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' });
    const [row] = await this.db.update(schema.employees).set({ ...dto, updatedAt: new Date() } as any).where(and(eq(schema.employees.id, id), eq(schema.employees.companyId, companyId))).returning();
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'employees', entityType: 'employee', entityId: id, action: 'UPDATE', oldValues: existing as any, newValues: dto as any }).catch(()=>{});
    return { success: true, data: row, message: 'Employee updated' };
  }

  async remove(companyId: string, id: string, userId: string) {
    const existing = await this.db.query.employees.findFirst({ where: (e: any, { eq, and }: any) => and(eq(e.id, id), eq(e.companyId, companyId)) });
    if (!existing) throw new NotFoundException({ code: 'EMPLOYEE_NOT_FOUND', message: 'Employee not found' });
    await this.db.update(schema.employees).set({ deletedAt: new Date(), isActive: false } as any).where(eq(schema.employees.id, id));
    await this.db.insert(schema.auditLogs).values({ companyId, userId, module: 'employees', entityType: 'employee', entityId: id, action: 'SOFT_DELETE', oldValues: existing as any }).catch(()=>{});
    return { success: true, data: null, message: 'Employee deleted' };
  }

  // Additional: profile history, salary, attendance etc. stubs delegate to respective services
  async history(companyId: string, id: string) {
    const logs = await this.db.query.auditLogs.findMany({ where: (a: any, { eq, and }: any) => and(eq(a.entityId, id), eq(a.companyId, companyId)), orderBy: (a: any, { desc }: any) => desc(a.createdAt), limit: 50 });
    return { success: true, data: logs };
  }
}

