import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  assignConversationApi,
  type AssignConversationRequest,
} from "@/services/chatwoots/api/accounts/conversation-assignments/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const conversationKey = (accountId: number, conversationId: number) =>
  ["chatwoot", "account", accountId, "conversations", conversationId] as const;

export const useChatwootConversationAssign = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: AssignConversationRequest;
    }) => assignConversationApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Gán hội thoại thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: conversationKey(accountId, conversationId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi gán hội thoại"),
  });
};
