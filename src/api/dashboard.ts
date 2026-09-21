import { api, unwrap } from './client';

export const dashboardApi = {
  summary: async (): Promise<any> => (unwrap(await api.get('/dashboard/summary')).data) as any,
};
