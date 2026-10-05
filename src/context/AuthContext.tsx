import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import type { AuthUser } from '@/api/auth';
import { useAppDispatch } from '@/store';
import {
  fetchUserParameters,
  clearUserParameters,
} from '@/store/slices/userParametersSlice';
import { toast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (perm: string) => boolean;
};

const AuthContext = createContext<AuthContextType>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      dispatch(clearUserParameters());
      return;
    }
    authApi
      .me()
      .then((userData) => {
        setUser(userData);
        dispatch(fetchUserParameters());
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch(clearUserParameters());
      })
      .finally(() => setLoading(false));
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    await dispatch(fetchUserParameters());
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    dispatch(clearUserParameters());
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
      variant: "info",
    });
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    if (user.roles.includes('SUPER_ADMIN')) return true;
    return user.permissions.includes(perm) || user.permissions.includes('*');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
