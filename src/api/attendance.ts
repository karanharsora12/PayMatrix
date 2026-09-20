import { api, unwrap } from './client';
export const attendanceApi = {
  list: async (params: any) => {
    const res = await api.get('/attendance', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  summary: async (params: { fromDate: string; toDate: string }) => unwrap(await api.get('/attendance/summary', { params })).data,
  calendar: async (employeeId: string, month: string) => unwrap(await api.get('/attendance/calendar', { params: { employeeId, month } })).data,
  create: async (payload: any) => unwrap(await api.post('/attendance', payload)).data,
  update: async (id: string, payload: any) => unwrap(await api.patch(`/attendance/${id}`, payload)).data,
};
