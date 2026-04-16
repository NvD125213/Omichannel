import apiClient from "@/lib/api-client";

import type {
  AssignTenantConversationRequest,
  AssignTenantConversationResponse,
  CreateChatwootAgentBotRequest,
  CreateChatwootAgentBotResponse,
  CreateChatwootAgentRequest,
  CreateChatwootAgentResponse,
  CreateChatwootUserRequest,
  CreateChatwootUserResponse,
  DeleteChatwootAgentBotResponse,
  DeleteChatwootAgentResponse,
  DeleteChatwootUserResponse,
  DeleteTenantChatwootAccountResponse,
  GetChatwootAgentBotResponse,
  GetChatwootUserResponse,
  GetChatwootUserSsoLinkResponse,
  GetTenantChatwootAccountResponse,
  GetTenantConversationResponse,
  ListAllChatwootAgentBotsResponse,
  ListChatwootAgentsResponse,
  ListTenantChatwootAgentBotsResponse,
  ListTenantConversationMessagesParams,
  ListTenantConversationMessagesResponse,
  ListTenantConversationsParams,
  ListTenantConversationsResponse,
  ProvisionChatwootAccountRequest,
  ProvisionChatwootAccountResponse,
  SyncChatwootIntegrationAccountUserResponse,
  UpdateChatwootAgentBotRequest,
  UpdateChatwootAgentBotResponse,
  UpdateChatwootAgentRequest,
  UpdateChatwootAgentResponse,
  UpdateChatwootUserRequest,
  UpdateChatwootUserResponse,
  UpdateTenantChatwootAccountRequest,
  UpdateTenantChatwootAccountResponse,
} from "./interface";

/** Prefix khớp Postman collection "Đa kênh có chatwoot" */
const CHATWOOT_BASE = "/chatwoot";

/**
 * Gọi API Đa kênh (proxy Chatwoot) qua `apiClient` — cùng kiểu trả về `ApiResponse<T>` như `customerService`.
 */
