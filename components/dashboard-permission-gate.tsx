"use client";

import { ProtectedRoute } from "@/components/protected-route";
import {
  getRequiredPermissionsForPath,
  requiresPlatformAdminForPath,
} from "@/constants/route-permissions";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Guard phân quyền theo pathname trong khu vực (dashboard).
 * Auth đã được layout cha bọc; component này chỉ enforce map route → permission.
 */
export function DashboardPermissionGate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const requiredPermissions = getRequiredPermissionsForPath(pathname);

  return (
    <ProtectedRoute
      requiredPermissions={requiredPermissions ?? undefined}
      requirePlatformAdmin={requiresPlatformAdminForPath(pathname)}
    >
      {children}
    </ProtectedRoute>
  );
}
