import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  @Inject(Reflector)
  private readonly reflector: Reflector;

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException({ code: 'AUTH_UNAUTHORIZED', message: 'Not authenticated' });
    const perms: string[] = user.permissions ?? [];
    // Wildcard admin: if user has '*' or super_admin
    if (perms.includes('*') || perms.includes('*:*') || user.roles?.includes('SUPER_ADMIN')) return true;
    const has = required.every((p) => perms.includes(p));
    if (!has) throw new ForbiddenException({ code: 'PERMISSION_DENIED', message: `Missing permission: ${required.join(', ')}` });
    return true;
  }
}
