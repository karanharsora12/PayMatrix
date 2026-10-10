import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { DRIZZLE } from "../database/database.module";
import * as schema from "../db/schema";
import { PaginationDto, paginated } from "../common/dto/pagination.dto";
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from "./dto/create-employee.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class EmployeesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, filters: any, pagination: PaginationDto) {
    const conditions: any[] = [
      eq(schema.employees.companyId, companyId),
      sql`${schema.employees.deletedAt} IS NULL`,
    ];
    if (filters.search) {
      const s = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(schema.employees.firstName, s),
          ilike(schema.employees.lastName, s),
          ilike(schema.employees.employeeCode, s),
          ilike(schema.employees.email, s),
        ),
      );
    }
    if (filters.departmentId)
      conditions.push(eq(schema.employees.departmentId, filters.departmentId));
    if (filters.branchId)
      conditions.push(eq(schema.employees.branchId, filters.branchId));
    if (filters.designationId)
      conditions.push(
        eq(schema.employees.designationId, filters.designationId),
      );
    if (filters.status)
      conditions.push(
        eq(schema.employees.employmentStatus, filters.status as any),
      );
    const where = and(...conditions);
    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.employees)
      .where(where)
      .then((r: any) => Number(r[0].count));
    const rows = await this.db.query.employees.findMany({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      with: {
        branch: true,
        department: true,
        designation: true,
        manager: true,
      },
      orderBy: (e: any, { desc, asc }: any) => {
        const col = (e as any)[
          filters.sortBy ?? pagination.sortBy ?? "createdAt"
        ];
        if (col)
          return pagination.sortOrder === "desc" || filters.sortOrder === "desc"
            ? desc(col)
            : asc(col);
        return desc(e.createdAt);
      },
    });
    return paginated(rows, total, pagination, "Employees fetched");
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, id), eq(e.companyId, companyId)),
      with: {
        branch: true,
        department: true,
        designation: true,
        manager: true,
        company: true,
      },
    });
    if (!row || row.deletedAt)
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });

    let user = await this.db.query.users.findFirst({
      where: (u: any, { eq, and }: any) =>
        and(eq(u.employeeId, id), eq(u.companyId, companyId)),
    });

    if (!user && row.email) {
      user = await this.db.query.users.findFirst({
        where: (u: any, { eq, and }: any) =>
          and(eq(u.email, row.email), eq(u.companyId, companyId)),
      });
      if (user && !user.employeeId) {
        await this.db
          .update(schema.users)
          .set({ employeeId: id })
          .where(eq(schema.users.id, user.id));
      }
    }

    let userRoles: any[] = [];
    if (user) {
      const ur = await this.db.query.userRoles.findMany({
        where: (r: any, { eq }: any) => eq(r.userId, user.id),
        with: { role: true },
      });
      userRoles = ur.map((x: any) => ({
        id: x.roleId,
        roleId: x.roleId,
        name: x.role?.name,
        slug: x.role?.slug,
      }));
    }
    const resolvedRoleId = userRoles[0]?.id || null;

    const address = await this.db.query.employeeAddresses.findFirst({
      where: (a: any, { eq }: any) => eq(a.employeeId, id),
    });

    const bankAccount = await this.db.query.employeeBankAccounts.findFirst({
      where: (b: any, { eq }: any) => eq(b.employeeId, id),
    });

    const groupMember = await this.db.query.employeeGroupMembers.findFirst({
      where: (m: any, { eq }: any) => eq(m.employeeId, id),
    });

    return {
      success: true,
      data: {
        ...row,
        user: user
          ? {
              ...user,
              roles: userRoles,
              roleId: resolvedRoleId,
              role: userRoles[0] || null,
            }
          : null,
        roleId: resolvedRoleId,
        address: address?.addressLine1 || "",
        bankName: bankAccount?.bankName || "",
        accountNumber: bankAccount?.accountNumber || "",
        ifscCode: bankAccount?.ifscCode || "",
        accountHolder: bankAccount?.accountHolderName || "",
        employeeGroupId: groupMember?.employeeGroupId || "",
      },
    };
  }

  // ── Aggregated Profile ──────────────────────────────────────────────────────
  async profile(companyId: string, id: string) {
    const employee = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, id), eq(e.companyId, companyId)),
      with: {
        branch: true,
        department: true,
        designation: true,
        manager: true,
        company: true,
      },
    });
    if (!employee || employee.deletedAt)
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });

    const [addresses, bankAccounts, documents, auditLogs] = await Promise.all([
      this.db.query.employeeAddresses.findMany({
        where: (a: any, { eq }: any) => eq(a.employeeId, id),
        orderBy: (a: any, { desc }: any) => desc(a.createdAt),
      }),
      this.db.query.employeeBankAccounts.findMany({
        where: (b: any, { eq }: any) => eq(b.employeeId, id),
        orderBy: (b: any, { desc }: any) => desc(b.createdAt),
      }),
      this.db.query.employeeDocuments.findMany({
        where: (d: any, { eq }: any) => eq(d.employeeId, id),
        orderBy: (d: any, { desc }: any) => desc(d.createdAt),
      }),
      this.db.query.auditLogs.findMany({
        where: (a: any, { eq, and }: any) =>
          and(eq(a.entityId, id), eq(a.companyId, companyId)),
        orderBy: (a: any, { desc }: any) => desc(a.createdAt),
        limit: 20,
      }),
    ]);

    // Statutory details — stored inline on employee for Phase 4
    const statutory = {
      panNumber: employee.panNumber,
      nationalIdNumber: employee.nationalIdNumber,
      pfNumber: employee.pfNumber,
      esiNumber: employee.esiNumber,
    };

    return {
      success: true,
      data: {
        employee,
        branch: employee.branch,
        department: employee.department,
        designation: employee.designation,
        manager: employee.manager,
        addresses,
        bankAccounts,
        statutory,
        documents,
        activityLog: auditLogs,
      },
    };
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async create(companyId: string, dto: CreateEmployeeDto, userId: string) {
    if (dto.branchId) {
      const b = await this.db.query.branches.findFirst({
        where: (x: any, { eq, and }: any) =>
          and(eq(x.id, dto.branchId), eq(x.companyId, companyId)),
      });
      if (!b)
        throw new BadRequestException({
          code: "BRANCH_NOT_FOUND",
          message: "Branch not found in company",
        });
    }
    if (dto.departmentId) {
      const d = await this.db.query.departments.findFirst({
        where: (x: any, { eq, and }: any) =>
          and(eq(x.id, dto.departmentId), eq(x.companyId, companyId)),
      });
      if (!d)
        throw new BadRequestException({
          code: "DEPARTMENT_NOT_FOUND",
          message: "Department not found in company",
        });
    }
    if (dto.designationId) {
      const des = await this.db.query.designations.findFirst({
        where: (x: any, { eq, and }: any) =>
          and(eq(x.id, dto.designationId), eq(x.companyId, companyId)),
      });
      if (!des)
        throw new BadRequestException({
          code: "DESIGNATION_NOT_FOUND",
          message: "Designation not found",
        });
    }
    if (dto.reportingManagerId) {
      const mgr = await this.db.query.employees.findFirst({
        where: (x: any, { eq, and }: any) =>
          and(eq(x.id, dto.reportingManagerId), eq(x.companyId, companyId)),
      });
      if (!mgr)
        throw new BadRequestException({
          code: "MANAGER_NOT_FOUND",
          message: "Reporting manager not found",
        });
    }
    try {
      const {
        address,
        bankName,
        accountNumber,
        ifscCode,
        accountHolder,
        roleId,
        password,
        employeeGroupId,
        ...empFields
      } = dto;

      const [row] = await this.db
        .insert(schema.employees)
        .values({
          ...empFields,
          companyId,
          employeeCode: empFields.employeeCode.toUpperCase(),
          joiningDate: empFields.joiningDate as any,
        })
        .returning();

      if (address) {
        await this.db
          .insert(schema.employeeAddresses)
          .values({
            employeeId: row.id,
            addressType: "RESIDENTIAL",
            addressLine1: address,
          })
          .catch(() => {});
      }

      if (bankName || accountNumber || ifscCode) {
        await this.db
          .insert(schema.employeeBankAccounts)
          .values({
            employeeId: row.id,
            bankName: bankName || "",
            accountNumber: accountNumber || "",
            ifscCode: ifscCode || "",
            accountHolderName: accountHolder || "",
            isPrimary: true,
          })
          .catch(() => {});
      }

      if (dto.email && roleId) {
        let u = await this.db.query.users.findFirst({
          where: (usr: any, { eq, and }: any) =>
            and(eq(usr.email, dto.email), eq(usr.companyId, companyId)),
        });

        if (u) {
          await this.db
            .update(schema.users)
            .set({ employeeId: row.id })
            .where(eq(schema.users.id, u.id));
        } else {
          const hash = password
            ? await bcrypt.hash(password, 10)
            : await bcrypt.hash("PayMatrix@123", 10);
          const [newU] = await this.db
            .insert(schema.users)
            .values({
              companyId,
              employeeId: row.id,
              email: dto.email,
              passwordHash: hash,
              isActive: true,
            })
            .returning();
          u = newU;
        }

        if (u) {
          await this.db
            .delete(schema.userRoles)
            .where(eq(schema.userRoles.userId, u.id));
          await this.db
            .insert(schema.userRoles)
            .values({
              userId: u.id,
              roleId: roleId,
            })
            .catch(() => {});
        }
      }

      if (employeeGroupId) {
        await this.db
          .insert(schema.employeeGroupMembers)
          .values({
            employeeGroupId,
            employeeId: row.id,
          })
          .catch(() => {});
      }

      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: "employees",
          entityType: "employee",
          entityId: row.id,
          action: "CREATE",
          newValues: dto as any,
        })
        .catch(() => {});
      return { success: true, data: row, message: "Employee created" };
    } catch (e: any) {
      if (e.code === "23505")
        throw new ConflictException({
          code: "EMPLOYEE_ALREADY_EXISTS",
          message: "Employee code or email already exists in this company",
        });
      throw e;
    }
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateEmployeeDto,
    userId: string,
  ) {
    const existing = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, id), eq(e.companyId, companyId)),
    });
    if (!existing || existing.deletedAt)
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });

    const {
      address,
      bankName,
      accountNumber,
      ifscCode,
      accountHolder,
      roleId,
      password,
      employeeGroupId,
      ...empFields
    } = dto;

    const [row] = await this.db
      .update(schema.employees)
      .set({ ...empFields, updatedAt: new Date() } as any)
      .where(
        and(
          eq(schema.employees.id, id),
          eq(schema.employees.companyId, companyId),
        ),
      )
      .returning();

    if (address !== undefined) {
      const existingAddress = await this.db.query.employeeAddresses.findFirst({
        where: (a: any, { eq }: any) => eq(a.employeeId, id),
      });
      if (existingAddress) {
        await this.db
          .update(schema.employeeAddresses)
          .set({ addressLine1: address })
          .where(eq(schema.employeeAddresses.id, existingAddress.id));
      } else if (address) {
        await this.db.insert(schema.employeeAddresses).values({
          employeeId: id,
          addressType: "RESIDENTIAL",
          addressLine1: address,
        });
      }
    }

    if (
      bankName !== undefined ||
      accountNumber !== undefined ||
      ifscCode !== undefined
    ) {
      const existingBank = await this.db.query.employeeBankAccounts.findFirst({
        where: (b: any, { eq }: any) => eq(b.employeeId, id),
      });
      if (existingBank) {
        await this.db
          .update(schema.employeeBankAccounts)
          .set({
            bankName: bankName !== undefined ? bankName : existingBank.bankName,
            accountNumber:
              accountNumber !== undefined
                ? accountNumber
                : existingBank.accountNumber,
            ifscCode: ifscCode !== undefined ? ifscCode : existingBank.ifscCode,
            accountHolderName:
              accountHolder !== undefined
                ? accountHolder
                : existingBank.accountHolderName,
          })
          .where(eq(schema.employeeBankAccounts.id, existingBank.id));
      } else if (bankName || accountNumber) {
        await this.db.insert(schema.employeeBankAccounts).values({
          employeeId: id,
          bankName: bankName || "",
          accountNumber: accountNumber || "",
          ifscCode: ifscCode || "",
          accountHolderName: accountHolder || "",
          isPrimary: true,
        });
      }
    }

    if (empFields.email !== undefined || password || roleId) {
      let u = await this.db.query.users.findFirst({
        where: (usr: any, { eq, and }: any) =>
          and(eq(usr.employeeId, id), eq(usr.companyId, companyId)),
      });

      const effectiveEmail = empFields.email || row.email;

      if (!u && effectiveEmail) {
        u = await this.db.query.users.findFirst({
          where: (usr: any, { eq, and }: any) =>
            and(eq(usr.email, effectiveEmail), eq(usr.companyId, companyId)),
        });
        if (u) {
          await this.db
            .update(schema.users)
            .set({ employeeId: row.id })
            .where(eq(schema.users.id, u.id));
        } else {
          const hash = password
            ? await bcrypt.hash(password, 10)
            : await bcrypt.hash("PayMatrix@123", 10);
          const [newU] = await this.db
            .insert(schema.users)
            .values({
              companyId,
              employeeId: row.id,
              email: effectiveEmail,
              passwordHash: hash,
              isActive: true,
            })
            .returning();
          u = newU;
        }
      } else if (u) {
        // Update existing user's email and/or password
        const userUpdates: any = {};
        if (empFields.email !== undefined && empFields.email !== u.email) {
          userUpdates.email = empFields.email;
        }
        if (password) {
          userUpdates.passwordHash = await bcrypt.hash(password, 10);
        }

        if (Object.keys(userUpdates).length > 0) {
          await this.db
            .update(schema.users)
            .set(userUpdates)
            .where(eq(schema.users.id, u.id));
        }
      }

      if (u && roleId) {
        await this.db
          .delete(schema.userRoles)
          .where(eq(schema.userRoles.userId, u.id));
        await this.db
          .insert(schema.userRoles)
          .values({ userId: u.id, roleId: roleId })
          .catch(() => {});
      }
    }

    if (employeeGroupId) {
      const existingMapping =
        await this.db.query.employeeGroupMembers.findFirst({
          where: (m: any, { eq }: any) => eq(m.employeeId, id),
        });
      if (existingMapping) {
        if (existingMapping.employeeGroupId !== employeeGroupId) {
          await this.db
            .delete(schema.employeeGroupMembers)
            .where(eq(schema.employeeGroupMembers.employeeId, id));
          await this.db
            .insert(schema.employeeGroupMembers)
            .values({ employeeGroupId, employeeId: id })
            .catch(() => {});
        }
      } else {
        await this.db
          .insert(schema.employeeGroupMembers)
          .values({ employeeGroupId, employeeId: id })
          .catch(() => {});
      }
    }

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee",
        entityId: id,
        action: "UPDATE",
        oldValues: existing as any,
        newValues: dto as any,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Employee updated" };
  }

  async remove(companyId: string, id: string, userId: string) {
    const existing = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, id), eq(e.companyId, companyId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });

    await this.db
      .update(schema.employees)
      .set({ deletedAt: new Date(), isActive: false } as any)
      .where(eq(schema.employees.id, id));

    await this.db
      .update(schema.users)
      .set({ isActive: false, deletedAt: new Date() } as any)
      .where(eq(schema.users.employeeId, id));

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee",
        entityId: id,
        action: "SOFT_DELETE",
        oldValues: existing as any,
      })
      .catch(() => {});
    return { success: true, data: null, message: "Employee deleted" };
  }

  async history(companyId: string, id: string) {
    const logs = await this.db.query.auditLogs.findMany({
      where: (a: any, { eq, and }: any) =>
        and(eq(a.entityId, id), eq(a.companyId, companyId)),
      orderBy: (a: any, { desc }: any) => desc(a.createdAt),
      limit: 50,
    });
    return { success: true, data: logs };
  }

  // ── Addresses ───────────────────────────────────────────────────────────────
  async listAddresses(companyId: string, employeeId: string) {
    await this._assertEmployee(companyId, employeeId);
    const rows = await this.db.query.employeeAddresses.findMany({
      where: (a: any, { eq }: any) => eq(a.employeeId, employeeId),
      orderBy: (a: any, { desc }: any) => desc(a.createdAt),
    });
    return { success: true, data: rows };
  }

  async createAddress(
    companyId: string,
    employeeId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const [row] = await this.db
      .insert(schema.employeeAddresses)
      .values({ ...dto, employeeId })
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_address",
        entityId: row.id,
        action: "CREATE",
        newValues: dto,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Address added" };
  }

  async updateAddress(
    companyId: string,
    employeeId: string,
    addressId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeAddresses.findFirst({
      where: (a: any, { eq, and }: any) =>
        and(eq(a.id, addressId), eq(a.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Address not found",
      });
    const [row] = await this.db
      .update(schema.employeeAddresses)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.employeeAddresses.id, addressId))
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_address",
        entityId: addressId,
        action: "UPDATE",
        oldValues: existing,
        newValues: dto,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Address updated" };
  }

  async deleteAddress(
    companyId: string,
    employeeId: string,
    addressId: string,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeAddresses.findFirst({
      where: (a: any, { eq, and }: any) =>
        and(eq(a.id, addressId), eq(a.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "ADDRESS_NOT_FOUND",
        message: "Address not found",
      });
    await this.db
      .delete(schema.employeeAddresses)
      .where(eq(schema.employeeAddresses.id, addressId));
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_address",
        entityId: addressId,
        action: "DELETE",
        oldValues: existing,
      })
      .catch(() => {});
    return { success: true, data: null, message: "Address deleted" };
  }

  // ── Bank Accounts ────────────────────────────────────────────────────────────
  async listBankAccounts(companyId: string, employeeId: string) {
    await this._assertEmployee(companyId, employeeId);
    const rows = await this.db.query.employeeBankAccounts.findMany({
      where: (b: any, { eq }: any) => eq(b.employeeId, employeeId),
      orderBy: (b: any, { desc }: any) => desc(b.createdAt),
    });
    return { success: true, data: rows };
  }

  async createBankAccount(
    companyId: string,
    employeeId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    // If marking primary, unset existing primary first
    if (dto.isPrimary) {
      await this.db
        .update(schema.employeeBankAccounts)
        .set({ isPrimary: false })
        .where(eq(schema.employeeBankAccounts.employeeId, employeeId));
    }
    const [row] = await this.db
      .insert(schema.employeeBankAccounts)
      .values({ ...dto, employeeId })
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_bank_account",
        entityId: row.id,
        action: "CREATE",
        newValues: dto,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Bank account added" };
  }

  async updateBankAccount(
    companyId: string,
    employeeId: string,
    accountId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeBankAccounts.findFirst({
      where: (b: any, { eq, and }: any) =>
        and(eq(b.id, accountId), eq(b.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "BANK_ACCOUNT_NOT_FOUND",
        message: "Bank account not found",
      });
    // If marking primary, unset existing primary first
    if (dto.isPrimary) {
      await this.db
        .update(schema.employeeBankAccounts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(schema.employeeBankAccounts.employeeId, employeeId),
            sql`${schema.employeeBankAccounts.id} != ${accountId}`,
          ),
        );
    }
    const [row] = await this.db
      .update(schema.employeeBankAccounts)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.employeeBankAccounts.id, accountId))
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_bank_account",
        entityId: accountId,
        action: "UPDATE",
        oldValues: existing,
        newValues: dto,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Bank account updated" };
  }

  async deleteBankAccount(
    companyId: string,
    employeeId: string,
    accountId: string,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeBankAccounts.findFirst({
      where: (b: any, { eq, and }: any) =>
        and(eq(b.id, accountId), eq(b.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "BANK_ACCOUNT_NOT_FOUND",
        message: "Bank account not found",
      });
    await this.db
      .delete(schema.employeeBankAccounts)
      .where(eq(schema.employeeBankAccounts.id, accountId));
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_bank_account",
        entityId: accountId,
        action: "DELETE",
        oldValues: existing,
      })
      .catch(() => {});
    return { success: true, data: null, message: "Bank account deleted" };
  }

  // ── Statutory ────────────────────────────────────────────────────────────────
  async getStatutory(companyId: string, employeeId: string) {
    const emp = await this._assertEmployee(companyId, employeeId);
    return {
      success: true,
      data: {
        employeeId: emp.id,
        panNumber: emp.panNumber,
        nationalIdNumber: emp.nationalIdNumber,
        pfNumber: emp.pfNumber,
        esiNumber: emp.esiNumber,
      },
    };
  }

  async updateStatutory(
    companyId: string,
    employeeId: string,
    dto: any,
    userId: string,
  ) {
    const existing = await this._assertEmployee(companyId, employeeId);
    const fields: any = {};
    if (dto.panNumber !== undefined) fields.panNumber = dto.panNumber;
    if (dto.nationalIdNumber !== undefined)
      fields.nationalIdNumber = dto.nationalIdNumber;
    if (dto.pfNumber !== undefined) fields.pfNumber = dto.pfNumber;
    if (dto.esiNumber !== undefined) fields.esiNumber = dto.esiNumber;
    fields.updatedAt = new Date();
    await this.db
      .update(schema.employees)
      .set(fields)
      .where(
        and(
          eq(schema.employees.id, employeeId),
          eq(schema.employees.companyId, companyId),
        ),
      );
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_statutory",
        entityId: employeeId,
        action: "UPDATE",
        oldValues: {
          panNumber: existing.panNumber,
          pfNumber: existing.pfNumber,
        },
        newValues: dto,
      })
      .catch(() => {});
    return {
      success: true,
      data: { employeeId, ...fields },
      message: "Statutory details updated",
    };
  }

  // ── Documents ────────────────────────────────────────────────────────────────
  async listDocuments(companyId: string, employeeId: string) {
    await this._assertEmployee(companyId, employeeId);
    const rows = await this.db.query.employeeDocuments.findMany({
      where: (d: any, { eq }: any) => eq(d.employeeId, employeeId),
      orderBy: (d: any, { desc }: any) => desc(d.createdAt),
    });
    return { success: true, data: rows };
  }

  async createDocument(
    companyId: string,
    employeeId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const [row] = await this.db
      .insert(schema.employeeDocuments)
      .values({ ...dto, employeeId })
      .returning();
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_document",
        entityId: row.id,
        action: "CREATE",
        newValues: dto,
      })
      .catch(() => {});
    return { success: true, data: row, message: "Document added" };
  }

  async deleteDocument(
    companyId: string,
    employeeId: string,
    documentId: string,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeDocuments.findFirst({
      where: (d: any, { eq, and }: any) =>
        and(eq(d.id, documentId), eq(d.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "DOCUMENT_NOT_FOUND",
        message: "Document not found",
      });
    await this.db
      .delete(schema.employeeDocuments)
      .where(eq(schema.employeeDocuments.id, documentId));
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_document",
        entityId: documentId,
        action: "DELETE",
        oldValues: existing,
      })
      .catch(() => {});
    return { success: true, data: null, message: "Document deleted" };
  }

  // ── Document Assignments ─────────────────────────────────────────────────────
  async listDocumentAssignments(companyId: string, employeeId: string) {
    await this._assertEmployee(companyId, employeeId);
    const rows = await this.db.query.employeeDocumentAssignments.findMany({
      where: (d: any, { eq }: any) => eq(d.employeeId, employeeId),
      with: {
        document: true,
      },
      orderBy: (d: any, { desc }: any) => desc(d.assignedDate),
    });
    return { success: true, data: rows };
  }

  async createDocumentAssignment(
    companyId: string,
    employeeId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const [row] = await this.db
      .insert(schema.employeeDocumentAssignments)
      .values({ ...dto, employeeId, createdBy: userId })
      .returning();
    const assignmentWithDoc =
      await this.db.query.employeeDocumentAssignments.findFirst({
        where: (d: any, { eq }: any) => eq(d.id, row.id),
        with: { document: true },
      });
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_document_assignment",
        entityId: row.id,
        action: "CREATE",
        newValues: dto,
      })
      .catch(() => {});
    return {
      success: true,
      data: assignmentWithDoc,
      message: "Document assignment added",
    };
  }

  async updateDocumentAssignment(
    companyId: string,
    employeeId: string,
    assignmentId: string,
    dto: any,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeDocumentAssignments.findFirst({
      where: (d: any, { eq, and }: any) =>
        and(eq(d.id, assignmentId), eq(d.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "ASSIGNMENT_NOT_FOUND",
        message: "Assignment not found",
      });
    const [row] = await this.db
      .update(schema.employeeDocumentAssignments)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(schema.employeeDocumentAssignments.id, assignmentId))
      .returning();
    const assignmentWithDoc =
      await this.db.query.employeeDocumentAssignments.findFirst({
        where: (d: any, { eq }: any) => eq(d.id, row.id),
        with: { document: true },
      });
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_document_assignment",
        entityId: assignmentId,
        action: "UPDATE",
        oldValues: existing,
        newValues: dto,
      })
      .catch(() => {});
    return {
      success: true,
      data: assignmentWithDoc,
      message: "Document assignment updated",
    };
  }

  async deleteDocumentAssignment(
    companyId: string,
    employeeId: string,
    assignmentId: string,
    userId: string,
  ) {
    await this._assertEmployee(companyId, employeeId);
    const existing = await this.db.query.employeeDocumentAssignments.findFirst({
      where: (d: any, { eq, and }: any) =>
        and(eq(d.id, assignmentId), eq(d.employeeId, employeeId)),
    });
    if (!existing)
      throw new NotFoundException({
        code: "ASSIGNMENT_NOT_FOUND",
        message: "Assignment not found",
      });
    await this.db
      .delete(schema.employeeDocumentAssignments)
      .where(eq(schema.employeeDocumentAssignments.id, assignmentId));
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: "employees",
        entityType: "employee_document_assignment",
        entityId: assignmentId,
        action: "DELETE",
        oldValues: existing,
      })
      .catch(() => {});
    return {
      success: true,
      data: null,
      message: "Document assignment deleted",
    };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────
  private async _assertEmployee(companyId: string, employeeId: string) {
    const emp = await this.db.query.employees.findFirst({
      where: (e: any, { eq, and }: any) =>
        and(eq(e.id, employeeId), eq(e.companyId, companyId)),
    });
    if (!emp || emp.deletedAt)
      throw new NotFoundException({
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found",
      });
    return emp;
  }
}
