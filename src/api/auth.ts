import { api, unwrap } from './client';

export type LoginPayload = { email: string; password: string };
export type AuthUser = { id: string; email: string; companyId: string | null; roles: string[]; permissions: string[] };

export const authApi = {
  login: async (payload: LoginPayload) => {
    const res = await api.post('/auth/login', payload);
    const { data } = unwrap<{ accessToken: string; refreshToken: string; user: AuthUser }>(res);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data;
  },
  refresh: async (refreshToken: string) => {
    const res = await api.post('/auth/refresh', { refreshToken });
    const { data } = unwrap<{ accessToken: string }>(res);
    localStorage.setItem('accessToken', data.accessToken);
    return data;
  },
  me: async () => {
    const res = await api.get('/auth/me');
    return unwrap<AuthUser>(res).data;
  },
  logout: async () => {
    await api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
  changePassword: async (payload: { oldPassword: string; newPassword: string }) => {
    const res = await api.post('/auth/change-password', payload);
    return unwrap(res).data;
  },
};
