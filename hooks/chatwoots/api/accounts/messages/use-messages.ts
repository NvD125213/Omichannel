import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createMessageApi,
  deleteMessageApi,
  listMessagesApi,
  updateMessageApi,
  type CreateMessageRequest,
  type MessagesListQueryParams,
  type UpdateMessageRequest,
} from "@/services/chatwoots/api/accounts/messages/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const messagesKey = (
  accountId: number,
  conversationId: number,
  params?: MessagesListQueryParams,
) =>
  [
    "chatwoot",
    "account",
    accountId,
    "conversations",
    conversationId,
    "messages",
    params ?? {},
  ] as const;

export const useChatwootMessages = (
  accountId: number,
  conversationId: number,
  params?: MessagesListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: messagesKey(accountId, conversationId, params),
    queryFn: () => listMessagesApi(accountId, conversationId, params),
    enabled: options?.enabled ?? (!!accountId && !!conversationId),
    placeholderData: (prev) => prev,
  });
};

export const useChatwootMessageCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: CreateMessageRequest;
    }) => createMessageApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Gửi tin nhắn thành công");
      queryClient.invalidateQueries({
        queryKey: [
          "chatwoot",
          "account",
          accountId,
          "conversations",
          conversationId,
          "messages",
        ],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi gửi tin nhắn"),
  });
};

export const useChatwootMessageUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      messageId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      messageId: number;
      data: UpdateMessageRequest;
    }) => updateMessageApi(accountId, conversationId, messageId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Cập nhật tin nhắn thành công");
      queryClient.invalidateQueries({
        queryKey: [
          "chatwoot",
          "account",
          accountId,
          "conversations",
          conversationId,
          "messages",
        ],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật tin nhắn"),
  });
};

export const useChatwootMessageDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      messageId,
    }: {
      accountId: number;
      conversationId: number;
      messageId: number;
    }) => deleteMessageApi(accountId, conversationId, messageId),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Xóa tin nhắn thành công");
      queryClient.invalidateQueries({
        queryKey: [
          "chatwoot",
          "account",
          accountId,
          "conversations",
          conversationId,
          "messages",
        ],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi xóa tin nhắn"),
  });
};
