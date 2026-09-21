import { api, unwrap } from './client';
import type { SalaryStructureItem } from './salaryStructures';

export interface EmployeeSalaryComponentOverride {
  id?: string;
  employeeSalaryStructureId?: string;
  salaryComponentId: string;
  calculationType: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  amount?: number | string | null;
  percentage?: number | string | null;
  percentageOf?: string | null;
  formula?: string | null;
  reason?: string | null;
  salaryComponent?: any;
}

export interface EmployeeSalaryAssignmentItem {
  id: string;
  companyId: string;
  employeeId: string;
  salaryStructureId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  basicSalary?: string | number | null;
  grossSalary?: string | number | null;
  annualCtc?: string | number | null;
  status: 'ACTIVE' | 'HISTORICAL' | 'CANCELLED';
  reason?: string | null;
  notes?: string | null;
  remarks?: string | null;
  salaryStructure?: SalaryStructureItem;
  components?: EmployeeSalaryComponentOverride[];
  createdAt: string;
  updatedAt: string;
}

export const employeeSalaryApi = {
  getEmployeeSalary: async (employeeId: string) => {
    return unwrap(await api.get(`/employees/${employeeId}/salary`)).data;
  },
  getEmployeeSalaryHistory: async (employeeId: string) => {
    return unwrap(await api.get(`/employees/${employeeId}/salary/history`)).data as EmployeeSalaryAssignmentItem[];
  },
  assignOrReviseSalary: async (employeeId: string, data: any) => {
    return unwrap(await api.post(`/employees/${employeeId}/salary`, data)).data as EmployeeSalaryAssignmentItem;
  },
  cancelSalary: async (employeeId: string, salaryId: string, data?: { reason?: string }) => {
    return unwrap(await api.post(`/employees/${employeeId}/salary/${salaryId}/cancel`, data || {})).data;
  },
  getSalaryPreview: async (employeeId: string, params?: { month?: string; policy?: string }) => {
    return unwrap(await api.get(`/employees/${employeeId}/salary/preview`, { params })).data;
  },
};
