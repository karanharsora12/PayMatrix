import { api, unwrap } from './client';

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  holidayDate: string;
  holidayType: 'NATIONAL' | 'FESTIVAL' | 'WEEKLY_OFF' | 'RESTRICTED';
  description?: string | null;
  isOptional: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const holidaysApi = {
  list: async (params?: { year?: number; month?: number; holidayType?: string; isOptional?: boolean; page?: number; pageSize?: number }) => {
    const res = await api.get('/holidays', { params });
    return { data: (res.data as any).data as Holiday[], meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/holidays/${id}`)).data as Holiday,
  create: async (payload: Partial<Holiday>) => unwrap(await api.post('/holidays', payload)).data as Holiday,
  update: async (id: string, payload: Partial<Holiday>) => unwrap(await api.patch(`/holidays/${id}`, payload)).data as Holiday,
  delete: async (id: string) => unwrap(await api.delete(`/holidays/${id}`)).data,
};
