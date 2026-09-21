import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from '@/api/shifts';

export function useShifts(params?: any) {
  return useQuery({
    queryKey: ['shifts', params],
    queryFn: () => shiftsApi.list(params),
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: ['shifts', id],
    queryFn: () => shiftsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shiftsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => shiftsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shiftsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useAssignShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, payload }: { employeeId: string; payload: any }) =>
      shiftsApi.assign(employeeId, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['shifts', 'assignments', vars.employeeId] });
      qc.invalidateQueries({ queryKey: ['shifts', 'current', vars.employeeId] });
      qc.invalidateQueries({ queryKey: ['employees', vars.employeeId] });
    },
  });
}

export function useEmployeeShifts(employeeId?: string) {
  return useQuery({
    queryKey: ['shifts', 'assignments', employeeId],
    queryFn: () => shiftsApi.getAssignments(employeeId!),
    enabled: !!employeeId,
  });
}

export function useCurrentShift(employeeId?: string, onDate?: string) {
  return useQuery({
    queryKey: ['shifts', 'current', employeeId, onDate],
    queryFn: () => shiftsApi.getCurrent(employeeId!, onDate),
    enabled: !!employeeId,
  });
}
