import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AssignTenantConversationRequest,
  CreateTenantAccountAgentBotRequest,
  CreateChatwootAgentBotRequest,
  CreateChatwootAgentRequest,
  CreateTenantConversationMessageRequest,
  CreateTenantConversationRequest,
  CreateTenantInboxRequest,
  CreateTenantLabelRequest,
  CreateTenantTeamRequest,
  CreateChatwootUserRequest,
  ListTenantConversationMessagesParams,
  ListTenantConversationsParams,
  ProvisionChatwootAccountRequest,
  SetTenantConversationLabelsRequest,
  TenantTeamMembersRequest,
  ToggleTenantConversationStatusRequest,
  ToggleTenantConversationTypingRequest,
  UpdateTenantAccountAgentBotRequest,
  UpdateChatwootAgentBotRequest,
  UpdateChatwootAgentRequest,
  UpdateTenantConversationCustomAttributesRequest,
  UpdateTenantConversationRequest,
  UpdateTenantInboxRequest,
  UpdateTenantTeamRequest,
  UpdateChatwootUserRequest,
  UpdateTenantChatwootAccountRequest,
  BulkActionRequest,
  FilterConversationsRequest,
  CreateAccountCustomFilterRequest,
  UpdateAccountCustomFilterRequest,
  AccountInboxMembersRequest,
} from "@/services/chatwoot/interface";
import { useChatUnreadStore } from "@/features/chats/utils/chat-unread-store";
import {
  appendMessageToConversationMessagesCache,
  applyConversationStatusToListCache,
  applyMessageCreatedToConversationList,
  clearConversationUnreadInListCache,
  updateConversationInListCache,
} from "@/features/chats/utils/chatwoot-realtime-cache";
import { extractCreatedMessageFromResponse } from "@/features/chats/utils/normalize-message";
import { useChatStore } from "@/features/chats/utils/use-chat";
import { chatwootService } from "@/services/chatwoot/service";
import { extractFilterConversationsPayload } from "@/features/chats/utils/conversation-filter";

/** Query keys — Đa kênh `/api/v1/chatwoot` (tách biệt hooks `chatwoots` gọi trực tiếp Chatwoot) */
export const chatwootOmniKeys = {
  all: ["omni-chatwoot"] as const,
  agentBotsAll: () => [...chatwootOmniKeys.all, "agent-bots"] as const,
  tenant: (tenantId: string) =>
    [...chatwootOmniKeys.all, "tenant", tenantId] as const,
  tenantAccount: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "account"] as const,
  tenantAgentBots: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "agent-bots"] as const,
  tenantAgentBot: (tenantId: string, botId: string) =>
    [...chatwootOmniKeys.tenantAgentBots(tenantId), botId] as const,
  tenantAccountAgentBots: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "account-agent-bots"] as const,
  tenantAccountAgentBot: (tenantId: string, agentBotId: string) =>
    [...chatwootOmniKeys.tenantAccountAgentBots(tenantId), agentBotId] as const,
  tenantAgents: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "agents"] as const,
  tenantInboxes: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "inboxes"] as const,
  tenantInbox: (tenantId: string, inboxId: string) =>
    [...chatwootOmniKeys.tenantInboxes(tenantId), inboxId] as const,
  accountInboxMembers: (accountId: string) =>
    [...chatwootOmniKeys.all, "account", accountId, "inbox-members"] as const,
  tenantTeams: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "teams"] as const,
  tenantTeam: (tenantId: string, teamId: string) =>
    [...chatwootOmniKeys.tenantTeams(tenantId), teamId] as const,
  tenantTeamMembers: (tenantId: string, teamId: string) =>
    [...chatwootOmniKeys.tenantTeam(tenantId, teamId), "team-members"] as const,
  tenantLabels: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "labels"] as const,
  tenantCustomFilters: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "custom-filters"] as const,
  tenantConversationsBase: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "conversations"] as const,
  tenantConversations: (
    tenantId: string,
    params?: ListTenantConversationsParams,
  ) =>
    [
      ...chatwootOmniKeys.tenantConversationsBase(tenantId),
      params ?? {},
    ] as const,
  tenantConversationsFilter: (
    tenantId: string,
    data?: FilterConversationsRequest,
  ) =>
    [
      ...chatwootOmniKeys.tenantConversationsBase(tenantId),
      "filter",
      data ?? { payload: [] },
    ] as const,
  tenantConversation: (tenantId: string, conversationId: string) =>
    [
      ...chatwootOmniKeys.tenant(tenantId),
      "conversation",
      conversationId,
    ] as const,
  tenantConversationMessages: (
    tenantId: string,
    conversationId: string,
    params?: ListTenantConversationMessagesParams,
  ) =>
    [
      ...chatwootOmniKeys.tenantConversation(tenantId, conversationId),
      "messages",
      params ?? {},
    ] as const,
  tenantConversationMessage: (
    tenantId: string,
    conversationId: string,
    messageId: string,
  ) =>
    [
      ...chatwootOmniKeys.tenantConversation(tenantId, conversationId),
      "messages",
      messageId,
    ] as const,
  tenantConversationLabels: (tenantId: string, conversationId: string) =>
    [
      ...chatwootOmniKeys.tenantConversation(tenantId, conversationId),
      "labels",
    ] as const,
  user: (userId: string) => [...chatwootOmniKeys.all, "user", userId] as const,
  userSsoLink: (userId: string) =>
    [...chatwootOmniKeys.user(userId), "sso-link"] as const,
};

