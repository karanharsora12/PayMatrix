import { api, unwrap } from './client';
export const reportsApi = {
  employees: async (params: any) => unwrap(await api.get('/reports/employees', { params })).data,
  attendance: async (params: any) => unwrap(await api.get('/reports/attendance', { params })).data,
  leave: async (params: any) => unwrap(await api.get('/reports/leave', { params })).data,
  payroll: async (params: any) => unwrap(await api.get('/reports/payroll', { params })).data,
  bankPayment: async (payrollRunId: string) => unwrap(await api.get('/reports/bank-payment', { params: { payrollRunId } })).data,
};
