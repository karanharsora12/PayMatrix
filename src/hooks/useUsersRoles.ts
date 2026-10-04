import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, rolesApi } from '@/api/users';
import type { CreateUserPayload, UpdateUserPayload } from '@/api/users';

// ─── Roles ────────────────────────────────────────────────────────────────────

export function useRoles(params?: any) {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.list({ limit: 100, ...params }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.allPermissions(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rolesApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => rolesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roles'] }),
  });
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function useUsers(params?: any) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => usersApi.list({ limit: 100, ...params }),
    staleTime: 2 * 60 * 1000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => usersApi.get(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      usersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useRemoveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useAssignUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleIds }: { userId: string; roleIds: string[] }) =>
      usersApi.assignRole(userId, roleIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