// —— Queries ——

export const useGetTenantChatwootAccount = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAccount(tenantId),
    queryFn: () => chatwootService.getTenantChatwootAccount(tenantId),
    enabled: !!tenantId,
  });
};

export const useGetChatwootAgentBot = (tenantId: string, botId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAgentBot(tenantId, botId),
    queryFn: () => chatwootService.getChatwootAgentBot(tenantId, botId),
    enabled: !!tenantId && !!botId,
  });
};

export const useListTenantChatwootAgentBots = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAgentBots(tenantId),
    queryFn: () => chatwootService.listTenantChatwootAgentBots(tenantId),
    enabled: !!tenantId,
  });
};

export const useListChatwootAgents = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAgents(tenantId),
    queryFn: () => chatwootService.listChatwootAgents(tenantId),
    enabled: !!tenantId,
  });
};

export const useGetTenantAccountAgentBot = (
  tenantId: string,
  agentBotId: string,
) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAccountAgentBot(tenantId, agentBotId),
    queryFn: () =>
      chatwootService.getTenantAccountAgentBot(tenantId, agentBotId),
    enabled: !!tenantId && !!agentBotId,
  });
};

export const useListTenantAccountAgentBots = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantAccountAgentBots(tenantId),
    queryFn: () => chatwootService.listTenantAccountAgentBots(tenantId),
    enabled: !!tenantId,
  });
};

export const useListTenantInboxes = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantInboxes(tenantId),
    queryFn: () => chatwootService.listTenantInboxes(tenantId),
    enabled: !!tenantId,
  });
};

export const useGetTenantInbox = (tenantId: string, inboxId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantInbox(tenantId, inboxId),
    queryFn: () => chatwootService.getTenantInbox(tenantId, inboxId),
    enabled: !!tenantId && !!inboxId,
  });
};

export const useListTenantTeams = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantTeams(tenantId),
    queryFn: () => chatwootService.listTenantTeams(tenantId),
    enabled: !!tenantId,
  });
};

export const useGetTenantTeam = (tenantId: string, teamId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantTeam(tenantId, teamId),
    queryFn: () => chatwootService.getTenantTeam(tenantId, teamId),
    enabled: !!tenantId && !!teamId,
  });
};

export const useListTenantTeamMembers = (tenantId: string, teamId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantTeamMembers(tenantId, teamId),
    queryFn: () => chatwootService.listTenantTeamMembers(tenantId, teamId),
    enabled: !!tenantId && !!teamId,
  });
};

export const useListTenantLabels = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantLabels(tenantId),
    queryFn: () => chatwootService.listTenantLabels(tenantId),
    enabled: !!tenantId,
  });
};

export const useListAccountCustomFilters = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantCustomFilters(tenantId),
    queryFn: () => chatwootService.listAccountCustomFilters(tenantId),
    enabled: !!tenantId,
  });
};

