import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private jwt: JwtService,
  ) {}

  private async loadPermissions(userId: string) {
    // Load roles + permissions for the user
    const userRoles = await this.db.query.userRoles.findMany({
      where: (ur: any, { eq }: any) => eq(ur.userId, userId),
      with: { role: { with: { rolePermissions: { with: { permission: true } } } } },
    }).catch(() => []);
    const roles: string[] = [];
    const perms: string[] = [];
    for (const ur of userRoles ?? []) {
      if (ur.role?.slug) roles.push(ur.role.slug);
      for (const rp of ur.role?.rolePermissions ?? []) {
        if (rp.permission) perms.push(`${rp.permission.module}.${rp.permission.action.toLowerCase()}`);
      }
    }
    return { roles, perms };
  }

  async login(email: string, password: string) {
    const user: any = await this.db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.email, email) });
    if (!user) throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' });
    if (!user.isActive) throw new UnauthorizedException({ code: 'AUTH_ACCOUNT_DISABLED', message: 'Account disabled' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' });

    const { roles, perms } = await this.loadPermissions(user.id);

    const payload = { sub: user.id, companyId: user.companyId, email: user.email, roles, permissions: perms };
    const accessToken = await this.jwt.signAsync(payload as any, { expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as any });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' } as any,
      { secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret', expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any },
    );

    await this.db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id));

    // Audit login
    try {
      await this.db.insert(schema.auditLogs).values({
        companyId: user.companyId,
        userId: user.id,
        module: 'auth',
        entityType: 'user',
        entityId: user.id,
        action: 'LOGIN',
        newValues: { email } as any,
      });
    } catch {}

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, companyId: user.companyId, roles, permissions: perms },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload: any = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'dev-secret',
      });
      if (payload.type !== 'refresh') throw new BadRequestException('Invalid refresh token');
      const user: any = await this.db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.id, payload.sub) });
      if (!user || !user.isActive) throw new UnauthorizedException('User not found or disabled');
      const { roles, perms } = await this.loadPermissions(user.id);
      const newPayload = { sub: user.id, companyId: user.companyId, email: user.email, roles, permissions: perms };
      const accessToken = await this.jwt.signAsync(newPayload);
      return { accessToken };
    } catch (e: any) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException({ code: 'AUTH_INVALID_TOKEN', message: 'Invalid refresh token' });
    }
  }

  async me(userId: string) {
    const user: any = await this.db.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.id, userId),
      with: { employee: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const { roles, perms } = await this.loadPermissions(userId);
    return { id: user.id, email: user.email, companyId: user.companyId, employee: user.employee, roles, permissions: perms };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user: any = await this.db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.id, userId) });
    if (!user) throw new UnauthorizedException('User not found');
    const ok = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!ok) throw new BadRequestException({ code: 'AUTH_INVALID_PASSWORD', message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await this.db.update(schema.users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(schema.users.id, userId));
    return { message: 'Password changed successfully' };
  }

  async hashPassword(plain: string) {
    return bcrypt.hash(plain, 10);
  }
}

