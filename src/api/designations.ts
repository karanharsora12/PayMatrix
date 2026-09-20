import { api, unwrap } from './client';
export const designationApi = {
  list: async (params?: any) => {
    const res = await api.get('/designations', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/designations/${id}`)).data,
  create: async (p: any) => unwrap(await api.post('/designations', p)).data,
  update: async (id: string, p: any) => unwrap(await api.patch(`/designations/${id}`, p)).data,
  remove: async (id: string) => unwrap(await api.delete(`/designations/${id}`)).data,
};
