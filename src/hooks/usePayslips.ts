import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payslipsApi } from '@/api/payslips';
import { toast } from 'sonner';

export const payslipKeys = {
  all: ['payslips'] as const,
  list: (params: any) => [...payslipKeys.all, 'list', params] as const,
  detail: (id: string) => [...payslipKeys.all, 'detail', id] as const,
  byEmployee: (empId: string) => [...payslipKeys.all, 'employee', empId] as const,
};

export function usePayslips(params: any = {}) {
  return useQuery({
    queryKey: payslipKeys.list(params),
    queryFn: () => payslipsApi.list(params),
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: payslipKeys.detail(id),
    queryFn: () => payslipsApi.get(id),
    enabled: !!id,
  });
}

export function useEmployeePayslips(employeeId: string) {
  return useQuery({
    queryKey: payslipKeys.byEmployee(employeeId),
    queryFn: () => payslipsApi.getByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function useCalculatePayslipPreview() {
  return useMutation({
    mutationFn: (data: { employeeId: string; year: number; month: number; policy?: string }) =>
      payslipsApi.calculatePreview(data),
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to calculate payslip preview';
      toast.error('Calculation Exception', { description: msg });
    },
  });
}

export function useGenerateSinglePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; year: number; month: number; policy?: string }) =>
      payslipsApi.generateSingle(data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: payslipKeys.all });
      toast.success('Payslip Finalized', {
        description: `Payslip ${data?.payslipNumber || ''} created and locked successfully.`,
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to finalize payslip';
      toast.error('Generation Failed', { description: msg });
    },
  });
}

export function useRetryPayslipEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payslipsApi.retryEmail(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: payslipKeys.all });
      toast.success('Email Dispatch', {
        description: res?.message || 'Payslip email queued/sent successfully.',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to send email';
      toast.error('Email Transmission Failed', { description: msg });
    },
  });
}

