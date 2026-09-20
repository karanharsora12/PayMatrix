import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance';

export function useAttendance(params: any) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useAttendanceSummary(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ['attendance', 'summary', fromDate, toDate],
    queryFn: () => attendanceApi.summary({ fromDate, toDate }),
    enabled: !!fromDate && !!toDate,
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance'] }),
  });
}
