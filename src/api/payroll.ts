import { api, unwrap } from './client';

export interface CreatePayrollRunPayload {
  year: number;
  month: number;
  payDate?: string;
  policy?: 'CALENDAR_DAYS' | 'WORKING_DAYS' | 'FIXED_MONTHLY';
}

export interface PayrollAdjustmentPayload {
  type: 'ARREAR' | 'BONUS' | 'RECOVERY' | 'OTHER_EARNING' | 'OTHER_DEDUCTION';
  name: string;
  amount: number;
  isAddition?: boolean;
  reason: string;
  description?: string;
}

export const payrollApi = {
  list: async (params?: any) => {
    const res = await api.get('/payroll/runs', { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  get: async (id: string) => unwrap(await api.get(`/payroll/runs/${id}`)).data,
  summary: async (id: string) => unwrap(await api.get(`/payroll/runs/${id}/summary`)).data,
  create: async (p: CreatePayrollRunPayload) => unwrap(await api.post('/payroll/runs', p)).data,
  calculate: async (id: string, policy?: string) => unwrap(await api.post(`/payroll/runs/${id}/calculate`, { policy })).data,
  recalculate: async (id: string, policy?: string) => unwrap(await api.post(`/payroll/runs/${id}/recalculate`, { policy })).data,
  submit: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/submit`)).data,
  approve: async (id: string, comments?: string) => unwrap(await api.post(`/payroll/runs/${id}/approve`, { comments })).data,
  finalize: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/finalize`)).data,
  cancel: async (id: string) => unwrap(await api.post(`/payroll/runs/${id}/cancel`)).data,
  
  employees: async (id: string, params?: any) => {
    const res = await api.get(`/payroll/runs/${id}/employees`, { params });
    return { data: (res.data as any).data, meta: (res.data as any).meta };
  },
  employee: async (runId: string, employeeId: string) =>
    unwrap(await api.get(`/payroll/runs/${runId}/employees/${employeeId}`)).data,
  components: async (runId: string, employeeId: string) =>
    unwrap(await api.get(`/payroll/runs/${runId}/employees/${employeeId}/components`)).data,

  addAdjustment: async (runId: string, employeeId: string, data: PayrollAdjustmentPayload) =>
    unwrap(await api.post(`/payroll/runs/${runId}/employees/${employeeId}/adjustments`, data)).data,
  listAdjustments: async (runId: string, employeeId: string) =>
    unwrap(await api.get(`/payroll/runs/${runId}/employees/${employeeId}/adjustments`)).data,
  deleteAdjustment: async (adjustmentId: string) =>
    unwrap(await api.delete(`/payroll/adjustments/${adjustmentId}`)).data,

  generatePayslips: async (runId: string) =>
    unwrap(await api.post(`/payroll/runs/${runId}/payslips/generate`)).data,
};
