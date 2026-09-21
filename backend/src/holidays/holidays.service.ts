import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { paginated } from '../common/dto/pagination.dto';
import {
  CreateHolidayDto,
  HolidayFilterDto,
  UpdateHolidayDto,
} from './dto/holiday.dto';

@Injectable()
export class HolidaysService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(companyId: string, filter: HolidayFilterDto) {
    let conditions = [eq(schema.holidays.companyId, companyId)];

    if (filter.year) {
      conditions.push(
        sql`EXTRACT(YEAR FROM ${schema.holidays.holidayDate}) = ${filter.year}`,
      );
    }
    if (filter.month) {
      conditions.push(
        sql`EXTRACT(MONTH FROM ${schema.holidays.holidayDate}) = ${filter.month}`,
      );
    }
    if (filter.holidayType) {
      conditions.push(eq(schema.holidays.holidayType, filter.holidayType as any));
    }
    if (filter.isOptional !== undefined) {
      conditions.push(eq(schema.holidays.isOptional, filter.isOptional));
    }

    const where = and(...conditions);

    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.holidays)
      .where(where)
      .then((r: any) => Number(r[0].count));

    const rows = await this.db.query.holidays.findMany({
      where,
      limit: filter.limit,
      offset: filter.offset,
      orderBy: (h: any, { asc }: any) => asc(h.holidayDate),
    });

    return paginated(rows, total, filter, 'Holidays fetched successfully');
  }

  async get(companyId: string, id: string) {
    const row = await this.db.query.holidays.findFirst({
      where: (h: any, { eq, and }: any) =>
        and(eq(h.id, id), eq(h.companyId, companyId)),
    });
    if (!row) {
      throw new NotFoundException({
        code: 'HOLIDAY_NOT_FOUND',
        message: 'Holiday not found',
      });
    }
    return { success: true, data: row };
  }

  async create(companyId: string, dto: CreateHolidayDto, userId: string) {
    // Check if holidayDate already exists for this company
    const existing = await this.db.query.holidays.findFirst({
      where: (h: any, { eq, and }: any) =>
        and(
          eq(h.companyId, companyId),
          eq(h.holidayDate, dto.holidayDate as any),
        ),
    });
    if (existing) {
      throw new ConflictException({
        code: 'HOLIDAY_DATE_EXISTS',
        message: `Holiday already exists for date ${dto.holidayDate}`,
      });
    }

    const [row] = await this.db
      .insert(schema.holidays)
      .values({
        companyId,
        name: dto.name.trim(),
        holidayDate: dto.holidayDate as any,
        holidayType: dto.holidayType ?? 'NATIONAL',
        description: dto.description?.trim() || null,
        isOptional: dto.isOptional ?? false,
        isActive: dto.isActive ?? true,
      })
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'holidays',
        entityType: 'holiday',
        entityId: row.id,
        action: 'CREATE',
        newValues: row as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: 'Holiday created successfully',
    };
  }

  async update(
    companyId: string,
    id: string,
    dto: UpdateHolidayDto,
    userId: string,
  ) {
    const ex = await this.db.query.holidays.findFirst({
      where: (h: any, { eq, and }: any) =>
        and(eq(h.id, id), eq(h.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'HOLIDAY_NOT_FOUND',
        message: 'Holiday not found',
      });
    }

    if (dto.holidayDate && dto.holidayDate !== ex.holidayDate) {
      const dateExists = await this.db.query.holidays.findFirst({
        where: (h: any, { eq, and }: any) =>
          and(
            eq(h.companyId, companyId),
            eq(h.holidayDate, dto.holidayDate as any),
          ),
      });
      if (dateExists) {
        throw new ConflictException({
          code: 'HOLIDAY_DATE_EXISTS',
          message: `Holiday already exists for date ${dto.holidayDate}`,
        });
      }
    }

    const payload: any = { ...dto, updatedAt: new Date() };
    if (dto.name) payload.name = dto.name.trim();
    if (dto.description) payload.description = dto.description.trim();

    const [row] = await this.db
      .update(schema.holidays)
      .set(payload)
      .where(
        and(
          eq(schema.holidays.id, id),
          eq(schema.holidays.companyId, companyId),
        ),
      )
      .returning();

    await this.db
      .insert(schema.auditLogs)
      .values({
        companyId,
        userId,
        module: 'holidays',
        entityType: 'holiday',
        entityId: id,
        action: 'UPDATE',
        oldValues: ex as any,
        newValues: row as any,
      })
      .catch(() => {});

    return {
      success: true,
      data: row,
      message: 'Holiday updated successfully',
    };
  }

  async remove(companyId: string, id: string, userId?: string) {
    const ex = await this.db.query.holidays.findFirst({
      where: (h: any, { eq, and }: any) =>
        and(eq(h.id, id), eq(h.companyId, companyId)),
    });
    if (!ex) {
      throw new NotFoundException({
        code: 'HOLIDAY_NOT_FOUND',
        message: 'Holiday not found',
      });
    }

    await this.db
      .delete(schema.holidays)
      .where(
        and(
          eq(schema.holidays.id, id),
          eq(schema.holidays.companyId, companyId),
        ),
      );

    if (userId) {
      await this.db
        .insert(schema.auditLogs)
        .values({
          companyId,
          userId,
          module: 'holidays',
          entityType: 'holiday',
          entityId: id,
          action: 'DELETE',
          oldValues: ex as any,
        })
        .catch(() => {});
    }

    return {
      success: true,
      data: null,
      message: 'Holiday deleted successfully',
    };
  }
}
