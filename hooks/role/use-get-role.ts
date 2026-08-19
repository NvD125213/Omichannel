import { useQuery } from "@tanstack/react-query";
import {
  getRolesApi,
  RoleQueryParams,
  RoleResponseApi,
} from "@/services/role/get-role";

export const useGetRoles = (
  params: RoleQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => getRolesApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled ?? true,
    select: (data: RoleResponseApi) => data.data,
  });
};