export const useListTenantConversationMessages = (
  tenantId: string,
  conversationId: string,
  params?: ListTenantConversationMessagesParams,
) => {
  const safeTenantId = typeof tenantId === "string" ? tenantId.trim() : "";
  const safeConversationId =
    typeof conversationId === "string" ? conversationId.trim() : "";

  const isValidId = (value: string) =>
    value.length > 0 && value !== "undefined" && value !== "null";

  const enabled = isValidId(safeTenantId) && isValidId(safeConversationId);

  return useInfiniteQuery({
    queryKey: chatwootOmniKeys.tenantConversationMessages(
      safeTenantId,
      safeConversationId,
      params,
    ),
    initialPageParam: params?.before ?? null,
    queryFn: ({ pageParam }) =>
      chatwootService.listTenantConversationMessages(
        safeTenantId,
        safeConversationId,
        {
          ...params,
          before:
            typeof pageParam === "number" && Number.isFinite(pageParam)
              ? pageParam
              : params?.before,
        },
      ),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const data = lastPage?.data as Record<string, unknown> | undefined;
      const payloadCandidate =
        data?.payload ??
        (data?.data as Record<string, unknown> | undefined)?.payload ??
        (data?.chatwoot as Record<string, unknown> | undefined)?.payload ??
        (
          (data?.chatwoot as Record<string, unknown> | undefined)?.data as
            | Record<string, unknown>
            | undefined
        )?.payload ??
        data?.messages;
      if (!Array.isArray(payloadCandidate) || payloadCandidate.length < 20) {
        return undefined;
      }
      const toNumericMessageId = (message: unknown): number | null => {
        if (!message || typeof message !== "object") return null;
        const raw = (message as Record<string, unknown>).id;
        if (typeof raw === "number" && Number.isFinite(raw)) return raw;
        if (typeof raw === "string" && raw.trim() !== "") {
          const n = Number(raw);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      };
      const messageIds = payloadCandidate
        .map((message) => toNumericMessageId(message))
        .filter((id): id is number => id !== null);

      if (messageIds.length === 0) {
        return undefined;
      }
      const currentCursor =
        typeof lastPageParam === "number" && Number.isFinite(lastPageParam)
          ? lastPageParam
          : typeof params?.before === "number" && Number.isFinite(params.before)
            ? params.before
            : null;

      // Cursor kế tiếp phải nhỏ hơn cursor hiện tại (lùi về tin nhắn cũ hơn).
      const olderIds =
        currentCursor === null
          ? messageIds
          : messageIds.filter((id) => id < currentCursor);

      if (olderIds.length === 0) {
        return undefined;
      }

      return Math.min(...olderIds);
    },
    enabled,
  });
};

export const useGetTenantConversation = (
  tenantId: string,
  conversationId: string,
) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantConversation(tenantId, conversationId),
    queryFn: () =>
      chatwootService.getTenantConversation(tenantId, conversationId),
    enabled: !!tenantId && !!conversationId,
  });
};

export const useGetTenantConversationLabels = (
  tenantId: string,
  conversationId: string,
) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantConversationLabels(
      tenantId,
      conversationId,
    ),
    queryFn: () =>
      chatwootService.getTenantConversationLabels(tenantId, conversationId),
    enabled: !!tenantId && !!conversationId,
  });
};

export const useListTenantConversations = (
  tenantId: string,
  params?: ListTenantConversationsParams,
) => {
  const paramsWithoutPage: ListTenantConversationsParams = {
    ...(params ?? {}),
  };
  delete paramsWithoutPage.page;

  return useInfiniteQuery({
    queryKey: chatwootOmniKeys.tenantConversations(tenantId, paramsWithoutPage),
    initialPageParam: params?.page ?? 1,
    queryFn: ({ pageParam }) =>
      chatwootService.listTenantConversations(tenantId, {
        ...paramsWithoutPage,
        page:
          typeof pageParam === "number" && Number.isFinite(pageParam)
            ? pageParam
            : 1,
      }),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const data = lastPage?.data as Record<string, unknown> | undefined;
      const payloadCandidate =
        data?.payload ??
        (data?.data as Record<string, unknown> | undefined)?.payload ??
        (
          (data?.chatwoot as Record<string, unknown> | undefined)?.data as
            | Record<string, unknown>
            | undefined
        )?.payload;
      if (!Array.isArray(payloadCandidate) || payloadCandidate.length === 0) {
        return undefined;
      }
      return typeof lastPageParam === "number" ? lastPageParam + 1 : 2;
    },
    enabled: !!tenantId,
  });
};

