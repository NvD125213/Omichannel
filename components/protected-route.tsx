"use client";

import { RouteLoadingScreen } from "@/components/route-loading-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Permission } from "@/constants/permission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  const {
    isAuthenticated,
    isAuthPending,
    isConnectionError,
    retryAuth,
    logout,
    hasAnyPermission,
  } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const redirectStartedRef = useRef(false);

  const hasPermission =
    !requiredPermissions ||
    requiredPermissions.length === 0 ||
    hasAnyPermission(requiredPermissions);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!isMounted || isAuthPending || isConnectionError) return;

    if (!isAuthenticated && !redirectStartedRef.current) {
      redirectStartedRef.current = true;
      router.replace("/sign-in");
      return;
    }

    if (isAuthenticated && !hasPermission && !redirectStartedRef.current) {
      redirectStartedRef.current = true;
      router.replace("/forbidden");
    }
  }, [
    hasPermission,
    isAuthenticated,
    isAuthPending,
    isConnectionError,
    isMounted,
    pathname,
    router,
  ]);

  if (!isMounted) {
    return <RouteLoadingScreen />;
  }

  if (isConnectionError) {
    return (
      <div className="flex h-svh w-full flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <p className="text-base font-medium">Không thể kết nối máy chủ</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Hệ thống không phản hồi. Vui lòng kiểm tra kết nối mạng hoặc thử lại
          sau.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button type="button" onClick={retryAuth}>
            Thử lại
          </Button>
          <Button type="button" variant="outline" onClick={() => void logout()}>
            Đăng xuất
          </Button>
        </div>
      </div>
    );
  }

  if (isAuthPending) {
    return <RouteLoadingScreen message="Đang xác thực phiên đăng nhập..." />;
  }

  if (isAuthenticated && hasPermission) {
    return <>{children}</>;
  }

  return <RouteLoadingScreen message="Đang chuyển hướng..." />;
}
