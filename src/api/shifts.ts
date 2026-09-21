import { api, unwrap } from './client';

export interface Shift {
  id: string;
  companyId: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workingHours: string | number;
  graceMinutes: number;
  overtimeAllowed: boolean;
  isNightShift: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  shift?: Shift;
  createdAt: string;
}

export const shiftsApi = {
  list: async (params?: any) => {
    const res = await api.get('/shifts', { params });
    return { data: (res.data as any).data as Shift[], meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/shifts/${id}`)).data as Shift,
  create: async (payload: Partial<Shift>) => unwrap(await api.post('/shifts', payload)).data as Shift,
  update: async (id: string, payload: Partial<Shift>) => unwrap(await api.patch(`/shifts/${id}`, payload)).data as Shift,
  delete: async (id: string) => unwrap(await api.delete(`/shifts/${id}`)).data,
  assign: async (employeeId: string, payload: { shiftId: string; effectiveFrom: string; effectiveTo?: string }) =>
    unwrap(await api.post(`/shifts/employees/${employeeId}/assign`, payload)).data as EmployeeShiftAssignment,
  getAssignments: async (employeeId: string) =>
    unwrap(await api.get(`/shifts/employees/${employeeId}/assignments`)).data as EmployeeShiftAssignment[],
  getCurrent: async (employeeId: string, onDate?: string) =>
    unwrap(await api.get(`/shifts/employees/${employeeId}/current`, { params: { onDate } })).data as EmployeeShiftAssignment | null,
};