export const useInfiniteFilterConversations = (
  tenantId: string,
  data: FilterConversationsRequest | null,
  enabled = false,
) => {
  return useInfiniteQuery({
    queryKey: chatwootOmniKeys.tenantConversationsFilter(
      tenantId,
      data ?? { payload: [] },
    ),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      chatwootService.filterConversations(
        tenantId,
        data as FilterConversationsRequest,
        typeof pageParam === "number" && Number.isFinite(pageParam)
          ? pageParam
          : 1,
      ),
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const payload = extractFilterConversationsPayload(lastPage);
      if (!payload || payload.length === 0) return undefined;
      return typeof lastPageParam === "number" ? lastPageParam + 1 : 2;
    },
    enabled: !!tenantId && enabled && Boolean(data?.payload?.length),
  });
};

export const useGetChatwootUserSsoLink = (userId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.userSsoLink(userId),
    queryFn: () => chatwootService.getChatwootUserSsoLink(userId),
    enabled: !!userId,
  });
};

export const useGetChatwootUser = (userId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.user(userId),
    queryFn: () => chatwootService.getChatwootUser(userId),
    enabled: !!userId,
  });
};

export const useListAllChatwootAgentBots = () => {
  return useQuery({
    queryKey: chatwootOmniKeys.agentBotsAll(),
    queryFn: () => chatwootService.listAllChatwootAgentBots(),
  });
};

// —— Mutations ——

export const useProvisionChatwootAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProvisionChatwootAccountRequest) =>
      chatwootService.provisionChatwootAccount(data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo tài khoản Chatwoot thành công");
        queryClient.invalidateQueries({ queryKey: chatwootOmniKeys.all });
        if (variables.tenant_id) {
          queryClient.invalidateQueries({
            queryKey: chatwootOmniKeys.tenantAccount(variables.tenant_id),
          });
        }
      } else {
        toast.error(res.message || "Không thể tạo tài khoản Chatwoot");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo tài khoản Chatwoot";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantChatwootAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: UpdateTenantChatwootAccountRequest;
    }) => chatwootService.updateTenantChatwootAccount(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật tài khoản Chatwoot thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccount(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Không thể cập nhật tài khoản Chatwoot");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật tài khoản Chatwoot";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantChatwootAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) =>
      chatwootService.deleteTenantChatwootAccount(tenantId),
    onSuccess: (res, tenantId) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa tài khoản Chatwoot thành công");
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantAccount(tenantId),
        });
        queryClient.invalidateQueries({ queryKey: chatwootOmniKeys.all });
      } else {
        toast.error(res.message || "Không thể xóa tài khoản Chatwoot");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa tài khoản Chatwoot";
      toast.error(msg);
    },
  });
};

export const useSyncChatwootIntegrationAccountUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) =>
      chatwootService.syncChatwootIntegrationAccountUser(tenantId),
    onSuccess: (res, tenantId) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Đồng bộ integration user thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccount(tenantId),
        });
      } else {
        toast.error(res.message || "Đồng bộ integration user thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi đồng bộ integration user";
      toast.error(msg);
    },
  });
};

export const useUpdateChatwootAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      botId,
      data,
    }: {
      tenantId: string;
      botId: string;
      data: UpdateChatwootAgentBotRequest;
    }) => chatwootService.updateChatwootAgentBot(tenantId, botId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật agent bot thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgentBots(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgentBot(
            variables.tenantId,
            variables.botId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.agentBotsAll(),
        });
      } else {
        toast.error(res.message || "Cập nhật agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật agent bot";
      toast.error(msg);
    },
  });
};

