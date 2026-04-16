import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createConversationApi,
  filterConversationsApi,
  getConversationApi,
  getConversationLabelsApi,
  getConversationReportingEventsApi,
  getConversationsMetaApi,
  listConversationsApi,
  setConversationLabelsApi,
  toggleConversationStatusApi,
  toggleConversationTypingStatusApi,
  updateConversationApi,
  type ConversationListQueryParams,
  type ConversationsFilterBody,
  type CreateConversationRequest,
  type SetConversationLabelsRequest,
  type ToggleConversationStatusRequest,
  type ToggleConversationTypingRequest,
  type UpdateConversationRequest,
} from "@/services/chatwoots/api/accounts/conversations/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const conversationsListKey = (
  accountId: number,
  params?: ConversationListQueryParams,
) => ["chatwoot", "account", accountId, "conversations", params ?? {}] as const;

const conversationsFilterKey = (
  accountId: number,
  body: ConversationsFilterBody,
  page?: number,
) =>
  [
    "chatwoot",
    "account",
    accountId,
    "conversations",
    "filter",
    body,
    page,
  ] as const;

const conversationKey = (accountId: number, conversationId: number) =>
  ["chatwoot", "account", accountId, "conversations", conversationId] as const;

const conversationLabelsKey = (accountId: number, conversationId: number) =>
  [
    "chatwoot",
    "account",
    accountId,
    "conversations",
    conversationId,
    "labels",
  ] as const;

const conversationReportingKey = (accountId: number, conversationId: number) =>
  [
    "chatwoot",
    "account",
    accountId,
    "conversations",
    conversationId,
    "reporting_events",
  ] as const;

const conversationsMetaKey = (
  accountId: number,
  params?: Record<string, unknown>,
) =>
  [
    "chatwoot",
    "account",
    accountId,
    "conversations",
    "meta",
    params ?? {},
  ] as const;

export const useChatwootConversations = (
  accountId: number,
  params?: ConversationListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationsListKey(accountId, params),
    queryFn: () => listConversationsApi(accountId, params),
    enabled: options?.enabled ?? !!accountId,
    placeholderData: (prev) => prev,
  });
};

export const useChatwootConversationsFilter = (
  accountId: number,
  body: ConversationsFilterBody,
  query?: { page?: number },
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationsFilterKey(accountId, body, query?.page),
    queryFn: () => filterConversationsApi(accountId, body, query),
    enabled: options?.enabled ?? !!accountId,
    placeholderData: (prev) => prev,
  });
};

export const useChatwootConversationsMeta = (
  accountId: number,
  params?: Record<string, unknown>,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationsMetaKey(accountId, params),
    queryFn: () => getConversationsMetaApi(accountId, params),
    enabled: options?.enabled ?? !!accountId,
  });
};

export const useChatwootConversation = (
  accountId: number,
  conversationId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationKey(accountId, conversationId),
    queryFn: () => getConversationApi(accountId, conversationId),
    enabled: options?.enabled ?? (!!accountId && !!conversationId),
  });
};

export const useChatwootConversationLabels = (
  accountId: number,
  conversationId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationLabelsKey(accountId, conversationId),
    queryFn: () => getConversationLabelsApi(accountId, conversationId),
    enabled: options?.enabled ?? (!!accountId && !!conversationId),
  });
};

export const useChatwootConversationReportingEvents = (
  accountId: number,
  conversationId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: conversationReportingKey(accountId, conversationId),
    queryFn: () => getConversationReportingEventsApi(accountId, conversationId),
    enabled: options?.enabled ?? (!!accountId && !!conversationId),
  });
};

export const useChatwootConversationCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: CreateConversationRequest;
    }) => createConversationApi(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Tạo hội thoại thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "conversations"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi tạo hội thoại"),
  });
};

export const useChatwootConversationUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: UpdateConversationRequest;
    }) => updateConversationApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Cập nhật hội thoại thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: conversationKey(accountId, conversationId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật hội thoại"),
  });
};

export const useChatwootConversationToggleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: ToggleConversationStatusRequest;
    }) => toggleConversationStatusApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Cập nhật trạng thái hội thoại thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "conversations"],
      });
      queryClient.invalidateQueries({
        queryKey: conversationKey(accountId, conversationId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi đổi trạng thái hội thoại"),
  });
};

export const useChatwootConversationToggleTyping = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: ToggleConversationTypingRequest;
    }) => toggleConversationTypingStatusApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      queryClient.invalidateQueries({
        queryKey: conversationKey(accountId, conversationId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi gửi trạng thái gõ"),
  });
};

export const useChatwootConversationLabelsSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      conversationId,
      data,
    }: {
      accountId: number;
      conversationId: number;
      data: SetConversationLabelsRequest;
    }) => setConversationLabelsApi(accountId, conversationId, data),
    onSuccess: (_, { accountId, conversationId }) => {
      toast.success("Cập nhật nhãn hội thoại thành công");
      queryClient.invalidateQueries({
        queryKey: conversationLabelsKey(accountId, conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "conversations"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật nhãn hội thoại"),
  });
};
