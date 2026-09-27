import { api, unwrap } from './client';

export const locationApi = {
  list: async (params?: any) => {
    const res = await api.get('/locations', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/locations/${id}`)).data,
  create: async (payload: any) => unwrap(await api.post('/locations', payload)).data,
  update: async (id: string, payload: any) => unwrap(await api.patch(`/locations/${id}`, payload)).data,
  remove: async (id: string) => unwrap(await api.delete(`/locations/${id}`)).data,
};
