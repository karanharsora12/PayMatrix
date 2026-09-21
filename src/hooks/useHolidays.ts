import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { holidaysApi } from '@/api/holidays';

export function useHolidays(params?: any) {
  return useQuery({
    queryKey: ['holidays', params],
    queryFn: () => holidaysApi.list(params),
  });
}

export function useHoliday(id: string) {
  return useQuery({
    queryKey: ['holidays', id],
    queryFn: () => holidaysApi.get(id),
    enabled: !!id,
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: holidaysApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => holidaysApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => holidaysApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['holidays'] }),
  });
}
