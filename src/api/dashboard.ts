import { api, unwrap } from './client';

export type DashboardPeriod = 'day' | 'week' | 'month';
export type DashboardScope = 'ORG' | 'SELF';

export interface DashboardCompany {
  id: string;
  name: string;
  currency: string | null;
  timezone: string | null;
}

export interface DashboardAccess {
  employees: boolean;
  attendance: boolean;
  attendanceScope: DashboardScope | null;
  leave: boolean;
  leaveScope: DashboardScope | null;
  payroll: boolean;
  payrollScope: DashboardScope | null;
  documents: boolean;
  documentsScope: DashboardScope | null;
  activity: boolean;
  events: boolean;
  canManageAttendance: boolean;
  canManageLeave: boolean;
}

export interface DashboardEmployees {
  total: number;
  active: number;
  inactive: number;
  joinedThisMonth: number;
  distribution: {
    departments: { name: string; count: number }[];
    designations: { name: string; count: number }[];
    employmentTypes: { name: string; count: number }[];
  };
}

export interface DashboardAttendancePoint {
  date: string;
  present: number;
  late: number;
  halfDay: number;
  onLeave: number;
  absent: number;
  holiday: number;
  weekOff: number;
  records: number;
  presentTotal: number;
}

export interface DashboardAttendanceRow {
  id: string;
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  department: string | null;
  designation: string | null;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  overtimeMinutes: number;
  remarks: string | null;
  shift: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    isNightShift: boolean;
    effectiveFrom: string;
  } | null;
}

export interface DashboardAttendance {
  scope: DashboardScope;
  today: {
    date: string;
    totalEmployees: number;
    present: number;
    presentOnly: number;
    late: number;
    halfDay: number;
    onLeave: number;
    absent: number;
    holiday: number;
    attendanceRate: number;
    overtimeMinutes: number;
  };
  series: DashboardAttendancePoint[];
  todayRows: DashboardAttendanceRow[];
  todayRowsTotal: number;
}

export interface DashboardLeave {
  scope: DashboardScope;
  period: {
    approved: number;
    pending: number;
    rejected: number;
    cancelled: number;
    approvedDays: number;
    pendingDays: number;
  };
  byType: { leaveTypeId: string; name: string; count: number }[];
  onLeaveToday: number;
}

export interface DashboardPayrollMonth {
  month: string;
  gross: number;
  deductions: number;
  net: number;
  runs: number;
  employees?: number;
}

export interface DashboardPayroll {
  scope: DashboardScope;
  monthly: DashboardPayrollMonth[];
  current: {
    id: string;
    month: string | null;
    status: string;
    gross: number;
    deductions: number;
    net: number;
    employeeCount: number;
    finalizedAt: string | null;
    payDate: string | null;
  } | null;
  payslips: { total: number; currentPeriod: number };
}

export interface DashboardDocuments {
  scope: DashboardScope;
  total: number;
  byStatus: Record<string, number>;
  pending: number;
  completed: number;
  acknowledged: number;
  available: number;
}

export interface DashboardActivityItem {
  id: string;
  module: string;
  entityType: string | null;
  action: string;
  entityId: string | null;
  createdAt: string;
  actor: string | null;
}

export interface DashboardEvents {
  holidays: { id: string; name: string; date: string; type: string }[];
  birthdays: { employeeId: string; name: string; date: string; turning: number }[];
  anniversaries: { employeeId: string; name: string; date: string; years: number }[];
}

export interface DashboardSelf {
  employeeId: string;
  name: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
  branch: string | null;
  shift: {
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    isNightShift: boolean;
    effectiveFrom: string;
  } | null;
  todayAttendance: {
    status: string;
    checkIn: string | null;
    checkOut: string | null;
  } | null;
}

export interface DashboardSummaryData {
  generatedAt: string;
  period: DashboardPeriod;
  range: { from: string; to: string };
  company: DashboardCompany | null;
  access: DashboardAccess;
  employees: DashboardEmployees | null;
  attendance: DashboardAttendance | null;
  leave: DashboardLeave | null;
  payroll: DashboardPayroll | null;
  documents: DashboardDocuments | null;
  activity: DashboardActivityItem[] | null;
  events: DashboardEvents | null;
  self: DashboardSelf | null;
  errors: Record<string, string>;
}

export const dashboardApi = {
  summary: async (period: DashboardPeriod = 'week'): Promise<DashboardSummaryData> =>
    (unwrap(await api.get('/dashboard/summary', { params: { period } })).data) as DashboardSummaryData,
};
