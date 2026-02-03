"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Permission } from "@/constants/permission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required permissions để access route này
   * Nếu không truyền hoặc empty array -> chỉ check authentication
   * Nếu có permissions -> check user phải có ít nhất 1 permission
   */
  requiredPermissions?: Permission[];
}

export function ProtectedRoute({
  children,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Tính toán quyền truy cập ngay trong render phase
  const hasPermission =
    !requiredPermissions ||
    requiredPermissions.length === 0 ||
    hasAnyPermission(requiredPermissions);

  useEffect(() => {
    // Chỉ thực hiện side-effects (redirect) khi đã load xong data
    if (isLoading) return;

    // 1. Chưa đăng nhập -> redirect về sign-in
    // FIX: Trước đây redirect về /not-found gây ra vấn đề khi logout
    // Timeline: Logout -> router.push("/sign-in") -> ProtectedRoute của dashboard layout
    // vẫn chạy useEffect, thấy !isAuthenticated -> redirect /not-found (SAI!)
    if (!isAuthenticated) {
      router.replace("/sign-in");
      return;
    }

    // 2. Đã đăng nhập nhưng thiếu quyền -> redirect forbidden
    if (!hasPermission) {
      // console.warn(`Access denied to ${pathname}. Missing permissions.`);
      router.replace("/forbidden");
    }
  }, [isLoading, isAuthenticated, hasPermission, router, pathname]);

  // Render logic:
  // Nếu đang loading HOẶC chưa auth HOẶC thiếu quyền -> Return null
  // Điều này đảm bảo children KHÔNG BAO GIỜ được render nếu điều kiện chưa thỏa mãn
  // Giúp tránh lỗi "flash content" (hiện trang Users rồi mới redirect)
  if (isLoading || !isAuthenticated || !hasPermission) {
    return null;
  }

  // Chỉ render children khi mọi điều kiện đã thỏa mãn
  return <>{children}</>;
}
