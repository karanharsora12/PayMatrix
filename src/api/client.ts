import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 refresh + normalize errors
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const original: any = error.config;
    const status = error.response?.status;
    const data: any = error.response?.data;

    // Normalize error shape to match backend { success:false, error:{code,message} }
    const normalized = data?.error ?? { code: 'UNKNOWN', message: error.message, details: data };

    if (status === 401 && !original._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
        return Promise.reject(normalized);
      }
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccess = res.data?.data?.accessToken ?? res.data?.accessToken;
        localStorage.setItem('accessToken', newAccess);
        processQueue(null, newAccess);
        original.headers.Authorization = `Bearer ${newAccess}`;
        return api(original);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(normalized);
      } finally {
        isRefreshing = false;
      }
    }

    // Attach normalized error for hooks
    (error as any).normalizedError = normalized;
    return Promise.reject(error);
  },
);

// Helper to unwrap backend wrapper { success, data, meta }
export function unwrap<T>(res: any): { data: T; meta?: any; message?: string } {
  const body = res.data;
  if (body && typeof body === 'object' && 'success' in body) {
    return { data: body.data as T, meta: body.meta, message: body.message };
  }
  return { data: body as T };
}

export type Paginated<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};
