import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { eq, ilike, sql, and, isNull, gte, lte } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/create-company.dto';
import { DEFAULT_WORK_POLICY, evaluateScheduledWeeklyOff } from './work-policy.types';

@Injectable()
export class CompaniesService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(dto: PaginationDto) {
    const where = dto.search ? ilike(schema.companies.name, `%${dto.search}%`) : undefined;
    const total = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.companies)
      .where(where ? where : undefined)
      .then((r: any) => Number(r[0]?.count ?? 0));
    const rows = await this.db.query.companies.findMany({
      where,
      limit: dto.limit,
      offset: dto.offset,
      orderBy: (c: any, { desc, asc }: any) =>
        dto.sortBy ? (dto.sortOrder === 'desc' ? desc(c[dto.sortBy]) : asc(c[dto.sortBy])) : desc(c.createdAt),
    });
    return paginated(rows, total, dto, 'Companies fetched');
  }

  async get(id: string) {
    const row = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!row) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    return { success: true, data: row };
  }

  async create(dto: CreateCompanyDto, userId?: string) {
    try {
      const [row] = await this.db.insert(schema.companies).values({ ...dto, code: dto.code.toUpperCase() }).returning();
      if (userId) {
        await this.db.insert(schema.auditLogs).values({
          companyId: row.id,
          userId,
          module: 'companies',
          entityType: 'company',
          entityId: row.id,
          action: 'CREATE',
          newValues: dto as any,
        }).catch(()=>{});
      }
      return { success: true, data: row, message: 'Company created' };
    } catch (e: any) {
      if (e?.code === '23505') throw new ConflictException({ code: 'COMPANY_CODE_EXISTS', message: 'Company code already exists' });
      throw e;
    }
  }

  async update(id: string, dto: UpdateCompanyDto, userId?: string) {
    const existing = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!existing) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    const [row] = await this.db.update(schema.companies).set({ ...dto, updatedAt: new Date() }).where(eq(schema.companies.id, id)).returning();
    if (userId) {
      await this.db.insert(schema.auditLogs).values({
        companyId: id,
        userId,
        module: 'companies',
        entityType: 'company',
        entityId: id,
        action: 'UPDATE',
        oldValues: existing as any,
        newValues: dto as any,
      }).catch(()=>{});
    }
    return { success: true, data: row, message: 'Company updated' };
  }

  async remove(id: string) {
    const row = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!row) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });
    await this.db.update(schema.companies).set({ deletedAt: new Date() } as any).where(eq(schema.companies.id, id));
    return { success: true, data: null, message: 'Company deleted' };
  }

  async getWorkPolicy(id: string) {
    const company = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!company) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });

    const row = await this.db.query.companySettings.findFirst({
      where: and(
        eq(schema.companySettings.companyId, id),
        eq(schema.companySettings.key, 'WORK_POLICY'),
      ),
    });

    if (row && row.value) {
      try {
        return { success: true, data: JSON.parse(row.value) };
      } catch {
        // fallback
      }
    }
    return { success: true, data: DEFAULT_WORK_POLICY };
  }

  async updateWorkPolicy(id: string, policy: any, userId?: string) {
    const company = await this.db.query.companies.findFirst({ where: (c: any, { eq }: any) => eq(c.id, id) });
    if (!company) throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Company not found' });

    const existing = await this.db.query.companySettings.findFirst({
      where: and(
        eq(schema.companySettings.companyId, id),
        eq(schema.companySettings.key, 'WORK_POLICY'),
      ),
    });

    const stringVal = JSON.stringify(policy);

    if (existing) {
      await this.db
        .update(schema.companySettings)
        .set({ value: stringVal, updatedAt: new Date() })
        .where(eq(schema.companySettings.id, existing.id));
    } else {
      await this.db.insert(schema.companySettings).values({
        companyId: id,
        key: 'WORK_POLICY',
        value: stringVal,
        valueType: 'JSON',
      });
    }

    if (userId) {
      await this.db.insert(schema.auditLogs).values({
        companyId: id,
        userId,
        module: 'company_settings',
        entityType: 'work_policy',
        entityId: id,
        action: 'UPDATE',
        oldValues: existing?.value ? JSON.parse(existing.value) : (DEFAULT_WORK_POLICY as any),
        newValues: policy,
      }).catch(() => {});
    }

    return { success: true, data: policy, message: 'Work policy updated successfully' };
  }

  async previewCalendar(id: string, year: number, month: number) {
    const policyRes = await this.getWorkPolicy(id);
    const policy = policyRes.data;

    const totalDays = new Date(year, month, 0).getDate();
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

    const holidays: any[] = await this.db.query.holidays.findMany({
      where: and(
        eq(schema.holidays.companyId, id),
        gte(schema.holidays.holidayDate, periodStart),
        lte(schema.holidays.holidayDate, periodEnd),
      ),
    });

    const holidayMap = new Map<string, any>();
    for (const h of holidays) {
      holidayMap.set(h.holidayDate?.slice(0, 10), h);
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const days: any[] = [];
    let workingDays = 0;
    let paidWeeklyOffs = 0;
    let unpaidWeeklyOffs = 0;
    let paidHolidays = 0;
    let unpaidHolidays = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dt = new Date(year, month - 1, d);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = dt.getDay();
      const holiday = holidayMap.get(dateStr);

      const offEval = evaluateScheduledWeeklyOff(dt, policy);

      let status = 'WORKING_DAY';
      let isPayable = true;
      let reason = 'Working Day';

      if (holiday) {
        const isPaid = holiday.isPaid ?? true;
        status = isPaid ? 'PAID_HOLIDAY' : 'UNPAID_HOLIDAY';
        isPayable = isPaid;
        reason = `${holiday.name || 'Company Holiday'} (${isPaid ? 'Paid' : 'Unpaid'})`;
        if (isPaid) paidHolidays++;
        else unpaidHolidays++;
      } else if (offEval.isOff) {
        status = offEval.isPaid ? 'PAID_WEEK_OFF' : 'UNPAID_WEEK_OFF';
        isPayable = offEval.isPaid;
        reason = offEval.patternDescription;
        if (offEval.isPaid) paidWeeklyOffs++;
        else unpaidWeeklyOffs++;
      } else {
        status = 'WORKING_DAY';
        isPayable = true;
        reason = 'Standard Working Day';
        workingDays++;
      }

      days.push({
        date: dateStr,
        day: d,
        dayOfWeek: dayNames[dayOfWeek],
        isWorkingDay: !offEval.isOff && !holiday,
        isWeeklyOff: offEval.isOff,
        isHoliday: !!holiday,
        holidayName: holiday?.name || null,
        isPayable,
        status,
        reason,
      });
    }

    return {
      success: true,
      data: {
        year,
        month,
        totalCalendarDays: totalDays,
        workingDays,
        paidWeeklyOffs,
        unpaidWeeklyOffs,
        paidHolidays,
        unpaidHolidays,
        totalPaidDays: workingDays + paidWeeklyOffs + paidHolidays,
        days,
      },
    };
  }
}



