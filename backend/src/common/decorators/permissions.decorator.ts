import { SetMetadata } from '@nestjs/common';
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...perms: string[]) => SetMetadata(PERMISSIONS_KEY, perms);
// Also support dot notation like "employees.view"
export const Permissions = RequirePermission;
