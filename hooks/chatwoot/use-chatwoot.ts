import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AssignTenantConversationRequest,
  CreateChatwootAgentBotRequest,
  CreateChatwootAgentRequest,
  CreateChatwootUserRequest,
  ListTenantConversationMessagesParams,
  ListTenantConversationsParams,
  ProvisionChatwootAccountRequest,
  UpdateChatwootAgentBotRequest,
  UpdateChatwootAgentRequest,
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
  tenantAgents: (tenantId: string) =>
    [...chatwootOmniKeys.tenant(tenantId), "agents"] as const,
  tenantConversations: (
    tenantId: string,
    params?: ListTenantConversationsParams,
  ) =>
    [
      ...chatwootOmniKeys.tenant(tenantId),
      "conversations",
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
    queryKey: ["tenantMessages", safeTenantId, safeConversationId, params],
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
      const messageIds = payloadCandidate
        .map((message) =>
          message && typeof message === "object"
            ? Number((message as Record<string, unknown>).id)
            : NaN,
        )
        .filter((id) => Number.isFinite(id));

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
          queryKey: chatwootOmniKeys.tenantConversations(variables.tenantId),
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
