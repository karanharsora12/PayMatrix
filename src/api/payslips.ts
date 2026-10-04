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
  downloadPdf: async (id: string, filename?: string) => {
    const response = await api.get(`/payslips/${id}/download-pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `Payslip_${id.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  calculatePreview: async (data: {
    employeeId: string;
    year: number;
    month: number;
    policy?: string;
  }) => unwrap(await api.post('/payslips/calculate-preview', data)).data,
  generateSingle: async (data: {
    employeeId: string;
    year: number;
    month: number;
    policy?: string;
  }) => unwrap(await api.post('/payslips/generate-single', data)).data,
  sendEmail: async (id: string) => unwrap(await api.post(`/payslips/${id}/send-email`)).data,
  retryEmail: async (id: string) => unwrap(await api.post(`/payslips/${id}/retry-email`)).data,
};

