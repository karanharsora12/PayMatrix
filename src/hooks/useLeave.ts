import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '@/api/leave';

export function useLeaveTypes(params?: any) {
  return useQuery({ queryKey: ['leave', 'types', params], queryFn: () => leaveApi.types(params) });
}
export function useLeaveRequests(params: any) {
  return useQuery({ queryKey: ['leave', 'requests', params], queryFn: () => leaveApi.requests(params), placeholderData: (p) => p });
}
export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.createRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave', 'requests'] }),
  });
}
export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.approve,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leave', 'requests'] }),
  });
}
