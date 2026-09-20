import { api, unwrap } from './client';
export const leaveApi = {
  types: async (params?: any) => {
    const res = await api.get('/leave/types', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  createType: async (p: any) => unwrap(await api.post('/leave/types', p)).data,
  requests: async (params: any) => {
    const res = await api.get('/leave/requests', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  createRequest: async (p: any) => unwrap(await api.post('/leave/requests', p)).data,
  approve: async (id: string) => unwrap(await api.post(`/leave/requests/${id}/approve`)).data,
  reject: async (id: string, reason?: string) => unwrap(await api.post(`/leave/requests/${id}/reject`, { reason })).data,
  cancel: async (id: string) => unwrap(await api.post(`/leave/requests/${id}/cancel`)).data,
  balances: async (employeeId: string) => unwrap(await api.get(`/leave/employees/${employeeId}/balances`)).data,
  calendar: async (from: string, to: string) => unwrap(await api.get('/leave/calendar', { params: { from, to } })).data,
};
