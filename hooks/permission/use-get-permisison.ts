import { useQuery } from "@tanstack/react-query";
import {
  getPermissionsApi,
  getPermissionsByRoleApi,
  PermissionResponseApi,
} from "@/services/permission/get-permission";

export const useGetPermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => getPermissionsApi(),
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
