import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '@/api/attendance';

export function useAttendance(params?: any) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceApi.list(params),
  });
}

export function useAttendanceSummary(params?: { date?: string; fromDate?: string; toDate?: string; branchId?: string; departmentId?: string }) {
  return useQuery({
    queryKey: ['attendance', 'summary', params],
    queryFn: () => attendanceApi.summary(params),
  });
}

export function useAttendanceCalendar(params?: { employeeId?: string; month?: string }) {
  return useQuery({
    queryKey: ['attendance', 'calendar', params],
    queryFn: () => attendanceApi.calendar(params),
  });
}

export function useEmployeeAttendance(employeeId?: string, params?: { fromDate?: string; toDate?: string; status?: string }) {
  return useQuery({
    queryKey: ['attendance', 'employee', employeeId, params],
    queryFn: () => attendanceApi.getEmployeeAttendance(employeeId!, params),
    enabled: !!employeeId,
  });
}

export function useAttendanceLogs(params?: { employeeId?: string; fromDate?: string; toDate?: string }) {
  return useQuery({
    queryKey: ['attendance', 'logs', params],
    queryFn: () => attendanceApi.getLogs(params),
  });
}

export function useCreateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => attendanceApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}

export function useRecordPunch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.recordPunch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', 'logs'] });
      qc.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
}
