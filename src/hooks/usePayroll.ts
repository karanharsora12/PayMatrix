import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/api/payroll';

export const payrollKeys = {
  all: ['payroll'] as const,
  list: (params: any) => [...payrollKeys.all, 'list', params] as const,
  detail: (id: string) => [...payrollKeys.all, 'detail', id] as const,
};

export function usePayrollRuns(params: any = {}) {
  return useQuery({
    queryKey: payrollKeys.list(params),
    queryFn: () => payrollApi.list(params),
  });
}

export function usePayrollRun(id: string) {
  return useQuery({
    queryKey: payrollKeys.detail(id),
    queryFn: () => payrollApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.calculate,
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useApprovePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => payrollApi.approve(id, comments),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useFinalizePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollApi.finalize,
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id as string) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}
