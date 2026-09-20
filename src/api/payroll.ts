import { api, unwrap } from './client';
export const payrollApi = {
  list: async (params?: any) => {
    const res = await api.get('/payroll/runs', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/payroll/runs/${id}`)).data,
  create: async (p: any) => unwrap(await api.post('/payroll/runs', p)).data,
  calculate: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/calculate`)).data,
  recalculate: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/recalculate`)).data,
  submit: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/submit`)).data,
  approve: async (id: string, comments?: string) => unwrap(await api.post(`/payroll/runs/${id}/approve`, { comments })).data,
  finalize: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/finalize`)).data,
  cancel: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/cancel`)).data,
  payslips: async (payrollId: string) => unwrap(await api.get(`/payroll/runs/${payrollId}/payslips`)).data,
  payslipPdf: async (id: string) => unwrap(await api.get(`/payroll/payslips/${id}/pdf`)).data,
};
