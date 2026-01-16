import { useQuery } from "@tanstack/react-query";
import {
  getRolesApi,
  RoleQueryParams,
  RoleResponseApi,
} from "@/services/role/get-role";

export const useGetRoles = (params: RoleQueryParams) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => getRolesApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: RoleResponseApi) => data.data,
  });
};
