import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { getAccessToken } from "@/lib/auth";
import {
  getOwnTenantSettingsApi,
  updateOwnTenantSettingsApi,
  type OwnTenantSettingsResponse,
  type UpdateOwnTenantSettingsRequest,
} from "@/services/tenant/own-settings";

export const OWN_TENANT_SETTINGS_QUERY_KEY = [
  "tenants",
  "me",
  "settings",
] as const;

export function useGetOwnTenantSettings(enabled = true) {
  const token = getAccessToken();

  return useQuery({
    queryKey: OWN_TENANT_SETTINGS_QUERY_KEY,
    queryFn: getOwnTenantSettingsApi,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: enabled && !!token,
    select: (res: OwnTenantSettingsResponse) => res.data,
  });
}

export function useUpdateOwnTenantSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOwnTenantSettingsRequest) =>
      updateOwnTenantSettingsApi(data),
    onSuccess: (res) => {
      toastApiMutation(
        res,
        "Cập nhật cài đặt doanh nghiệp thành công",
        "Có lỗi xảy ra khi cập nhật cài đặt doanh nghiệp",
      );
      queryClient.invalidateQueries({
        queryKey: OWN_TENANT_SETTINGS_QUERY_KEY,
      });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật cài đặt doanh nghiệp",
      );
    },
  });
}
