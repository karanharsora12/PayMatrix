import { api, unwrap } from './client';

export interface SalaryComponentItem {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  componentType: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION' | 'REIMBURSEMENT';
  calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  defaultAmount?: number | null;
  defaultPercentage?: number | null;
  calculationBasis?: string | null;
  formula?: string | null;
  isTaxable: boolean;
  isStatutory: boolean;
  isRecurring: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const salaryComponentsApi = {
  getComponents: async (params?: any) => {
    const res = await api.get('/salary/components', { params });
    return { data: (res.data as any).data as SalaryComponentItem[], meta: (res.data as any).meta };
  },
  getComponent: async (id: string) => {
    return unwrap(await api.get(`/salary/components/${id}`)).data as SalaryComponentItem;
  },
  createComponent: async (data: any) => {
    return unwrap(await api.post('/salary/components', data)).data as SalaryComponentItem;
  },
  updateComponent: async (id: string, data: any) => {
    return unwrap(await api.patch(`/salary/components/${id}`, data)).data as SalaryComponentItem;
  },
  deleteComponent: async (id: string) => {
    return unwrap(await api.delete(`/salary/components/${id}`)).data;
  },
};
