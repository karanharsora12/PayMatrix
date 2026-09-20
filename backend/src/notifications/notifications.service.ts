import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
@Injectable()
export class NotificationsService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(userId: string, dto: PaginationDto) {
    const where = eq(schema.notifications.userId, userId);
    const total = await this.db.select({ count: sql`count(*)` }).from(schema.notifications).where(where).then((r: any) => Number(r[0].count));
    const rows = await this.db.query.notifications.findMany({ where, limit: dto.limit, offset: dto.offset, orderBy: (n: any, { desc }: any) => desc(n.createdAt) });
    return paginated(rows, total, dto, 'Notifications fetched');
  }
  async markRead(userId: string, id: string) {
    const [row] = await this.db.update(schema.notifications).set({ isRead: true, readAt: new Date() }).where(and(eq(schema.notifications.id, id), eq(schema.notifications.userId, userId))).returning();
    return { success: true, data: row, message: 'Marked as read' };
  }
  async preferences(userId: string) {
    const rows = await this.db.query.notificationPreferences.findMany({ where: (p: any, { eq }: any) => eq(p.userId, userId) });
    return { success: true, data: rows };
  }
  async upsertPreference(userId: string, dto: any) {
    const ex = await this.db.query.notificationPreferences.findFirst({ where: (p: any, { eq, and }: any) => and(eq(p.userId, userId), eq(p.notificationType, dto.notificationType)) });
    if (ex) {
      const [row] = await this.db.update(schema.notificationPreferences).set({ ...dto, updatedAt: new Date() }).where(and(eq(schema.notificationPreferences.userId, userId), eq(schema.notificationPreferences.notificationType, dto.notificationType))).returning();
      return { success: true, data: row };
    }
    const [row] = await this.db.insert(schema.notificationPreferences).values({ userId, ...dto }).returning();
    return { success: true, data: row };
  }
}

