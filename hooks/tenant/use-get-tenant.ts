import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import {
  createTenantApi,
  deleteTenantApi,
  getTenantByIdApi,
  getTenantsApi,
  updateTenantApi,
  type CreateTenantRequest,
  type Tenant,
  type TenantListData,
  type TenantQueryParams,
  type TenantResponseApi,
  type UpdateTenantRequest,
  isTenantDetail,
  isTenantListData,
} from "@/services/tenant/get-tenant";

type UseGetTenantsOptions = { enabled?: boolean };

/** Khi truyền `id` → `data` API là 1 tenant object */
export function useGetTenants(
  params: { id: string } & Omit<TenantQueryParams, "id">,
  options?: UseGetTenantsOptions,
): UseQueryResult<Tenant | undefined, Error>;

/** List tenants (pagination + items) */
export function useGetTenants(
  params: Omit<TenantQueryParams, "id"> & { id?: undefined },
  options?: UseGetTenantsOptions,
): UseQueryResult<TenantListData | undefined, Error>;

export function useGetTenants(
  params: TenantQueryParams,
  options?: UseGetTenantsOptions,
): UseQueryResult<Tenant | TenantListData | undefined, Error> {
  const byId = typeof params.id === "string" && params.id.length > 0;

  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => getTenantsApi(params),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled,
    select: (res: TenantResponseApi) => {
      const data = res.data;
      if (byId) {
        if (isTenantDetail(data)) return data;
        if (isTenantListData(data)) return data.items[0] as Tenant | undefined;
        return undefined;
      }
      if (isTenantListData(data)) return data;
      if (isTenantDetail(data)) {
        return {
          total: 1,
          page: 1,
          page_size: 1,
          total_pages: 1,
          items: [data],
        } satisfies TenantListData;
      }
      return undefined;
    },
  });
}

export const useGetTenantById = (
  id: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: () => getTenantByIdApi(id),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: options?.enabled ?? !!id,
    select: (res) => res.data,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => createTenantApi(data),
    onSuccess: (res) => {
      toastApiMutation(
        res,
        "Tạo tenant thành công",
        "Có lỗi xảy ra khi tạo tenant",
      );
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo tenant",
      );
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantRequest }) =>
      updateTenantApi(id, data),
    onSuccess: (res, variables) => {
      toastApiMutation(
        res,
        "Cập nhật tenant thành công",
        "Có lỗi xảy ra khi cập nhật tenant",
      );
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({
        queryKey: ["tenant", variables.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật tenant",
      );
    },
  });
};

export const useDeleteTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTenantApi(id),
    onSuccess: (res) => {
      toastApiMutation(
        res,
        "Xóa tenant thành công",
        "Có lỗi xảy ra khi xóa tenant",
      );
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa tenant",
      );
    },
  });
};
