import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '@/api/payroll';
import type { CreatePayrollRunPayload, PayrollAdjustmentPayload } from '@/api/payroll';

export const payrollKeys = {
  all: ['payroll'] as const,
  list: (params: any) => [...payrollKeys.all, 'list', params] as const,
  detail: (id: string) => [...payrollKeys.all, 'detail', id] as const,
  summary: (id: string) => [...payrollKeys.all, 'summary', id] as const,
  employees: (id: string, params: any) => [...payrollKeys.all, 'employees', id, params] as const,
  employee: (runId: string, employeeId: string) => [...payrollKeys.all, 'employee', runId, employeeId] as const,
  components: (runId: string, employeeId: string) => [...payrollKeys.all, 'components', runId, employeeId] as const,
  adjustments: (runId: string, employeeId: string) => [...payrollKeys.all, 'adjustments', runId, employeeId] as const,
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

export function usePayrollSummary(id: string) {
  return useQuery({
    queryKey: payrollKeys.summary(id),
    queryFn: () => payrollApi.summary(id),
    enabled: !!id,
  });
}

export function usePayrollEmployees(runId: string, params: any = {}) {
  return useQuery({
    queryKey: payrollKeys.employees(runId, params),
    queryFn: () => payrollApi.employees(runId, params),
    enabled: !!runId,
  });
}

export function usePayrollEmployee(runId: string, employeeId: string) {
  return useQuery({
    queryKey: payrollKeys.employee(runId, employeeId),
    queryFn: () => payrollApi.employee(runId, employeeId),
    enabled: !!runId && !!employeeId,
  });
}

export function usePayrollEmployeeComponents(runId: string, employeeId: string) {
  return useQuery({
    queryKey: payrollKeys.components(runId, employeeId),
    queryFn: () => payrollApi.components(runId, employeeId),
    enabled: !!runId && !!employeeId,
  });
}

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePayrollRunPayload) => payrollApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: payrollKeys.all }),
  });
}

export function useCalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, policy }: { id: string; policy?: string }) => payrollApi.calculate(id, policy),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.summary(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useRecalculatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, policy }: { id: string; policy?: string }) => payrollApi.recalculate(id, policy),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.summary(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useSubmitPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.submit(id),
    onSuccess: (_d, id) => {
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
    mutationFn: (id: string) => payrollApi.finalize(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useCancelPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payrollApi.cancel(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(id) });
      qc.invalidateQueries({ queryKey: payrollKeys.all });
    },
  });
}

export function useAddPayrollAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ runId, employeeId, data }: { runId: string; employeeId: string; data: PayrollAdjustmentPayload }) =>
      payrollApi.addAdjustment(runId, employeeId, data),
    onSuccess: (_d, { runId, employeeId }) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.summary(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.components(runId, employeeId) });
      qc.invalidateQueries({ queryKey: payrollKeys.employees(runId, {}) });
    },
  });
}

export function useDeletePayrollAdjustment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ adjustmentId }: { adjustmentId: string; runId: string; employeeId: string }) =>
      payrollApi.deleteAdjustment(adjustmentId),
    onSuccess: (_d, { runId, employeeId }) => {
      qc.invalidateQueries({ queryKey: payrollKeys.detail(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.summary(runId) });
      qc.invalidateQueries({ queryKey: payrollKeys.components(runId, employeeId) });
      qc.invalidateQueries({ queryKey: payrollKeys.employees(runId, {}) });
    },
  });
}
