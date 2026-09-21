import { api, unwrap } from './client';

export const payslipsApi = {
  list: async (params?: any) => {
    const res = await api.get('/payslips', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/payslips/${id}`)).data,
  getByEmployee: async (employeeId: string) =>
    unwrap(await api.get(`/employees/${employeeId}/payslips`)).data,
  pdf: async (id: string) => unwrap(await api.get(`/payslips/${id}/pdf`)).data,
};
