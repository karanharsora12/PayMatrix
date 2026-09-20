import { api, unwrap } from './client';
import type { Paginated } from './client';
export const departmentApi = {
  list: async (params?: any) => {
    const res = await api.get('/departments', { params });
    const b: any = res.data;
    return { data: b.data, meta: b.meta } as any;
  },
  get: async (id: string) => unwrap(await api.get(`/departments/${id}`)).data,
  create: async (payload: any) => unwrap(await api.post('/departments', payload)).data,
  update: async (id: string, payload: any) => unwrap(await api.patch(`/departments/${id}`, payload)).data,
  remove: async (id: string) => unwrap(await api.delete(`/departments/${id}`)).data,
  employees: async (id: string, params?: any) => {
    const res = await api.get(`/departments/${id}/employees`, { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
};
