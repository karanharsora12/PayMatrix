import { api, unwrap } from './client';
import type { Paginated } from './client';

export type Employee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  employmentStatus: string;
  joiningDate: string;
  branch?: any;
  department?: any;
  designation?: any;
  manager?: any;
};

export type EmployeeFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const employeeApi = {
  list: async (filters: EmployeeFilters) => {
    const res = await api.get('/employees', { params: filters });
    const body: any = res.data;
    return { data: body.data as Employee[], meta: body.meta } as Paginated<Employee> & { data: Employee[] };
  },
  get: async (id: string) => {
    const res = await api.get(`/employees/${id}`);
    return unwrap<Employee & { addresses: any[]; banks: any[]; docs: any[] }>(res).data;
  },
  create: async (payload: any) => {
    const res = await api.post('/employees', payload);
    return unwrap<Employee>(res).data;
  },
  update: async (id: string, payload: any) => {
    const res = await api.patch(`/employees/${id}`, payload);
    return unwrap<Employee>(res).data;
  },
  remove: async (id: string) => {
    const res = await api.delete(`/employees/${id}`);
    return unwrap(res).data;
  },
  history: async (id: string) => {
    const res = await api.get(`/employees/${id}/history`);
    return unwrap<any[]>(res).data;
  },
  // Nested
  salary: async (id: string) => {
    const res = await api.get(`/salary/employees/${id}`);
    return unwrap(res).data;
  },
  attendance: async (id: string, params?: any) => {
    const res = await api.get('/attendance', { params: { employeeId: id, ...params } });
    return unwrap(res).data;
  },
  payslips: async (id: string) => {
    const res = await api.get(`/payroll/employees/${id}/payslips`).catch(() => ({ data: { data: [] } } as any));
    return unwrap(res).data;
  },
};
