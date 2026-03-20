import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTenantApi,
  deleteTenantApi,
  getTenantsApi,
  updateTenantApi,
  type CreateTenantRequest,
  type TenantDetailResponseApi,
  type TenantQueryParams,
  type TenantResponseApi,
  type UpdateTenantRequest,
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
    select: (data: TenantResponseApi) => data.data,
    enabled: options?.enabled,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTenantRequest) => createTenantApi(data),
    onSuccess: (res) => {
      if (res.status_code === 201) {
        toast.success(res.message || "Tạo tenant thành công");
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi tạo tenant");
      }
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
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật tenant thành công");
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
        queryClient.invalidateQueries({
          queryKey: ["tenant", variables.id],
        });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi cập nhật tenant");
      }
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
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa tenant thành công");
        queryClient.invalidateQueries({ queryKey: ["tenants"] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi xóa tenant");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa tenant",
      );
    },
  });
};
