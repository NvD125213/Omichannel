import { useQuery } from "@tanstack/react-query";
import {
  getPermissionsApi,
  getPermissionsByRoleApi,
  GetPermissionsParams,
  PermissionResponseApi,
} from "@/services/permission/get-permission";

export const useGetPermissions = (params?: GetPermissionsParams) => {
  return useQuery({
    queryKey: ["permissions", params],
    queryFn: () => getPermissionsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: PermissionResponseApi) => data.data,
  });
};

export const useGetPermissionsByRole = (roleId: string) => {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: () => getPermissionsByRoleApi(roleId),
    enabled: !!roleId, // Only fetch when roleId is provided
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: PermissionResponseApi) => data.data,
  });
};
