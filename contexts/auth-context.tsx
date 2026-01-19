"use client";

import {
  clearTokens,
  getAccessToken,
  isAuthenticated as checkAuthenticated,
  setTokens,
} from "@/lib/auth";
import { loginApi } from "@/services/auth/sign-in";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigationEvents } from "@/hooks/use-navigation-events";
import { useMe } from "@/hooks/user/use-me";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    name_tenant: string,
    username: string,
    password: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to decode JWT and extract user info
function decodeToken(token: string): Partial<User> | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.sub || payload.user_id || payload.id || "",
      name: payload.name || payload.username || "User",
      email: payload.email || "",
      role: payload.role || "user",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Listen for navigation events (e.g., from api-client interceptors)
  useNavigationEvents();

  // useMe hook để kiểm tra session từ server
  const {
    data: meData,
    isLoading: isMeLoading,
    isSuccess: isMeSuccess,
    isError: isMeError,
  } = useMe();

  const login = useCallback(
    async (name_tenant: string, username: string, password: string) => {
      const response = await loginApi({ name_tenant, username, password });

      // Save tokens
      setTokens(response.data.access_token, response.data.refresh_token);

      // Decode and set user from token
      const userData = decodeToken(response.data.access_token);
      if (userData) {
        setUser({
          id: userData.id || "",
          name: userData.name || username,
          email: userData.email || "",
          avatar: "",
          role: userData.role || "user",
        });
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    router.push("/sign-in");
    router.refresh();
  }, [router]);

  // Effect để sync state với kết quả của useMe
  useEffect(() => {
    // Nếu đang load useMe thì chưa làm gì cả (trừ khi không có token)
    const token = getAccessToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (isMeLoading) {
      return;
    }

    if (isMeSuccess && meData) {
      // Backend trả về thông tin user hợp lệ -> Update state
      setUser({
        id: meData.id,
        name: meData.fullname || meData.username,
        email: meData.email,
        avatar: "", // Bổ sung field avatar nếu API có trả về
        role: meData.role,
        tenant_id: meData.tenant_id, // Nếu User interface hỗ trợ
      } as any);
      setIsLoading(false);
    } else if (isMeError) {
      // Backend trả về lỗi (401, etc) mặc dù có token -> Logout
      console.error("Session validation failed");
      toast.error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
      logout();
      setIsLoading(false);
    }
  }, [isMeLoading, isMeSuccess, isMeError, meData, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && checkAuthenticated(),
        isLoading,
        login,
        logout,
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
