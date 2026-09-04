import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { getAccessToken } from "@/lib/auth";
import {
  listTenantKgAgentsApi,
  replaceTenantKgAgentsApi,
  unwrapTenantKgAgents,
  type ReplaceTenantKgAgentsRequest,
  type TenantKgAgentsResponse,
} from "@/services/tenant/kg-agents";

export const tenantKgAgentKeys = {
  all: ["tenants", "kg-agents"] as const,
  byTenant: (tenantId: string) => [...tenantKgAgentKeys.all, tenantId] as const,
};

/** GET /tenants/:tenant_id/kg-agents */
export function useListTenantKgAgents(tenantId: string, enabled = true) {
  const token = getAccessToken();

  return useQuery({
    queryKey: tenantKgAgentKeys.byTenant(tenantId),
    queryFn: () => listTenantKgAgentsApi(tenantId),
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: enabled && !!token && !!tenantId,
    select: (res: TenantKgAgentsResponse) => unwrapTenantKgAgents(res.data),
  });
}

/** PUT /tenants/:tenant_id/kg-agents — replace toàn bộ binding */
export function useReplaceTenantKgAgents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: ReplaceTenantKgAgentsRequest;
    }) => replaceTenantKgAgentsApi(tenantId, data),
    onSuccess: (res, variables) => {
      toastApiMutation(
        res,
        "Cập nhật KG agents của tenant thành công",
        "Có lỗi xảy ra khi cập nhật KG agents",
      );
      queryClient.invalidateQueries({
        queryKey: tenantKgAgentKeys.byTenant(variables.tenantId),
      });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({
        queryKey: ["tenant", variables.tenantId],
      });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === "object" &&
              error !== null &&
              "response" in error &&
              typeof (error as { response?: { data?: { message?: string } } })
                .response?.data?.message === "string"
            ? (error as { response: { data: { message: string } } }).response
                .data.message
            : "Có lỗi xảy ra khi cập nhật KG agents";
      toast.error(message);
    },
  });
}
