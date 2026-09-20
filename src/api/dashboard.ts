import { api, unwrap } from './client';
export const dashboardApi = {
  summary: async () => unwrap(await api.get('/dashboard/summary')).data,
};
