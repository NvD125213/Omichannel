"use client";

import { Permission } from "@/constants/permission";
import { useAuth } from "@/contexts/auth-context";
import { ReactNode } from "react";

interface PermissionGuardProps {
  children: ReactNode;
  /**
   * Required permission - user phải có permission này
   */
  permission?: Permission;
  /**
   * Required permissions - user phải có ít nhất 1 trong các permissions này
   */
  anyPermissions?: Permission[];
  /**
   * Required permissions - user phải có tất cả các permissions này
   */
  allPermissions?: Permission[];
  /**
   * Fallback component khi user không có quyền
   */
  fallback?: ReactNode;
}

/**
 * Component để bảo vệ UI elements dựa trên permissions
 *
 * @example
 * // Check single permission
 * <PermissionGuard permission={PERMISSIONS.CREATE_USERS}>
 *   <Button>Tạo user mới</Button>
 * </PermissionGuard>
 *
 * @example
 * // Check any of multiple permissions
 * <PermissionGuard anyPermissions={[PERMISSIONS.EDIT_USERS, PERMISSIONS.DELETE_USERS]}>
 *   <Button>Edit/Delete</Button>
 * </PermissionGuard>
 *
 * @example
 * // Check all permissions
 * <PermissionGuard allPermissions={[PERMISSIONS.VIEW_USERS, PERMISSIONS.EDIT_USERS]}>
 *   <Button>View & Edit</Button>
 * </PermissionGuard>
 *
 * @example
 * // With fallback
 * <PermissionGuard
 *   permission={PERMISSIONS.CREATE_USERS}
 *   fallback={<p>Bạn không có quyền này</p>}
 * >
 *   <Button>Tạo user</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check any permissions
  if (anyPermissions && !hasAnyPermission(anyPermissions)) {
    return <>{fallback}</>;
  }

  // Check all permissions
  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
