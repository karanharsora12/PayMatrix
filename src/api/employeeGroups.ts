import { api, unwrap } from './client';

export const employeeGroupApi = {
  list: async (params?: any) => {
    const res = await api.get('/employee-groups', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/employee-groups/${id}`)).data,
  create: async (p: any) => unwrap(await api.post('/employee-groups', p)).data,
  update: async (id: string, p: any) => unwrap(await api.patch(`/employee-groups/${id}`, p)).data,
  remove: async (id: string) => unwrap(await api.delete(`/employee-groups/${id}`)).data,
};
