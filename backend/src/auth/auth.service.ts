import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { DRIZZLE } from '../database/database.module';
import * as schema from '../db/schema';
import { EmailSenderService } from '../email-templates/email-sender.service';
import { randomBytes, randomInt } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private db: any,
    private jwt: JwtService,
    private config: ConfigService,
    private emailSender: EmailSenderService,
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
    const user: any = await this.db.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email),
      with: { employee: true },
    });
    if (!user) throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' });
    if (!user.isActive) throw new UnauthorizedException({ code: 'AUTH_ACCOUNT_DISABLED', message: 'Account disabled' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException({ code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid credentials' });

    const { roles, perms } = await this.loadPermissions(user.id);

    const payload = {
      sub: user.id,
      companyId: user.companyId,
      email: user.email,
      roles,
      permissions: perms,
      employeeId: user.employeeId,
    };
    const accessToken = await this.jwt.signAsync(payload as any, {
      secret: this.config.get<string>('JWT_SECRET') ?? 'dev-secret',
      expiresIn: (this.config.get<string>('JWT_EXPIRES_IN') ?? '15m') as any
    });
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: 'refresh' } as any,
      { secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? this.config.get<string>('JWT_SECRET') ?? 'dev-secret', expiresIn: (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d') as any },
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
      user: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roles,
        permissions: perms,
        employee: user.employee,
        employeeId: user.employeeId,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload: any = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET') ?? this.config.get<string>('JWT_SECRET') ?? 'dev-secret',
      });
      if (payload.type !== 'refresh') throw new BadRequestException('Invalid refresh token');
      const user: any = await this.db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.id, payload.sub) });
      if (!user || !user.isActive) throw new UnauthorizedException('User not found or disabled');
      const { roles, perms } = await this.loadPermissions(user.id);
      const newPayload = {
        sub: user.id,
        companyId: user.companyId,
        email: user.email,
        roles,
        permissions: perms,
        employeeId: user.employeeId,
      };
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
    return {
      id: user.id,
      email: user.email,
      companyId: user.companyId,
      employee: user.employee,
      employeeId: user.employeeId,
      roles,
      permissions: perms,
    };
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

  async sendPasswordResetOtp(email: string) {
    const user = await this.db.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email.toLowerCase())
    });
    if (!user) {
      throw new BadRequestException({ message: 'User not found with this email address.' });
    }
    if (!user.isActive) {
      throw new BadRequestException({ message: 'This user account is inactive. Please contact support.' });
    }

    // Generate 6 digit OTP
    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 mins expiry

    const id = randomBytes(16).toString('hex');
    await this.db.insert(schema.passwordResetOtps).values({
      id,
      email: email.toLowerCase(),
      otp,
      expiresAt,
      createdAt: new Date(),
    });

    // Send email
    await this.emailSender.sendEmail({
      companyId: user.companyId || 'SYSTEM',
      toEmail: email,
      subject: 'Your Password Reset OTP',
      bodyHtml: `<p>Your OTP for password reset is <strong>${otp}</strong>. It is valid for 10 minutes.</p>`,
    });

    return { message: 'OTP sent to your email address.' };
  }

  async verifyOtpAndResetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.db.query.users.findFirst({
      where: (u: any, { eq }: any) => eq(u.email, email.toLowerCase())
    });
    if (!user) throw new BadRequestException({ message: 'Invalid request' });

    const now = new Date();
    const record = await this.db.query.passwordResetOtps.findFirst({
      where: (r: any, { eq, and, gt }: any) => and(
        eq(r.email, email.toLowerCase()),
        eq(r.otp, otp),
        gt(r.expiresAt, now)
      ),
      orderBy: (r: any, { desc }: any) => [desc(r.createdAt)]
    });

    if (!record) {
      throw new BadRequestException({ message: 'Invalid or expired OTP' });
    }

    const hash = await this.hashPassword(newPassword);
    await this.db.update(schema.users).set({ passwordHash: hash, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
    
    // Cleanup OTPs for this user
    await this.db.delete(schema.passwordResetOtps).where(eq(schema.passwordResetOtps.email, email.toLowerCase()));

    // Audit log
    await this.db.insert(schema.auditLogs).values({
      companyId: user.companyId,
      userId: user.id,
      module: 'auth',
      action: 'UPDATE',
      entityType: 'users',
      entityId: user.id,
      newValues: { method: 'otp', event: 'password_reset' } as any,
    });

    return { message: 'Password reset successful.' };
  }
}

