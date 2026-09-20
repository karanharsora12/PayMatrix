import { api, unwrap } from './client';
export const branchApi = {
  list: async (params?: any) => {
    const res = await api.get('/branches', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/branches/${id}`)).data,
  create: async (payload: any) => unwrap(await api.post('/branches', payload)).data,
  update: async (id: string, payload: any) => unwrap(await api.patch(`/branches/${id}`, payload)).data,
  remove: async (id: string) => unwrap(await api.delete(`/branches/${id}`)).data,
};
