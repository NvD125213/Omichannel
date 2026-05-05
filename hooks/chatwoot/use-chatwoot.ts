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
  CreateChatwootUserRequest,
  ListTenantConversationMessagesParams,
  ListTenantConversationsParams,
  ProvisionChatwootAccountRequest,
  SetTenantConversationLabelsRequest,
  ToggleTenantConversationStatusRequest,
  ToggleTenantConversationTypingRequest,
  UpdateTenantAccountAgentBotRequest,
  UpdateChatwootAgentBotRequest,
  UpdateChatwootAgentRequest,
  UpdateTenantConversationCustomAttributesRequest,
  UpdateTenantConversationRequest,
  UpdateTenantInboxRequest,
  UpdateChatwootUserRequest,
  UpdateTenantChatwootAccountRequest,
} from "@/services/chatwoot/interface";
import { chatwootService } from "@/services/chatwoot/service";

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
  tenantTeams: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "teams"] as const,
  tenantLabels: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "labels"] as const,
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

export const useListTenantLabels = (tenantId: string) => {
  return useQuery({
    queryKey: chatwootOmniKeys.tenantLabels(tenantId),
    queryFn: () => chatwootService.listTenantLabels(tenantId),
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
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationMessages(
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
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(
            variables.tenantId,
          ),
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
    onSuccess: (res, variables) => {
      if (res.status_code === 200 || res.status_code === 201) {
        toast.success(
          res.message || "Cập nhật trạng thái hội thoại thành công",
        );
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversation(
            variables.tenantId,
            variables.conversationId,
          ),
        });
        queryClient.invalidateQueries({
          queryKey: chatwootOmniKeys.tenantConversationsBase(
            variables.tenantId,
          ),
        });
      } else {
        toast.error(res.message || "Cập nhật trạng thái hội thoại thất bại");
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
