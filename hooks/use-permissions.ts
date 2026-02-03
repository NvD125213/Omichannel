import { useAuth } from "@/contexts/auth-context";
import { Permission } from "@/constants/permission";
import { useCallback } from "react";

/**
 * Custom hook để check permission
 * @param permission - Permission cần kiểm tra
 * @returns boolean - User có permission hay không
 */
export function useHasPermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * Custom hook để check user có ít nhất 1 permission trong danh sách
 * @param permissions - Danh sách permissions
 * @returns boolean - User có ít nhất 1 permission hay không
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(permissions);
}

/**
 * Custom hook để check user có tất cả permissions trong danh sách
 * @param permissions - Danh sách permissions
 * @returns boolean - User có tất cả permissions hay không
 */
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(permissions);
}

/**
 * Custom hook để check user có thể access route
 * @param requiredPermissions - Permissions cần thiết để access route
 * @returns boolean - User có thể access route hay không
 */
export function useCanAccessRoute(requiredPermissions?: Permission[]): boolean {
  const { hasAnyPermission } = useAuth();

  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // Route không yêu cầu permissions
  }

  return hasAnyPermission(requiredPermissions);
}

/**
 * Hook trả về object chứa tất cả permission helpers
 * Tiện lợi khi cần sử dụng nhiều helpers trong cùng 1 component
 */
export function usePermissions() {
  const { permissions, hasPermission, hasAnyPermission, hasAllPermissions } =
    useAuth();

  const canAccessRoute = useCallback(
    (requiredPermissions?: Permission[]): boolean => {
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }
      return hasAnyPermission(requiredPermissions);
    },
    [hasAnyPermission],
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
  };
}
