import { api, unwrap } from './client';

export interface AttendanceRecord {
  id: string;
  companyId: string;
  employeeId: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  workingMinutes: number | null;
  breakMinutes: number | null;
  overtimeMinutes: number | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEK_OFF' | 'ON_DUTY' | 'WFH';
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
    branch?: { id: string; name: string };
  };
}

export interface AttendanceSummary {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  onLeave: number;
  holiday: number;
  overtimeMinutes: number;
}

export interface AttendancePunchLog {
  id: string;
  companyId: string;
  employeeId: string;
  punchTime: string;
  punchType: 'IN' | 'OUT' | 'BREAK_IN' | 'BREAK_OUT';
  source: string;
  deviceId?: string | null;
  createdAt: string;
  employee?: {
    employeeCode: string;
    firstName: string;
    lastName: string;
  };
}

export const attendanceApi = {
  list: async (params?: any) => {
    const res = await api.get('/attendance', { params });
    return { data: (res.data as any).data as AttendanceRecord[], meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/attendance/${id}`)).data as AttendanceRecord,
  summary: async (params?: { date?: string; fromDate?: string; toDate?: string; branchId?: string; departmentId?: string }) =>
    unwrap(await api.get('/attendance/summary', { params })).data as AttendanceSummary,
  calendar: async (params?: { employeeId?: string; month?: string }) =>
    unwrap(await api.get('/attendance/calendar', { params })).data as AttendanceRecord[],
  create: async (payload: Partial<AttendanceRecord>) =>
    unwrap(await api.post('/attendance', payload)).data as AttendanceRecord,
  update: async (id: string, payload: Partial<AttendanceRecord>) =>
    unwrap(await api.patch(`/attendance/${id}`, payload)).data as AttendanceRecord,
  getEmployeeAttendance: async (employeeId: string, params?: { fromDate?: string; toDate?: string; status?: string }) =>
    unwrap(await api.get(`/attendance/employees/${employeeId}`, { params })).data as AttendanceRecord[],
  getLogs: async (params?: { employeeId?: string; fromDate?: string; toDate?: string }) =>
    unwrap(await api.get('/attendance/logs', { params })).data as AttendancePunchLog[],
  recordPunch: async (payload: { employeeId: string; punchTime: string; punchType: string; source?: string; deviceId?: string }) =>
    unwrap(await api.post('/attendance/logs', payload)).data as AttendancePunchLog,
};
