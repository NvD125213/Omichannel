import { useQuery } from "@tanstack/react-query";
import {
  getTenantsApi,
  TenantQueryParams,
  TenantResponseApi,
  TenantDetailResponseApi,
} from "@/services/tenant/get-tenant";

export const useGetTenants = (
  params: TenantQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => getTenantsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    select: (data: TenantResponseApi | TenantDetailResponseApi) => data.data,
    enabled: options?.enabled,
  });
};
