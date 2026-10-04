import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, or, sql, ilike } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import {
  DEFAULT_PARAMETERS,
  PARAMETER_DEFINITIONS,
} from './parameters.constants';
import {
  QueryUserParameterDto,
  UpsertUserParameterDto,
} from './dto/user-parameter.dto';

@Injectable()
export class ParametersService {
  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  getDefinitions() {
    return {
      success: true,
      data: PARAMETER_DEFINITIONS,
    };
  }

  /**
   * Resolves all parameters for a specific user / employee, falling back to default values.
   */
  async getUserParameters(
    companyId: string | null,
    userId: string,
    providedEmployeeId?: string | null,
  ): Promise<Record<string, boolean | string>> {
    const result: Record<string, boolean | string> = { ...DEFAULT_PARAMETERS };

    let effectiveEmployeeId = providedEmployeeId;
    if (!effectiveEmployeeId && userId) {
      const user = await this.db.query.users.findFirst({
        where: (u: any, { eq }: any) => eq(u.id, userId),
      });
      if (user?.employeeId) {
        effectiveEmployeeId = user.employeeId;
      }
    }

    // Query user parameters matching either userId or effectiveEmployeeId
    const conditions = [];
    if (companyId) {
      conditions.push(eq(schema.userParameters.companyId, companyId));
    }

    const idConditions = [];
    if (userId) {
      idConditions.push(eq(schema.userParameters.userId, userId));
    }
    if (effectiveEmployeeId) {
      idConditions.push(eq(schema.userParameters.employeeId, effectiveEmployeeId));
    }

    if (idConditions.length === 0) {
      return result;
    }

    conditions.push(or(...idConditions));

    const rows = await this.db.query.userParameters.findMany({
      where: and(...conditions),
    });

    for (const row of rows) {
      const def = PARAMETER_DEFINITIONS.find((d) => d.name === row.parameterName);
      if (def && def.type === 'boolean') {
        result[row.parameterName] =
          row.parameterValue === 'true' ||
          row.parameterValue === '1' ||
          row.parameterValue === true;
      } else {
        result[row.parameterName] = row.parameterValue;
      }
    }

    return result;
  }

  /**
   * Resolves a single parameter value for a user.
   */
  async getUserParameterValue(
    companyId: string | null,
    userId: string,
    parameterName: string,
    employeeId?: string | null,
  ): Promise<boolean | string> {
    const params = await this.getUserParameters(companyId, userId, employeeId);
    if (parameterName in params) {
      return params[parameterName];
    }
    const def = PARAMETER_DEFINITIONS.find((d) => d.name === parameterName);
    return def ? def.defaultValue : false;
  }

  /**
   * Returns list of user wise parameters for all employees in company (for Admin Grid).
   */
  async listUserWiseParameters(companyId: string, query?: QueryUserParameterDto) {
    const paramName = query?.parameterName || 'CanManageAttendance';
    const def =
      PARAMETER_DEFINITIONS.find((d) => d.name === paramName) ||
      PARAMETER_DEFINITIONS[0];

    // 1. Fetch employees
    const empConditions = [eq(schema.employees.companyId, companyId)];
    if (query?.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      empConditions.push(
        or(
          ilike(schema.employees.firstName, term),
          ilike(schema.employees.lastName, term),
          ilike(schema.employees.employeeCode, term),
          ilike(schema.employees.email, term),
        ) as any,
      );
    }

    const employees = await this.db.query.employees.findMany({
      where: and(...empConditions),
      with: {
        department: true,
        designation: true,
      },
      orderBy: (e: any, { asc }: any) => asc(e.employeeCode),
    });

    // 2. Fetch existing parameters for this company and paramName
    const paramRows = await this.db.query.userParameters.findMany({
      where: and(
        eq(schema.userParameters.companyId, companyId),
        eq(schema.userParameters.parameterName, paramName),
      ),
    });

    // Map by employeeId and by userId
    const byEmpId = new Map<string, any>();
    const byUserId = new Map<string, any>();
    for (const r of paramRows) {
      if (r.employeeId) byEmpId.set(r.employeeId, r);
      if (r.userId) byUserId.set(r.userId, r);
    }

    // 3. Merge and build items
    const rows = employees.map((emp: any, index: number) => {
      const record = byEmpId.get(emp.id) || (emp.userId ? byUserId.get(emp.userId) : null);
      let value: boolean | string = def.defaultValue;

      if (record) {
        if (def.type === 'boolean') {
          value =
            record.parameterValue === 'true' ||
            record.parameterValue === '1' ||
            record.parameterValue === true;
        } else {
          value = record.parameterValue;
        }
      }

      return {
        srNo: index + 1,
        id: record?.id || null,
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
        departmentName: emp.department?.name || 'General',
        designationName: emp.designation?.name || '—',
        parameterName: paramName,
        parameterDescription: def.description,
        parameterValue: value,
        parameterValueLabel: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value),
        defaultValue: def.defaultValue,
        defaultValueLabel: typeof def.defaultValue === 'boolean' ? (def.defaultValue ? 'Yes' : 'No') : String(def.defaultValue),
        isConfigured: !!record,
        updatedAt: record?.updatedAt || null,
      };
    });

