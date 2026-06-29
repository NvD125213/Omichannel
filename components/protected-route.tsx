"use client";

import { RouteLoadingScreen } from "@/components/route-loading-screen";
import { useAuth } from "@/contexts/auth-context";
import { hardRedirect } from "@/lib/hard-redirect";
import { usePathname } from "next/navigation";
import { useLayoutEffect } from "react";
import { Permission } from "@/constants/permission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAuthPending, hasAnyPermission } = useAuth();
  const pathname = usePathname();

  const hasPermission =
    !requiredPermissions ||
    requiredPermissions.length === 0 ||
    hasAnyPermission(requiredPermissions);

  useLayoutEffect(() => {
    if (isAuthPending) return;

    if (!isAuthenticated) {
      hardRedirect("/sign-in");
      return;
    }

    if (!hasPermission) {
      hardRedirect("/forbidden");
    }
  }, [isAuthPending, isAuthenticated, hasPermission, pathname]);

  if (isAuthPending) {
    return <RouteLoadingScreen message="Đang xác thực phiên đăng nhập..." />;
  }

  if (isAuthenticated && hasPermission) {
    return <>{children}</>;
  }

  return <RouteLoadingScreen message="Đang chuyển hướng..." />;
}
