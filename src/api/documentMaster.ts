import { api, unwrap } from './client';

export const documentMasterApi = {
  stats: async () => {
    const res = await api.get('/document-master/stats');
    return unwrap<any>(res).data;
  },
  list: async (params?: any) => {
    const res = await api.get('/document-master', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/document-master/${id}`)).data,
  create: async (p: any) => unwrap(await api.post('/document-master', p)).data,
  update: async (id: string, p: any) => unwrap(await api.patch(`/document-master/${id}`, p)).data,
  activate: async (id: string) => unwrap(await api.post(`/document-master/${id}/activate`)).data,
  deactivate: async (id: string) => unwrap(await api.post(`/document-master/${id}/deactivate`)).data,
  duplicate: async (id: string) => unwrap(await api.post(`/document-master/${id}/duplicate`)).data,
  remove: async (id: string) => unwrap(await api.delete(`/document-master/${id}`)).data,
};
