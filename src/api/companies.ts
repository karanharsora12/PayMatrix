import { api, unwrap } from './client';
export const companyApi = {
  list: async (params?: any) => {
    const res = await api.get('/companies', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/companies/${id}`)).data,
  create: async (payload: any) => unwrap(await api.post('/companies', payload)).data,
  update: async (id: string, payload: any) => unwrap(await api.patch(`/companies/${id}`, payload)).data,
  remove: async (id: string) => unwrap(await api.delete(`/companies/${id}`)).data,
  getWorkPolicy: async (id: string) => unwrap(await api.get(`/companies/${id}/work-policy`)).data,
  updateWorkPolicy: async (id: string, payload: any) => unwrap(await api.put(`/companies/${id}/work-policy`, payload)).data,
  previewCalendar: async (id: string, year: number, month: number) => unwrap(await api.get(`/companies/${id}/calendar-preview`, { params: { year, month } })).data,
};

