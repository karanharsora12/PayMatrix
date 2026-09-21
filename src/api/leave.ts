import { api, unwrap } from './client';

export interface LeaveType {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string | null;
  isPaid: boolean;
  annualAllowance: string | number;
  carryForwardAllowed: boolean;
  maxCarryForwardDays?: string | number | null;
  maxConsecutiveDays?: number | null;
  requiresApproval: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  companyId: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  totalDays: string | number;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    department?: { id: string; name: string };
    designation?: { id: string; name: string };
  };
  leaveType?: LeaveType;
}

export interface EmployeeLeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  openingBalance: string | number;
  allocatedDays: string | number;
  usedDays: string | number;
  pendingDays: string | number;
  remainingDays: string | number;
  leaveType?: LeaveType;
}

export const leaveApi = {
  types: async (params?: any) => {
    const res = await api.get('/leave/types', { params });
    return { data: (res.data as any).data as LeaveType[], meta: (res.data as any).meta };
  },
  getType: async (id: string) => unwrap(await api.get(`/leave/types/${id}`)).data as LeaveType,
  createType: async (payload: Partial<LeaveType>) => unwrap(await api.post('/leave/types', payload)).data as LeaveType,
  updateType: async (id: string, payload: Partial<LeaveType>) => unwrap(await api.patch(`/leave/types/${id}`, payload)).data as LeaveType,
  deleteType: async (id: string) => unwrap(await api.delete(`/leave/types/${id}`)).data,

  requests: async (params?: any) => {
    const res = await api.get('/leave/requests', { params });
    return { data: (res.data as any).data as LeaveRequest[], meta: (res.data as any).meta };
  },
  getRequest: async (id: string) => unwrap(await api.get(`/leave/requests/${id}`)).data as LeaveRequest,
  createRequest: async (payload: { employeeId: string; leaveTypeId: string; fromDate: string; toDate: string; reason?: string }) =>
    unwrap(await api.post('/leave/requests', payload)).data as LeaveRequest,
  approve: async (id: string) => unwrap(await api.post(`/leave/requests/${id}/approve`)).data as LeaveRequest,
  reject: async (id: string, rejectionReason: string) =>
    unwrap(await api.post(`/leave/requests/${id}/reject`, { rejectionReason })).data as LeaveRequest,
  cancel: async (id: string) => unwrap(await api.post(`/leave/requests/${id}/cancel`)).data as LeaveRequest,

  balances: async (employeeId: string, year?: number) =>
    unwrap(await api.get(`/leave/employees/${employeeId}/balances`, { params: { year } })).data as EmployeeLeaveBalance[],
  calendar: async (params?: { fromDate?: string; toDate?: string; departmentId?: string; branchId?: string; employeeId?: string; leaveTypeId?: string }) =>
    unwrap(await api.get('/leave/calendar', { params })).data as LeaveRequest[],
};
