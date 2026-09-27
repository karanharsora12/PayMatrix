import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { CreateLocationDto, UpdateLocationDto } from './dto/create-location.dto';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { ilike, sql } from 'drizzle-orm';

@Injectable()
export class LocationsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  async list(dto: PaginationDto) {
    const where = dto.search ? ilike(schema.locations.name, `%${dto.search}%`) : undefined;
    
    const total = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.locations)
      .where(where)
      .execute();

    const data = await this.db
      .select()
      .from(schema.locations)
      .where(where)
      .limit(dto.limit || 20)
      .offset(((dto.page || 1) - 1) * (dto.limit || 20))
      .execute();

    return paginated(data, Number(total[0].count), dto);
  }

  async get(id: string) {
    const record = await this.db.query.locations.findFirst({
      where: eq(schema.locations.id, id),
    });
    if (!record) throw new NotFoundException('Location not found');
    return { data: record };
  }

  async create(dto: CreateLocationDto, companyId?: string) {
    if (!companyId) {
      const company = await this.db.query.companies.findFirst();
      companyId = company?.id;
    }
    const [record] = await this.db.insert(schema.locations).values({
      ...dto,
      companyId,
    } as any).returning();
    return { data: record };
  }

  async update(id: string, dto: UpdateLocationDto) {
    const [record] = await this.db.update(schema.locations)
      .set({ ...dto, updatedAt: new Date() } as any)
      .where(eq(schema.locations.id, id))
      .returning();
    if (!record) throw new NotFoundException('Location not found');
    return { data: record };
  }

  async remove(id: string) {
    const [record] = await this.db.delete(schema.locations)
      .where(eq(schema.locations.id, id))
      .returning();
    if (!record) throw new NotFoundException('Location not found');
    return { data: record };
  }
}
