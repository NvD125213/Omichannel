"use client";

import {
  clearTokens,
  getAccessToken,
  isAuthenticated as checkAuthenticated,
  setTokens,
} from "@/lib/auth";
import { loginApi } from "@/services/auth/sign-in";
import { logoutApi } from "@/services/auth/log-out";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Permission } from "@/constants/permission";
import { useNavigationEvents } from "@/hooks/use-navigation-events";
import { useMe } from "@/hooks/user/use-me";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentUserApi } from "@/services/user/user-current";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthPending: boolean;
  login: (
    name_tenant: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function createUserFromMe(meData: {
  id: string;
  username: string;
  fullname: string;
  email: string;
  role: string;
  level: string;
  tenant_id: string;
  graph_id: string;
  graph_activated: number;
  is_active: number;
  permissions: string[];
}): User {
  return {
    id: meData.id,
    username: meData.username,
    fullname: meData.fullname,
    email: meData.email,
    role: meData.role,
    level: meData.level,
    tenant_id: meData.tenant_id,
    graph_id: meData.graph_id,
    graph_activated: meData.graph_activated,
    is_active: meData.is_active,
    permissions: meData.permissions || [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isLoggingOutRef = useRef(false);

  useNavigationEvents();

  const hasToken = Boolean(getAccessToken());
  const {
    data: meData,
    isPending,
    isFetching,
    isError,
  } = useMe();

  const user = meData ? createUserFromMe(meData) : null;
  const permissions = useMemo(
    () => (meData?.permissions ?? []) as Permission[],
    [meData?.permissions],
  );

  // Một nguồn sự thật: đang chờ /user/current khi còn token
  const isLoading = hasToken && (isPending || (isFetching && !meData));
  const isAuthPending = isLoading;
  const isAuthenticated = !!user && checkAuthenticated();

  const hasPermission = useCallback(
    (permission: Permission): boolean => permissions.includes(permission),
    [permissions],
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      if (!requiredPermissions?.length) return true;
      return requiredPermissions.some((permission) =>
        permissions.includes(permission),
      );
    },
    [permissions],
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      if (!requiredPermissions?.length) return true;
      return requiredPermissions.every((permission) =>
        permissions.includes(permission),
      );
    },
    [permissions],
  );

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      clearTokens();
      await queryClient.cancelQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["me"] });
      router.push("/sign-in");
    }
  }, [router, queryClient]);

  const login = useCallback(
    async (name_tenant: string, username: string, password: string) => {
      isLoggingOutRef.current = false;
      const response = await loginApi({ name_tenant, username, password });
      setTokens(response.data.access_token, response.data.refresh_token);
      await queryClient.fetchQuery({
        queryKey: ["me"],
        queryFn: getCurrentUserApi,
      });
    },
    [queryClient],
  );

  useLayoutEffect(() => {
    if (!isError || !getAccessToken() || isLoggingOutRef.current) return;

    console.error("Session validation failed");
    toast.error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
    void logout();
  }, [isError, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAuthPending,
        login,
        logout,
        permissions,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
