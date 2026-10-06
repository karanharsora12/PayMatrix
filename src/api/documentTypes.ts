import { api, unwrap } from './client';

export const documentTypesApi = {
  list: async (params?: any) => {
    const res = await api.get('/document-types', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/document-types/${id}`)).data,
  create: async (p: any) => unwrap(await api.post('/document-types', p)).data,
  update: async (id: string, p: any) => unwrap(await api.patch(`/document-types/${id}`, p)).data,
  activate: async (id: string) => unwrap(await api.post(`/document-types/${id}/activate`)).data,
  deactivate: async (id: string) => unwrap(await api.post(`/document-types/${id}/deactivate`)).data,
  remove: async (id: string) => unwrap(await api.delete(`/document-types/${id}`)).data,
  getVariables: async (id: string) => unwrap(await api.get(`/document-types/${id}/variables`)).data,
};
