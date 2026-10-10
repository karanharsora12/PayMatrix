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

    const perms: string[] = (user.permissions ?? []).map((p: string) => p.toLowerCase());
    const roles: string[] = user.roles ?? [];

    // Wildcard admin: if user has '*' or super_admin
    if (perms.includes('*') || perms.includes('*:*') || roles.includes('SUPER_ADMIN')) {
      return true;
    }

    const hasAll = required.every((reqPerm) => this.checkSinglePermission(perms, reqPerm));
    if (!hasAll) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: `Missing permission: ${required.join(', ')}`,
      });
    }
    return true;
  }

  private checkSinglePermission(userPerms: string[], required: string): boolean {
    const normReq = required.toLowerCase().replace(/:/g, '.');

    // Direct match
    if (userPerms.includes(normReq)) return true;

    // Check module wildcard, e.g. "employees.*"
    const [mod, ...rest] = normReq.split('.');
    const action = rest.join('.');
    if (userPerms.includes(`${mod}.*`)) return true;

    // Check parent module fallback for submodules:
    // e.g. "salary.component.view" matches "salary.view", "shift.view" matches "attendance.view"
    if (normReq.startsWith('salary.')) {
      if (userPerms.includes('salary.view') && action.endsWith('view')) return true;
      if (userPerms.includes('salary.create') && (action.endsWith('create') || action.endsWith('assign'))) return true;
      if (userPerms.includes('salary.edit') && action.endsWith('edit')) return true;
      if (userPerms.includes('salary.delete') && action.endsWith('delete')) return true;
    }

    if (normReq.startsWith('shift.') || normReq.startsWith('holiday.')) {
      if (userPerms.includes('attendance.view') && action.endsWith('view')) return true;
      if (userPerms.includes('attendance.create') && action.endsWith('create')) return true;
      if (userPerms.includes('attendance.edit') && action.endsWith('edit')) return true;
      if (userPerms.includes('attendance.delete') && action.endsWith('delete')) return true;
    }

    if (normReq.startsWith('payslip.')) {
      if (userPerms.includes('payroll.view') && action.endsWith('view')) return true;
      if (userPerms.includes('payroll.create') && (action.endsWith('create') || action.endsWith('generate') || action.endsWith('process'))) return true;
    }

    // Synonym aliases (e.g. view vs read/list, create vs add)
    const synonyms: Record<string, string[]> = {
      view: ['list', 'get', 'read'],
      create: ['add', 'new'],
      edit: ['update', 'modify'],
      delete: ['remove'],
      export: ['download'],
    };

    for (const [canonical, synList] of Object.entries(synonyms)) {
      if (action === canonical) {
        for (const syn of synList) {
          if (userPerms.includes(`${mod}.${syn}`)) return true;
        }
      } else if (synList.includes(action)) {
        if (userPerms.includes(`${mod}.${canonical}`)) return true;
      }
    }

    return false;
  }
}