    return {
      success: true,
      data: rows,
      total: rows.length,
      parameterDefinition: def,
    };
  }

  /**
   * Get parameters for a specific employee.
   */
  async getEmployeeParameters(companyId: string, employeeId: string) {
    const emp = await this.db.query.employees.findFirst({
      where: and(
        eq(schema.employees.id, employeeId),
        eq(schema.employees.companyId, companyId),
      ),
    });
    if (!emp) {
      throw new NotFoundException({
        code: 'EMPLOYEE_NOT_FOUND',
        message: 'Employee not found',
      });
    }

    const linkedUser = await this.db.query.users.findFirst({
      where: and(
        eq(schema.users.employeeId, employeeId),
        eq(schema.users.companyId, companyId),
      ),
    });

    const params = await this.getUserParameters(
      companyId,
      linkedUser?.id || '',
      employeeId,
    );

    return {
      success: true,
      data: {
        employee: {
          id: emp.id,
          employeeCode: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`.trim(),
        },
        parameters: params,
      },
    };
  }

  /**
   * Upsert a user-level parameter.
   */
  async upsert(companyId: string, dto: UpsertUserParameterDto, actorId: string) {
    const def = PARAMETER_DEFINITIONS.find((d) => d.name === dto.parameterName);
    if (!def) {
      throw new BadRequestException({
        code: 'INVALID_PARAMETER_NAME',
        message: `Unknown parameter "${dto.parameterName}". Supported parameters: ${PARAMETER_DEFINITIONS.map((p) => p.name).join(', ')}`,
      });
    }

    if (!dto.employeeId && !dto.userId) {
      throw new BadRequestException({
        code: 'MISSING_TARGET_USER',
        message: 'Either employeeId or userId must be specified',
      });
    }

    let targetEmployeeId = dto.employeeId || null;
    let targetUserId = dto.userId || null;

    if (targetEmployeeId) {
      const emp = await this.db.query.employees.findFirst({
        where: and(
          eq(schema.employees.id, targetEmployeeId),
          eq(schema.employees.companyId, companyId),
        ),
      });
      if (!emp) {
        throw new NotFoundException({
          code: 'EMPLOYEE_NOT_FOUND',
          message: 'Employee not found in company',
        });
      }
      if (!targetUserId) {
        const linkedUser = await this.db.query.users.findFirst({
          where: and(
            eq(schema.users.employeeId, targetEmployeeId),
            eq(schema.users.companyId, companyId),
          ),
        });
        if (linkedUser) targetUserId = linkedUser.id;
      }
    } else if (targetUserId) {
      const user = await this.db.query.users.findFirst({
        where: and(
          eq(schema.users.id, targetUserId),
          eq(schema.users.companyId, companyId),
        ),
      });
      if (!user) {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found in company',
        });
      }
      if (user.employeeId) targetEmployeeId = user.employeeId;
    }

    // Stringify value cleanly
    const stringVal = String(dto.parameterValue);

    // Find existing
    const existingConditions = [
      eq(schema.userParameters.companyId, companyId),
      eq(schema.userParameters.parameterName, dto.parameterName),
    ];

    const matchConditions = [];
    if (targetEmployeeId) {
      matchConditions.push(eq(schema.userParameters.employeeId, targetEmployeeId));
    }
    if (targetUserId) {
      matchConditions.push(eq(schema.userParameters.userId, targetUserId));
    }
    existingConditions.push(or(...matchConditions));

    const existing = await this.db.query.userParameters.findFirst({
      where: and(...existingConditions),
    });

    let savedRecord;
    if (existing) {
      const [updated] = await this.db
        .update(schema.userParameters)
        .set({
          parameterValue: stringVal,
          employeeId: targetEmployeeId || existing.employeeId,
          userId: targetUserId || existing.userId,
          updatedBy: actorId,
          updatedAt: new Date(),
        })
        .where(eq(schema.userParameters.id, existing.id))
        .returning();
      savedRecord = updated;
    } else {
      const [inserted] = await this.db
        .insert(schema.userParameters)
        .values({
          companyId,
          employeeId: targetEmployeeId,
          userId: targetUserId,
          parameterName: dto.parameterName,
          parameterValue: stringVal,
          createdBy: actorId,
          updatedBy: actorId,
        })
        .returning();
      savedRecord = inserted;
    }

    // Audit log
    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId: actorId,
        module: 'user-parameters',
        entityType: 'user_parameter',
        entityId: savedRecord.id,
        action: existing ? 'UPDATE' : 'CREATE',
        newValues: {
          employeeId: targetEmployeeId,
          userId: targetUserId,
          parameterName: dto.parameterName,
          parameterValue: stringVal,
        },
      })
      .catch(() => {});

    return {
      success: true,
      data: savedRecord,
      message: `Parameter "${dto.parameterName}" saved successfully`,
    };
  }

  /**
   * Batch upserts parameter values for multiple employees.
   */
  async batchUpsert(
    companyId: string,
    dto: { parameterName: string; items: { employeeId: string; parameterValue: boolean | string }[] },
    actorId: string,
  ) {
    const def = PARAMETER_DEFINITIONS.find((d) => d.name === dto.parameterName);
    if (!def) {
      throw new BadRequestException({
        code: 'INVALID_PARAMETER_NAME',
        message: `Unknown parameter "${dto.parameterName}"`,
      });
    }

    let updatedCount = 0;
    for (const item of dto.items) {
      const stringVal = String(item.parameterValue);
      const existing = await this.db.query.userParameters.findFirst({
        where: and(
          eq(schema.userParameters.companyId, companyId),
          eq(schema.userParameters.employeeId, item.employeeId),
          eq(schema.userParameters.parameterName, dto.parameterName),
        ),
      });

      if (existing) {
        await this.db
          .update(schema.userParameters)
          .set({
            parameterValue: stringVal,
            updatedBy: actorId,
            updatedAt: new Date(),
          })
          .where(eq(schema.userParameters.id, existing.id));
      } else {
        const user = await this.db.query.users.findFirst({
          where: and(
            eq(schema.users.employeeId, item.employeeId),
            eq(schema.users.companyId, companyId),
          ),
        });
        await this.db.insert(schema.userParameters).values({
          companyId,
          employeeId: item.employeeId,
          userId: user?.id || null,
          parameterName: dto.parameterName,
          parameterValue: stringVal,
          createdBy: actorId,
          updatedBy: actorId,
        });
      }
      updatedCount++;
    }

    return {
      success: true,
      updatedCount,
      message: `Saved ${updatedCount} employee settings for "${dto.parameterName}" successfully`,
    };
  }
}