export const useDeleteChatwootAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, botId }: { tenantId: string; botId: string }) =>
      chatwootService.deleteChatwootAgentBot(tenantId, botId),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa agent bot thành công");
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantAgentBot(
            variables.tenantId,
            variables.botId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgentBots(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.agentBotsAll(),
        });
      } else {
        toast.error(res.message || "Xóa agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa agent bot";
      toast.error(msg);
    },
  });
};

export const useCreateChatwootAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateChatwootAgentBotRequest;
    }) => chatwootService.createChatwootAgentBot(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo agent bot thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgentBots(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.agentBotsAll(),
        });
      } else {
        toast.error(res.message || "Tạo agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo agent bot";
      toast.error(msg);
    },
  });
};

export const useCreateChatwootAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateChatwootAgentRequest;
    }) => chatwootService.createChatwootAgent(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo agent thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgents(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo agent thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo agent";
      toast.error(msg);
    },
  });
};

export const useUpdateChatwootAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      agentId,
      data,
    }: {
      tenantId: string;
      agentId: string;
      data: UpdateChatwootAgentRequest;
    }) => chatwootService.updateChatwootAgent(tenantId, agentId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật agent thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgents(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Cập nhật agent thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật agent";
      toast.error(msg);
    },
  });
};

export const useDeleteChatwootAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      agentId,
    }: {
      tenantId: string;
      agentId: string;
    }) => chatwootService.deleteChatwootAgent(tenantId, agentId),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa agent thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAgents(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Xóa agent thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa agent";
      toast.error(msg);
    },
  });
};

export const useAssignTenantConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: AssignTenantConversationRequest;
    }) =>
      chatwootService.assignTenantConversation(tenantId, conversationId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Gán hội thoại thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(
            variables.tenantId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            variables.tenantId,
            variables.conversationId,
          ),
        });
      } else {
        toast.error(res.message || "Gán hội thoại thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi gán hội thoại";
      toast.error(msg);
    },
  });
};

export const useCreateTenantAccountAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateTenantAccountAgentBotRequest;
    }) => chatwootService.createTenantAccountAgentBot(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo account agent bot thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccountAgentBots(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo account agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo account agent bot";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantAccountAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      agentBotId,
      data,
    }: {
      tenantId: string;
      agentBotId: string;
      data: UpdateTenantAccountAgentBotRequest;
    }) =>
      chatwootService.updateTenantAccountAgentBot(tenantId, agentBotId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật account agent bot thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccountAgentBots(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccountAgentBot(
            variables.tenantId,
            variables.agentBotId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật account agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật account agent bot";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantAccountAgentBot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      agentBotId,
    }: {
      tenantId: string;
      agentBotId: string;
    }) => chatwootService.deleteTenantAccountAgentBot(tenantId, agentBotId),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa account agent bot thành công");
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantAccountAgentBot(
            variables.tenantId,
            variables.agentBotId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantAccountAgentBots(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Xóa account agent bot thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa account agent bot";
      toast.error(msg);
    },
  });
};

export const useCreateTenantInbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateTenantInboxRequest;
    }) => chatwootService.createTenantInbox(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo inbox thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantInboxes(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo inbox thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo inbox";
      toast.error(msg);
    },
  });
};

export const useCreateTenantTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateTenantTeamRequest;
    }) => chatwootService.createTenantTeam(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo đội nhóm thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeams(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo đội nhóm";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      teamId,
      data,
    }: {
      tenantId: string;
      teamId: string;
      data: UpdateTenantTeamRequest;
    }) => chatwootService.updateTenantTeam(tenantId, teamId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật đội nhóm thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeams(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeam(
            variables.tenantId,
            variables.teamId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật đội nhóm";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, teamId }: { tenantId: string; teamId: string }) =>
      chatwootService.deleteTenantTeam(tenantId, teamId),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 204) {
        toast.success(res.message || "Xóa đội nhóm thành công");
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantTeam(
            variables.tenantId,
            variables.teamId,
          ),
        });
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantTeamMembers(
            variables.tenantId,
            variables.teamId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeams(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Xóa đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa đội nhóm";
      toast.error(msg);
    },
  });
};

