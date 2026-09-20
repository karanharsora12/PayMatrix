import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = companyId ? eq(schema.users.companyId, companyId) : undefined;
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.users).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.users.findMany({ where, with: { employee: true }, limit: dto.limit, offset: dto.offset });
    return paginated(rows.map((u: any) => ({ ...u, passwordHash: undefined })), total, dto, 'Users fetched');
  }
  async get(companyId: string, id: string) {
    const row = await this.db.query.users.findFirst({ where: (u: any, { eq, and }: any) => and(eq(u.id, id), eq(u.companyId, companyId)), with: { employee: true } });
    if (!row) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = row;
    return { success: true, data: rest };
  }
  async create(companyId: string, dto: any, actorId: string) {
    const hash = await bcrypt.hash(dto.password, 10);
    try {
      const [row] = await this.db.insert(schema.users).values({ companyId, employeeId: dto.employeeId, email: dto.email, passwordHash: hash, isActive: dto.isActive ?? true }).returning();
      if (dto.roleIds?.length) for (const rid of dto.roleIds) await this.db.insert(schema.userRoles).values({ userId: row.id, roleId: rid }).catch(()=>{});
      await this.db.insert(schema.auditLogs).values({ companyId, userId: actorId, module: 'users', entityType: 'user', entityId: row.id, action: 'CREATE', newValues: { email: dto.email } as any }).catch(()=>{});
      const { passwordHash, ...rest } = row;
      return { success: true, data: rest, message: 'User created' };
    } catch (e: any) { if (e.code === '23505') throw new ConflictException('Email already exists'); throw e; }
  }
  async update(companyId: string, id: string, dto: any) {
    const updates: any = { ...dto, updatedAt: new Date() };
    if (dto.password) updates.passwordHash = await bcrypt.hash(dto.password, 10);
    delete updates.password;
    const [row] = await this.db.update(schema.users).set(updates).where(and(eq(schema.users.id, id), eq(schema.users.companyId, companyId))).returning();
    if (!row) throw new NotFoundException('User not found');
    const { passwordHash, ...rest } = row;
    return { success: true, data: rest, message: 'User updated' };
  }
  async remove(companyId: string, id: string) {
    await this.db.update(schema.users).set({ deletedAt: new Date(), isActive: false } as any).where(and(eq(schema.users.id, id), eq(schema.users.companyId, companyId)));
    return { success: true, data: null, message: 'User deleted' };
  }
}

