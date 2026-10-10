import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { authApi } from "@/api/auth";
import type { AuthUser } from "@/api/auth";
import { useAppDispatch } from "@/store";
import {
  fetchUserParameters,
  clearUserParameters,
} from "@/store/slices/userParametersSlice";
import { toast } from "@/components/ui/use-toast";
import { checkPermission } from "@/components/common/PermissionGuard";

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<AuthUser | null>;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  hasAllPermissions: (perms: string[]) => boolean;
  can: (module: string, action: string) => boolean;
};

const AuthContext = createContext<AuthContextType>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  const loadCurrentUser = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      dispatch(clearUserParameters());
      return null;
    }
    try {
      const userData = await authApi.me();
      setUser(userData);
      dispatch(fetchUserParameters());
      return userData;
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      dispatch(clearUserParameters());
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCurrentUser();
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

  const refetchUser = async () => {
    return loadCurrentUser();
  };

  const hasPermission = (perm: string) => {
    if (!user) return false;
    return checkPermission(user.permissions, user.roles, perm);
  };

  const hasAnyPermission = (perms: string[]) => {
    if (!user) return false;
    if (user.roles?.includes("SUPER_ADMIN")) return true;
    return perms.some((p) => checkPermission(user.permissions, user.roles, p));
  };

  const hasAllPermissions = (perms: string[]) => {
    if (!user) return false;
    if (user.roles?.includes("SUPER_ADMIN")) return true;
    return perms.every((p) => checkPermission(user.permissions, user.roles, p));
  };

  const can = (module: string, action: string) => {
    return hasPermission(`${module}.${action}`);
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refetchUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      can,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be within AuthProvider");
  return ctx;
}