export const useAddTenantTeamMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      teamId,
      data,
    }: {
      tenantId: string;
      teamId: string;
      data: TenantTeamMembersRequest;
    }) => chatwootService.addTenantTeamMembers(tenantId, teamId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Thêm thành viên vào đội nhóm thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeamMembers(
            variables.tenantId,
            variables.teamId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeam(
            variables.tenantId,
            variables.teamId,
          ),
        });
      } else {
        toast.error(res.message || "Thêm thành viên vào đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi thêm thành viên vào đội nhóm";
      toast.error(msg);
    },
  });
};

export const useRemoveTenantTeamMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      teamId,
      data,
    }: {
      tenantId: string;
      teamId: string;
      data: TenantTeamMembersRequest;
    }) => chatwootService.removeTenantTeamMembers(tenantId, teamId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 204) {
        toast.success(res.message || "Xóa thành viên khỏi đội nhóm thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeamMembers(
            variables.tenantId,
            variables.teamId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeam(
            variables.tenantId,
            variables.teamId,
          ),
        });
      } else {
        toast.error(res.message || "Xóa thành viên khỏi đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa thành viên khỏi đội nhóm";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantTeamMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      teamId,
      data,
    }: {
      tenantId: string;
      teamId: string;
      data: TenantTeamMembersRequest;
    }) => chatwootService.updateTenantTeamMembers(tenantId, teamId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật thành viên đội nhóm thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeamMembers(
            variables.tenantId,
            variables.teamId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantTeam(
            variables.tenantId,
            variables.teamId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật thành viên đội nhóm thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật thành viên đội nhóm";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantInbox = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      inboxId,
      data,
    }: {
      tenantId: string;
      inboxId: string;
      data: UpdateTenantInboxRequest;
    }) => chatwootService.updateTenantInbox(tenantId, inboxId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật inbox thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantInboxes(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantInbox(
            variables.tenantId,
            variables.inboxId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật inbox thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật inbox";
      toast.error(msg);
    },
  });
};

export const useCreateAccountInboxMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: AccountInboxMembersRequest;
    }) => chatwootService.createAccountInboxMembers(accountId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Thêm nhân viên vào kênh thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.accountInboxMembers(variables.accountId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantInboxes(variables.accountId),
        });
      } else {
        toast.error(res.message || "Thêm nhân viên vào kênh thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi thêm nhân viên vào kênh";
      toast.error(msg);
    },
  });
};

export const useUpdateAccountInboxMembers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: AccountInboxMembersRequest;
    }) => chatwootService.updateAccountInboxMembers(accountId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Cập nhật nhân viên kênh thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.accountInboxMembers(variables.accountId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantInboxes(variables.accountId),
        });
      } else {
        toast.error(res.message || "Cập nhật nhân viên kênh thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật nhân viên kênh";
      toast.error(msg);
    },
  });
};

export const useCreateTenantLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateTenantLabelRequest;
    }) => chatwootService.createTenantLabel(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo nhãn thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantLabels(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo nhãn thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo nhãn";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantLabel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tenantId, label }: { tenantId: string; label: string }) =>
      chatwootService.deleteTenantLabel(tenantId, label),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa nhãn thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantLabels(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Xóa nhãn thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa nhãn";
      toast.error(msg);
    },
  });
};

export const useCreateTenantConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateTenantConversationRequest;
    }) => chatwootService.createTenantConversation(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo hội thoại thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversations(variables.tenantId),
        });
      } else {
        toast.error(res.message || "Tạo hội thoại thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo hội thoại";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: UpdateTenantConversationRequest;
    }) =>
      chatwootService.updateTenantConversation(tenantId, conversationId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật hội thoại thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(
            variables.tenantId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            variables.tenantId,
            variables.conversationId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật hội thoại thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật hội thoại";
      toast.error(msg);
    },
  });
};

