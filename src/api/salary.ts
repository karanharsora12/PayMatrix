import { api, unwrap } from './client';
export const salaryApi = {
  components: async (params?: any) => {
    const res = await api.get('/salary/components', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  createComponent: async (p: any) => unwrap(await api.post('/salary/components', p)).data,
  structures: async (params?: any) => {
    const res = await api.get('/salary/structures', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  getStructure: async (id: string) => unwrap(await api.get(`/salary/structures/${id}`)).data,
  createStructure: async (p: any) => unwrap(await api.post('/salary/structures', p)).data,
  preview: async (p: any) => unwrap(await api.post('/salary/preview', p)).data,
  employeeSalary: async (employeeId: string) => unwrap(await api.get(`/salary/employees/${employeeId}`)).data,
  employeeHistory: async (employeeId: string) => unwrap(await api.get(`/salary/employees/${employeeId}/history`)).data,
  assign: async (employeeId: string, p: any) => unwrap(await api.post(`/salary/employees/${employeeId}/assign`, p)).data,
};
