import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { chatwootOmniKeys } from "@/hooks/chatwoot/use-chatwoot";
import {
  sendConversationRatingApi,
  type SendConversationRatingRequest,
} from "@/services/ratings/conversation-rating";

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