export const chatwootService = {
  /** POST /api/v1/chatwoot/accounts — Provision Chatwoot Account */
  provisionChatwootAccount: async (
    data: ProvisionChatwootAccountRequest,
  ): Promise<ProvisionChatwootAccountResponse> => {
    const response = await apiClient.post<ProvisionChatwootAccountResponse>(
      `${CHATWOOT_BASE}/accounts`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/account */
  getTenantChatwootAccount: async (
    tenantId: string,
  ): Promise<GetTenantChatwootAccountResponse> => {
    const response = await apiClient.get<GetTenantChatwootAccountResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/account */
  updateTenantChatwootAccount: async (
    tenantId: string,
    data: UpdateTenantChatwootAccountRequest,
  ): Promise<UpdateTenantChatwootAccountResponse> => {
    const response = await apiClient.patch<UpdateTenantChatwootAccountResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/account */
  deleteTenantChatwootAccount: async (
    tenantId: string,
  ): Promise<DeleteTenantChatwootAccountResponse> => {
    const response =
      await apiClient.delete<DeleteTenantChatwootAccountResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/account`,
      );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/integration-account-user */
  syncChatwootIntegrationAccountUser: async (
    tenantId: string,
  ): Promise<SyncChatwootIntegrationAccountUserResponse> => {
    const response =
      await apiClient.post<SyncChatwootIntegrationAccountUserResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/integration-account-user`,
      );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/agent-bots/:bot_id */
  getChatwootAgentBot: async (
    tenantId: string,
    botId: string,
  ): Promise<GetChatwootAgentBotResponse> => {
    const response = await apiClient.get<GetChatwootAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agent-bots/${botId}`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/agent-bots/:bot_id */
  updateChatwootAgentBot: async (
    tenantId: string,
    botId: string,
    data: UpdateChatwootAgentBotRequest,
  ): Promise<UpdateChatwootAgentBotResponse> => {
    const response = await apiClient.patch<UpdateChatwootAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agent-bots/${botId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/agent-bots/:bot_id */
  deleteChatwootAgentBot: async (
    tenantId: string,
    botId: string,
  ): Promise<DeleteChatwootAgentBotResponse> => {
    const response = await apiClient.delete<DeleteChatwootAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agent-bots/${botId}`,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/agent-bots */
  listTenantChatwootAgentBots: async (
    tenantId: string,
  ): Promise<ListTenantChatwootAgentBotsResponse> => {
    const response = await apiClient.get<ListTenantChatwootAgentBotsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agent-bots`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/agent-bots */
  createChatwootAgentBot: async (
    tenantId: string,
    data: CreateChatwootAgentBotRequest,
  ): Promise<CreateChatwootAgentBotResponse> => {
    const response = await apiClient.post<CreateChatwootAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agent-bots`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/agents */
  listChatwootAgents: async (
    tenantId: string,
  ): Promise<ListChatwootAgentsResponse> => {
    const response = await apiClient.get<ListChatwootAgentsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agents`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/agents */
  createChatwootAgent: async (
    tenantId: string,
    data: CreateChatwootAgentRequest,
  ): Promise<CreateChatwootAgentResponse> => {
    const response = await apiClient.post<CreateChatwootAgentResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agents`,
      data,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/agents/:agent_id */
  updateChatwootAgent: async (
    tenantId: string,
    agentId: string,
    data: UpdateChatwootAgentRequest,
  ): Promise<UpdateChatwootAgentResponse> => {
    const response = await apiClient.patch<UpdateChatwootAgentResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agents/${agentId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/agents/:agent_id */
  deleteChatwootAgent: async (
    tenantId: string,
    agentId: string,
  ): Promise<DeleteChatwootAgentResponse> => {
    const response = await apiClient.delete<DeleteChatwootAgentResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/agents/${agentId}`,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/messages */
  listTenantConversationMessages: async (
    tenantId: string,
    conversationId: string,
    params?: ListTenantConversationMessagesParams,
  ): Promise<ListTenantConversationMessagesResponse> => {
    const response =
      await apiClient.get<ListTenantConversationMessagesResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/messages`,
        { params },
      );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/assignments */
  assignTenantConversation: async (
    tenantId: string,
    conversationId: string,
    data: AssignTenantConversationRequest,
  ): Promise<AssignTenantConversationResponse> => {
    const response = await apiClient.post<AssignTenantConversationResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/assignments`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id */
  getTenantConversation: async (
    tenantId: string,
    conversationId: string,
  ): Promise<GetTenantConversationResponse> => {
    const response = await apiClient.get<GetTenantConversationResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}`,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/conversations */
  listTenantConversations: async (
    tenantId: string,
    params?: ListTenantConversationsParams,
  ): Promise<ListTenantConversationsResponse> => {
    const response = await apiClient.get<ListTenantConversationsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations`,
      { params },
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/users/:user_id/sso-link */
  getChatwootUserSsoLink: async (
    userId: string,
  ): Promise<GetChatwootUserSsoLinkResponse> => {
    const response = await apiClient.get<GetChatwootUserSsoLinkResponse>(
      `${CHATWOOT_BASE}/users/${userId}/sso-link`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/users/:user_id */
  createChatwootUser: async (
    userId: string,
    data: CreateChatwootUserRequest,
  ): Promise<CreateChatwootUserResponse> => {
    const response = await apiClient.post<CreateChatwootUserResponse>(
      `${CHATWOOT_BASE}/users/${userId}`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/users/:user_id */
  getChatwootUser: async (userId: string): Promise<GetChatwootUserResponse> => {
    const response = await apiClient.get<GetChatwootUserResponse>(
      `${CHATWOOT_BASE}/users/${userId}`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/users/:user_id */
  updateChatwootUser: async (
    userId: string,
    data: UpdateChatwootUserRequest,
  ): Promise<UpdateChatwootUserResponse> => {
    const response = await apiClient.patch<UpdateChatwootUserResponse>(
      `${CHATWOOT_BASE}/users/${userId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/users/:user_id */
  deleteChatwootUser: async (
    userId: string,
  ): Promise<DeleteChatwootUserResponse> => {
    const response = await apiClient.delete<DeleteChatwootUserResponse>(
      `${CHATWOOT_BASE}/users/${userId}`,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/agent-bots */
  listAllChatwootAgentBots:
    async (): Promise<ListAllChatwootAgentBotsResponse> => {
      const response = await apiClient.get<ListAllChatwootAgentBotsResponse>(
        `${CHATWOOT_BASE}/agent-bots`,
      );
      return response.data;
    },
};