export const useCreateTenantConversationMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: CreateTenantConversationMessageRequest;
    }) =>
      chatwootService.createTenantConversationMessage(
        tenantId,
        conversationId,
        data,
      ),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        const { tenantId, conversationId } = variables;
        const rawMessage = extractCreatedMessageFromResponse(res);

        // Ưu tiên append cache để UI chuyển pending → tin thật mượt, tránh refetch gây duplicate.
        if (rawMessage) {
          appendMessageToConversationMessagesCache(
            queryClient,
            tenantId,
            conversationId,
            rawMessage,
          );
          applyMessageCreatedToConversationList(
            queryClient,
            tenantId,
            conversationId,
            rawMessage,
            true,
          );
        } else {
          queryClient.invalidateQueries({
            queryKey: chatwootOmniKeys.tenantConversationMessages(
              tenantId,
              conversationId,
            ),
          });
        }

        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            tenantId,
            conversationId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId),
        });
      } else {
        toast.error(res.message || "Gửi tin nhắn thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi gửi tin nhắn";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantConversationMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      messageId,
    }: {
      tenantId: string;
      conversationId: string;
      messageId: string;
    }) =>
      chatwootService.deleteTenantConversationMessage(
        tenantId,
        conversationId,
        messageId,
      ),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa tin nhắn thành công");
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantConversationMessage(
            variables.tenantId,
            variables.conversationId,
            variables.messageId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationMessages(
            variables.tenantId,
            variables.conversationId,
          ),
        });
      } else {
        toast.error(res.message || "Xóa tin nhắn thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa tin nhắn";
      toast.error(msg);
    },
  });
};

export const useDeleteTenantConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
    }: {
      tenantId: string;
      conversationId: string;
    }) => chatwootService.deleteTenantConversation(tenantId, conversationId),
    onSuccess: (res, variables) => {
      const statusCode = res?.status_code ?? 200;
      if (statusCode === 200 || statusCode === 204) {
        const { tenantId, conversationId } = variables;

        updateConversationInListCache(
          queryClient,
          tenantId,
          conversationId,
          (conversation) => conversation,
          { remove: true },
        );
        useChatUnreadStore.getState().clearUnread(conversationId);
        useChatStore.getState().removeConversation(conversationId);

        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            tenantId,
            conversationId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId),
        });

        toast.success(res?.message || "Xóa cuộc trò chuyện thành công");
      } else {
        toast.error(res?.message || "Xóa cuộc trò chuyện thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa cuộc trò chuyện";
      toast.error(msg);
    },
  });
};

export const useToggleTenantConversationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: ToggleTenantConversationStatusRequest;
    }) =>
      chatwootService.toggleTenantConversationStatus(
        tenantId,
        conversationId,
        data,
      ),
    onSuccess: async (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        const { tenantId, conversationId, data } = variables;
        const status =
          typeof data.status === "string" ? data.status : "reopened";

        applyConversationStatusToListCache(
          queryClient,
          tenantId,
          conversationId,
          status,
        );
        clearConversationUnreadInListCache(
          queryClient,
          tenantId,
          conversationId,
        );
        useChatUnreadStore.getState().clearUnread(conversationId);

        try {
          await chatwootService.updateTenantConversationLastSeen(
            tenantId,
            conversationId,
          );
        } catch {
          // Trạng thái đã cập nhật; last_seen thất bại không chặn luồng chính.
        }

        toast.success("Cập nhật trạng thái hội thoại thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            tenantId,
            conversationId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId),
        });
      } else {
        toast.error("Có lỗi khi cập nhật trạng thái hội thoại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật trạng thái hội thoại";
      toast.error(msg);
    },
  });
};

export const useSetTenantConversationLabels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: SetTenantConversationLabelsRequest;
    }) =>
      chatwootService.setTenantConversationLabels(
        tenantId,
        conversationId,
        data,
      ),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Cập nhật nhãn hội thoại thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationLabels(
            variables.tenantId,
            variables.conversationId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            variables.tenantId,
            variables.conversationId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật nhãn hội thoại thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật nhãn hội thoại";
      toast.error(msg);
    },
  });
};

export const useToggleTenantConversationTyping = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: ToggleTenantConversationTypingRequest;
    }) =>
      chatwootService.toggleTenantConversationTyping(
        tenantId,
        conversationId,
        data,
      ),
    onSuccess: (res) => {
      if (res.status_code !== 200 && res.status_code !== 201) {
        toast.error(res.message || "Cập nhật typing status thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật typing status";
      toast.error(msg);
    },
  });
};

