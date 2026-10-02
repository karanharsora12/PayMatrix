import { Inject, Injectable, ConflictException } from "@nestjs/common";
import { and, eq, sql } from "drizzle-orm";
import { DRIZZLE } from "../database/database.module";
import * as schema from "../db/schema";
import { PaginationDto, paginated } from "../common/dto/pagination.dto";
@Injectable()
export class RolesService {
  constructor(@Inject(DRIZZLE) private db: any) {}
  async list(companyId: string, dto: PaginationDto) {
    const where = companyId ? eq(schema.roles.companyId, companyId) : undefined;
    const total = await this.db
      .select({ count: sql`count(*)` })
      .from(schema.roles)
      .where(where)
      .then((r: any) => Number(r[0].count));
    const rows = await this.db.query.roles.findMany({
      where,
      with: { rolePermissions: { with: { permission: true } } },
      limit: dto.limit,
      offset: dto.offset,
    });
    return paginated(rows, total, dto, "Roles fetched");
  }
  async create(companyId: string, dto: any) {
    try {
      const [role] = await this.db
        .insert(schema.roles)
        .values({
          companyId,
          name: dto.name,
          slug: dto.slug.toUpperCase(),
          description: dto.description,
          isSystemRole: dto.isSystemRole ?? false,
        })
        .returning();
      if (dto.permissionIds?.length)
        for (const pid of dto.permissionIds)
          await this.db
            .insert(schema.rolePermissions)
            .values({ roleId: role.id, permissionId: pid })
            .catch(() => {});
      const full = await this.db.query.roles.findFirst({
        where: (r: any, { eq }: any) => eq(r.id, role.id),
        with: { rolePermissions: { with: { permission: true } } },
      });
      return { success: true, data: full, message: "Role created" };
    } catch (e: any) {
      if (e.code === "23505") throw new ConflictException("Role slug exists");
      throw e;
    }
  }
  async update(companyId: string, id: string, dto: any) {
    const { permissionIds, ...roleData } = dto;
    if (Object.keys(roleData).length > 0) {
      await this.db
        .update(schema.roles)
        .set({ ...roleData, updatedAt: new Date() })
        .where(
          and(eq(schema.roles.id, id), eq(schema.roles.companyId, companyId)),
        );
    }

    if (permissionIds) {
      await this.db
        .delete(schema.rolePermissions)
        .where(eq(schema.rolePermissions.roleId, id));
      if (permissionIds.length > 0) {
        const values = permissionIds.map((pid: string) => ({
          roleId: id,
          permissionId: pid,
        }));
        await this.db
          .insert(schema.rolePermissions)
          .values(values)
          .catch(() => {});
      }
    }

    const row = await this.db.query.roles.findFirst({
      where: (r: any, { eq, and }: any) =>
        and(eq(r.id, id), eq(r.companyId, companyId)),
      with: { rolePermissions: { with: { permission: true } } },
    });
    return { success: true, data: row, message: "Role updated" };
  }
  async permissions() {
    const rows = await this.db.query.permissions.findMany();
    return { success: true, data: rows };
  }
}
