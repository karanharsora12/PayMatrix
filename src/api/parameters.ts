import { api, unwrap } from './client';

export interface ParameterDefinition {
  srNo: number;
  name: string;
  description: string;
  defaultValue: boolean | string;
  defaultValueLabel: string;
  type: 'boolean' | 'string';
}

export interface UserWiseParameterRow {
  srNo: number;
  id: string | null;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designationName: string;
  parameterName: string;
  parameterDescription: string;
  parameterValue: boolean | string;
  parameterValueLabel: string;
  defaultValue: boolean | string;
  defaultValueLabel: string;
  isConfigured: boolean;
  updatedAt: string | null;
}

export interface UpsertUserParameterPayload {
  employeeId?: string;
  userId?: string;
  parameterName: string;
  parameterValue: boolean | string;
}

export const parametersApi = {
  getMyParameters: async (): Promise<Record<string, boolean | string>> => {
    const res = await api.get('/user-parameters/me');
    return unwrap<Record<string, boolean | string>>(res).data;
  },

  getDefinitions: async (): Promise<ParameterDefinition[]> => {
    const res = await api.get('/user-parameters/definitions');
    return unwrap<ParameterDefinition[]>(res).data;
  },

  listUserParameters: async (params?: {
    search?: string;
    parameterName?: string;
  }): Promise<{ data: UserWiseParameterRow[]; total: number; parameterDefinition: ParameterDefinition }> => {
    const res = await api.get('/user-parameters', { params });
    const unwrapped = unwrap<any>(res);
    return {
      data: unwrapped.data,
      total: (res.data as any).total ?? unwrapped.data?.length ?? 0,
      parameterDefinition: (res.data as any).parameterDefinition,
    };
  },

  getEmployeeParameters: async (employeeId: string) => {
    const res = await api.get(`/user-parameters/${employeeId}`);
    return unwrap(res).data;
  },

  upsertUserParameter: async (payload: UpsertUserParameterPayload) => {
    const res = await api.post('/user-parameters', payload);
    return unwrap(res).data;
  },

  batchUpsertUserParameters: async (payload: {
    parameterName: string;
    items: { employeeId: string; parameterValue: boolean | string }[];
  }) => {
    const res = await api.post('/user-parameters/batch', payload);
    return unwrap(res).data;
  },
};