export const useUpdateTenantConversationCustomAttributes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
      data,
    }: {
      tenantId: string;
      conversationId: string;
      data: UpdateTenantConversationCustomAttributesRequest;
    }) =>
      chatwootService.updateTenantConversationCustomAttributes(
        tenantId,
        conversationId,
        data,
      ),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Cập nhật custom attributes thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            variables.tenantId,
            variables.conversationId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật custom attributes thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật custom attributes";
      toast.error(msg);
    },
  });
};

export const useCreateChatwootUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: CreateChatwootUserRequest;
    }) => chatwootService.createChatwootUser(userId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Tạo Chatwoot user thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.user(variables.userId),
        });
      } else {
        toast.error(res.message || "Tạo Chatwoot user thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi tạo Chatwoot user";
      toast.error(msg);
    },
  });
};

export const useUpdateChatwootUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateChatwootUserRequest;
    }) => chatwootService.updateChatwootUser(userId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật Chatwoot user thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.user(variables.userId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.userSsoLink(variables.userId),
        });
      } else {
        toast.error(res.message || "Cập nhật Chatwoot user thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật Chatwoot user";
      toast.error(msg);
    },
  });
};

export const useDeleteChatwootUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => chatwootService.deleteChatwootUser(userId),
    onSuccess: (res, userId) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa Chatwoot user thành công");
        queryClient.removeQueries({ queryKey: chatwootOmniKeys.user(userId) });
        queryClient.removeQueries({
          queryKey: chatwootOmniKeys.userSsoLink(userId),
        });
      } else {
        toast.error(res.message || "Xóa Chatwoot user thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa Chatwoot user";
      toast.error(msg);
    },
  });
};

export const useBulkAction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: BulkActionRequest;
    }) => chatwootService.bulkAction(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantLabels(variables.tenantId),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(
            variables.tenantId,
          ),
        });
        variables.data.ids.forEach((conversationId) => {
          const id = String(conversationId);
          queryClient.invalidateQueries({
            queryKey: chatwootOmniKeys.tenantConversation(
              variables.tenantId,
              id,
            ),
          });
          queryClient.invalidateQueries({
            queryKey: chatwootOmniKeys.tenantConversationLabels(
              variables.tenantId,
              id,
            ),
          });
        });
      } else {
        toast.error(res.message || "Thực hiện thao tác thất bại");
      }
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi thực hiện";
      toast.error(msg);
    },
  });
};

export const useTenantConversationLastSeen = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      conversationId,
    }: {
      tenantId: string;
      conversationId: string;
    }) =>
      chatwootService.updateTenantConversationLastSeen(
        tenantId,
        conversationId,
      ),
  });
};

export const useFilterConversations = () => {
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
      page,
    }: {
      tenantId: string;
      data: FilterConversationsRequest;
      page?: number;
    }) => chatwootService.filterConversations(tenantId, data, page),
  });
};

export const useCreateAccountCustomFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateAccountCustomFilterRequest;
    }) => chatwootService.createAccountCustomFilter(tenantId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(res.message || "Lưu bộ lọc thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantCustomFilters(variables.tenantId),
        });
        return;
      }

      toast.error(res.message || "Lưu bộ lọc thất bại");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi lưu bộ lọc";
      toast.error(msg);
    },
  });
};

export const useUpdateAccountCustomFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      filterId,
      data,
    }: {
      tenantId: string;
      filterId: number;
      data: UpdateAccountCustomFilterRequest;
    }) => chatwootService.updateAccountCustomFilter(tenantId, filterId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Cập nhật bộ lọc thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantCustomFilters(variables.tenantId),
        });
        return;
      }

      toast.error(res.message || "Cập nhật bộ lọc thất bại");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi cập nhật bộ lọc";
      toast.error(msg);
    },
  });
};

export const useDeleteAccountCustomFilter = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      filterId,
    }: {
      tenantId: string;
      filterId: number;
    }) => chatwootService.deleteAccountCustomFilter(tenantId, filterId),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa bộ lọc thành công");
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantCustomFilters(variables.tenantId),
        });
        return;
      }

      toast.error(res.message || "Xóa bộ lọc thất bại");
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Có lỗi khi xóa bộ lọc";
      toast.error(msg);
    },
  });
};
