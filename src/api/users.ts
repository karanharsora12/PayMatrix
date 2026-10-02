import { api, unwrap } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  module: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description?: string;
  isSystemRole: boolean;
  createdAt: string;
  rolePermissions?: { id: string; permission: Permission }[];
}

export interface SystemUser {
  id: string;
  companyId: string;
  employeeId?: string;
  email: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  roles?: Role[];
}

export interface CreateUserPayload {
  email: string;
  password: string;
  employeeId?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UpdateUserPayload {
  email?: string;
  password?: string;
  isActive?: boolean;
  roleIds?: string[];
}

// ─── Users API ────────────────────────────────────────────────────────────────

export const usersApi = {
  list: async (params?: any) => {
    const res = await api.get('/users', { params });
    const body = res.data as any;
    return { data: body.data, meta: body.meta };
  },

  get: async (id: string) => unwrap<SystemUser>(await api.get(`/users/${id}`)).data,

  create: async (payload: CreateUserPayload) =>
    unwrap<SystemUser>(await api.post('/users', payload)).data,

  update: async (id: string, payload: UpdateUserPayload) =>
    unwrap<SystemUser>(await api.patch(`/users/${id}`, payload)).data,

  remove: async (id: string) => unwrap(await api.delete(`/users/${id}`)).data,

  // Assign a single role to user (via update)
  assignRole: async (userId: string, roleIds: string[]) =>
    unwrap<SystemUser>(await api.patch(`/users/${userId}`, { roleIds })).data,
};

// ─── Roles API ────────────────────────────────────────────────────────────────

export const rolesApi = {
  list: async (params?: any) => {
    const res = await api.get('/roles', { params });
    const body = res.data as any;
    return { data: body.data as Role[], meta: body.meta };
  },

  create: async (payload: { name: string; slug: string; description?: string; permissionIds?: string[] }) =>
    unwrap<Role>(await api.post('/roles', payload)).data,

  update: async (id: string, payload: Partial<{ name: string; description: string }>) =>
    unwrap<Role>(await api.patch(`/roles/${id}`, payload)).data,

  allPermissions: async (): Promise<Permission[]> =>
    unwrap<Permission[]>(await api.get('/roles/permissions/all')).data,
};
