import { useQuery } from '@tanstack/react-query';
import { payslipsApi } from '@/api/payslips';

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
