import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { chatwootOmniKeys } from "@/hooks/chatwoot/use-chatwoot";
import {
  getTenantRatingsMetricsApi,
  listTenantRatingResponsesApi,
  listTenantRatingsApi,
  sendConversationRatingApi,
  type ListTenantRatingResponsesParams,
  type ListTenantRatingsParams,
  type SendConversationRatingRequest,
  type TenantRatingsMetricsParams,
} from "@/services/ratings/conversation-rating";

export const conversationRatingKeys = {
  all: ["conversation-ratings"] as const,
  tenant: (tenantId: string) =>
    [...conversationRatingKeys.all, "tenant", tenantId] as const,
  metrics: (tenantId: string, params?: TenantRatingsMetricsParams) =>
    [
      ...conversationRatingKeys.tenant(tenantId),
      "metrics",
      params ?? {},
    ] as const,
  responses: (tenantId: string, params?: ListTenantRatingResponsesParams) =>
    [
      ...conversationRatingKeys.tenant(tenantId),
      "responses",
      params ?? {},
    ] as const,
  list: (tenantId: string, params?: ListTenantRatingsParams) =>
    [...conversationRatingKeys.tenant(tenantId), "list", params ?? {}] as const,
};

export function useSendConversationRating() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data = { force_resend: false },
    }: {
      tenantId: string;
      conversationId: string | number;
      data?: SendConversationRatingRequest;
    }) => sendConversationRatingApi(tenantId, conversationId, data),
    onSuccess: (res, variables) => {
      const ok = toastApiMutation(
        res,
        "Gửi link đánh giá thành công",
        "Có lỗi xảy ra khi gửi link đánh giá",
      );

      if (!ok) return;

      const tenantId = String(variables.tenantId);
      const conversationId = String(variables.conversationId);

      queryClient.invalidateQueries({
        queryKey: conversationRatingKeys.tenant(tenantId),
      });
      queryClient.invalidateQueries({
        queryKey: chatwootOmniKeys.tenantConversationMessages(
          tenantId,
          conversationId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: chatwootOmniKeys.tenantConversation(tenantId, conversationId),
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
            : "Có lỗi xảy ra khi gửi link đánh giá";
      toast.error(message);
    },
  });
}

/** GET /conversation-ratings/tenants/:tenant_id/metrics */
export function useGetTenantRatingsMetrics(
  tenantId: string,
  params?: TenantRatingsMetricsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: conversationRatingKeys.metrics(tenantId, params),
    queryFn: () => getTenantRatingsMetricsApi(tenantId, params),
    enabled: enabled && !!tenantId,
  });
}

/** GET /conversation-ratings/tenants/:tenant_id/responses */
export function useListTenantRatingResponses(
  tenantId: string,
  params?: ListTenantRatingResponsesParams,
  enabled = true,
) {
  return useQuery({
    queryKey: conversationRatingKeys.responses(tenantId, params),
    queryFn: () => listTenantRatingResponsesApi(tenantId, params),
    enabled: enabled && !!tenantId,
  });
}

/** GET /conversation-ratings/tenants/:tenant_id */
export function useListTenantRatings(
  tenantId: string,
  params?: ListTenantRatingsParams,
  enabled = true,
) {
  return useQuery({
    queryKey: conversationRatingKeys.list(tenantId, params),
    queryFn: () => listTenantRatingsApi(tenantId, params),
    enabled: enabled && !!tenantId,
  });
}
