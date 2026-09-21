import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leave';

export function useLeaveTypes(params?: any) {
  return useQuery({
    queryKey: ['leave', 'types', params],
    queryFn: () => leaveApi.types(params),
  });
}

export function useLeaveRequests(params?: any) {
  return useQuery({
    queryKey: ['leave', 'requests', params],
    queryFn: () => leaveApi.requests(params),
  });
}

export function useLeaveBalances(employeeId?: string, year?: number) {
  return useQuery({
    queryKey: ['leave', 'balances', employeeId, year],
    queryFn: () => leaveApi.balances(employeeId!, year),
    enabled: !!employeeId,
  });
}

export function useLeaveCalendar(params?: { fromDate?: string; toDate?: string; departmentId?: string; branchId?: string; employeeId?: string; leaveTypeId?: string }) {
  return useQuery({
    queryKey: ['leave', 'calendar', params],
    queryFn: () => leaveApi.calendar(params),
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.createType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => leaveApi.updateType(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.deleteType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'types'] });
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.createRequest,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests'] });
      qc.invalidateQueries({ queryKey: ['leave', 'balances'] });
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests'] });
      qc.invalidateQueries({ queryKey: ['leave', 'balances'] });
      qc.invalidateQueries({ queryKey: ['leave', 'calendar'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      leaveApi.reject(id, rejectionReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests'] });
      qc.invalidateQueries({ queryKey: ['leave', 'balances'] });
    },
  });
}

export function useCancelLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave', 'requests'] });
      qc.invalidateQueries({ queryKey: ['leave', 'balances'] });
      qc.invalidateQueries({ queryKey: ['leave', 'calendar'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
