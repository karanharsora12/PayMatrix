import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { payslipsApi } from '@/api/payslips';
import { toast } from '@/components/ui/use-toast';

export interface PayslipsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: number;
  month?: number;
  departmentId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface GeneratedPayslipResult {
  id?: string;
  payslipNumber?: string;
  employeeId?: string;
  [key: string]: unknown;
}

export interface EmailDispatchResult {
  message?: string;
  success?: boolean;
  [key: string]: unknown;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: {
        message?: string;
      };
    };
  };
  message?: string;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  const errorObj = err as ApiErrorResponse | undefined;
  return (
    errorObj?.response?.data?.message ||
    errorObj?.response?.data?.error?.message ||
    errorObj?.message ||
    fallback
  );
}

export const payslipKeys = {
  all: ['payslips'] as const,
  list: (params: PayslipsQueryParams = {}) =>
    [...payslipKeys.all, 'list', params] as const,
  detail: (id: string) => [...payslipKeys.all, 'detail', id] as const,
  byEmployee: (empId: string) =>
    [...payslipKeys.all, 'employee', empId] as const,
};

export function usePayslips(params: PayslipsQueryParams = {}) {
  return useQuery({
    queryKey: payslipKeys.list(params),
    queryFn: () => payslipsApi.list(params),
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: payslipKeys.detail(id),
    queryFn: () => payslipsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useEmployeePayslips(employeeId: string) {
  return useQuery({
    queryKey: payslipKeys.byEmployee(employeeId),
    queryFn: () => payslipsApi.getByEmployee(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useCalculatePayslipPreview() {
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      year: number;
      month: number;
      policy?: string;
    }) => payslipsApi.calculatePreview(data),
    onError: (err: unknown) => {
      const msg = extractErrorMessage(
        err,
        'Failed to calculate payslip preview',
      );
      toast.error('Calculation Exception', { description: msg });
    },
  });
}

export function useGenerateSinglePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: string;
      year: number;
      month: number;
      policy?: string;
    }) => payslipsApi.generateSingle(data),
    onSuccess: (data: GeneratedPayslipResult | unknown) => {
      queryClient.invalidateQueries({ queryKey: payslipKeys.all });
      const payslipObj = data as GeneratedPayslipResult | undefined;
      toast.success('Payslip Finalized', {
        description: `Payslip ${payslipObj?.payslipNumber || ''} created and locked successfully.`,
      });
    },
    onError: (err: unknown) => {
      const msg = extractErrorMessage(err, 'Failed to finalize payslip');
      toast.error('Generation Failed', { description: msg });
    },
  });
}

export function useRetryPayslipEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payslipsApi.retryEmail(id),
    onSuccess: (res: EmailDispatchResult | unknown) => {
      queryClient.invalidateQueries({ queryKey: payslipKeys.all });
      const emailObj = res as EmailDispatchResult | undefined;
      toast.success('Email Dispatch', {
        description:
          emailObj?.message || 'Payslip email queued/sent successfully.',
      });
    },
    onError: (err: unknown) => {
      const msg = extractErrorMessage(err, 'Failed to send email');
      toast.error('Email Transmission Failed', { description: msg });
    },
  });
}
