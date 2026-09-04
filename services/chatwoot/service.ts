import apiClient from "@/lib/api-client";

import type {
  AssignTenantConversationRequest,
  AssignTenantConversationResponse,
  CreateTenantAccountAgentBotRequest,
  CreateTenantAccountAgentBotResponse,
  CreateChatwootAgentBotRequest,
  CreateChatwootAgentBotResponse,
  CreateChatwootAgentRequest,
  CreateChatwootAgentResponse,
  CreateTenantConversationMessageRequest,
  CreateTenantConversationMessageResponse,
  CreateTenantConversationRequest,
  CreateTenantConversationResponse,
  CreateTenantInboxRequest,
  CreateTenantInboxResponse,
  AccountInboxMembersRequest,
  CreateAccountInboxMembersResponse,
  ListAccountInboxMembersResponse,
  UpdateAccountInboxMembersResponse,
  CreateTenantLabelRequest,
  CreateTenantLabelResponse,
  CreateChatwootUserRequest,
  CreateChatwootUserResponse,
  DeleteTenantAccountAgentBotResponse,
  DeleteChatwootAgentBotResponse,
  DeleteChatwootAgentResponse,
  DeleteTenantConversationMessageResponse,
  DeleteTenantConversationResponse,
  DeleteTenantLabelResponse,
  DeleteChatwootUserResponse,
  DeleteTenantChatwootAccountResponse,
  GetChatwootAgentBotResponse,
  GetTenantAccountAgentBotResponse,
  GetTenantConversationLabelsResponse,
  BulkActionRequest,
  BulkActionResponse,
  GetTenantInboxResponse,
  GetChatwootUserResponse,
  GetChatwootUserSsoLinkResponse,
  GetTenantChatwootAccountResponse,
  GetTenantConversationResponse,
  ListAllChatwootAgentBotsResponse,
  ListChatwootAgentsResponse,
  ListTenantAccountAgentBotsResponse,
  ListTenantChatwootAgentBotsResponse,
  ListTenantInboxesResponse,
  ListTenantLabelsResponse,
  ListTenantTeamMembersResponse,
  ListTenantConversationMessagesParams,
  ListTenantConversationMessagesResponse,
  ListTenantConversationsParams,
  ListTenantConversationsResponse,
  GetTenantTeamResponse,
  ListTenantTeamsResponse,
  ProvisionChatwootAccountRequest,
  ProvisionChatwootAccountResponse,
  SetTenantConversationLabelsRequest,
  SetTenantConversationLabelsResponse,
  SyncChatwootIntegrationAccountUserResponse,
  ToggleTenantConversationStatusRequest,
  ToggleTenantConversationStatusResponse,
  ToggleTenantConversationTypingRequest,
  ToggleTenantConversationTypingResponse,
  UpdateTenantAccountAgentBotRequest,
  UpdateTenantAccountAgentBotResponse,
  UpdateChatwootAgentBotRequest,
  UpdateChatwootAgentBotResponse,
  UpdateChatwootAgentRequest,
  UpdateChatwootAgentResponse,
  UpdateTenantConversationCustomAttributesRequest,
  UpdateTenantConversationCustomAttributesResponse,
  UpdateTenantConversationRequest,
  UpdateTenantConversationResponse,
  UpdateTenantInboxRequest,
  UpdateTenantInboxRequestBody,
  UpdateTenantInboxResponse,
  CreateTenantTeamRequest,
  CreateTenantTeamResponse,
  UpdateTenantTeamRequest,
  UpdateTenantTeamResponse,
  DeleteTenantTeamResponse,
  TenantTeamMembersRequest,
  AddTenantTeamMembersResponse,
  RemoveTenantTeamMembersResponse,
  UpdateTenantTeamMembersResponse,
  UpdateChatwootUserRequest,
  UpdateChatwootUserResponse,
  UpdateTenantChatwootAccountRequest,
  UpdateTenantChatwootAccountResponse,
  FilterConversationsRequest,
  FilterConversationsResponse,
  CreateAccountCustomFilterRequest,
  CreateAccountCustomFilterResponse,
  UpdateAccountCustomFilterRequest,
  UpdateAccountCustomFilterResponse,
  DeleteAccountCustomFilterResponse,
  ListAccountCustomFiltersResponse,
} from "./interface";

/** Prefix khớp Postman collection "Đa kênh có chatwoot" */
const CHATWOOT_BASE = "/messaging";

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

  /** GET /api/v1/chatwoot/tenants/:tenant_id/account-agent-bots/:agent_bot_id */
  getTenantAccountAgentBot: async (
    tenantId: string,
    agentBotId: string,
  ): Promise<GetTenantAccountAgentBotResponse> => {
    const response = await apiClient.get<GetTenantAccountAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account-agent-bots/${agentBotId}`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/account-agent-bots/:agent_bot_id */
  updateTenantAccountAgentBot: async (
    tenantId: string,
    agentBotId: string,
    data: UpdateTenantAccountAgentBotRequest,
  ): Promise<UpdateTenantAccountAgentBotResponse> => {
    const response = await apiClient.patch<UpdateTenantAccountAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account-agent-bots/${agentBotId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/account-agent-bots/:agent_bot_id */
  deleteTenantAccountAgentBot: async (
    tenantId: string,
    agentBotId: string,
  ): Promise<DeleteTenantAccountAgentBotResponse> => {
    const response =
      await apiClient.delete<DeleteTenantAccountAgentBotResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/account-agent-bots/${agentBotId}`,
      );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/account-agent-bots */
  listTenantAccountAgentBots: async (
    tenantId: string,
  ): Promise<ListTenantAccountAgentBotsResponse> => {
    const response = await apiClient.get<ListTenantAccountAgentBotsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account-agent-bots`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/account-agent-bots */
  createTenantAccountAgentBot: async (
    tenantId: string,
    data: CreateTenantAccountAgentBotRequest,
  ): Promise<CreateTenantAccountAgentBotResponse> => {
    const response = await apiClient.post<CreateTenantAccountAgentBotResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/account-agent-bots`,
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

  /** GET /api/v1/chatwoot/tenants/:tenant_id/inboxes */
  listTenantInboxes: async (
    tenantId: string,
  ): Promise<ListTenantInboxesResponse> => {
    const response = await apiClient.get<ListTenantInboxesResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/inboxes`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/inboxes */
  createTenantInbox: async (
    tenantId: string,
    data: CreateTenantInboxRequest,
  ): Promise<CreateTenantInboxResponse> => {
    const response = await apiClient.post<CreateTenantInboxResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/inboxes`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/inboxes/:inbox_id */
  getTenantInbox: async (
    tenantId: string,
    inboxId: string,
  ): Promise<GetTenantInboxResponse> => {
    const response = await apiClient.get<GetTenantInboxResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/inboxes/${inboxId}`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/inboxes/:inbox_id */
  updateTenantInbox: async (
    tenantId: string,
    inboxId: string,
    data: UpdateTenantInboxRequestBody,
  ): Promise<UpdateTenantInboxResponse> => {
    const response = await apiClient.patch<UpdateTenantInboxResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/inboxes/${inboxId}`,
      data,
      data instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/teams */
  listTenantTeams: async (
    tenantId: string,
  ): Promise<ListTenantTeamsResponse> => {
    const response = await apiClient.get<ListTenantTeamsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/teams */
  createTenantTeam: async (
    tenantId: string,
    data: CreateTenantTeamRequest,
  ): Promise<CreateTenantTeamResponse> => {
    const response = await apiClient.post<CreateTenantTeamResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id */
  getTenantTeam: async (
    tenantId: string,
    teamId: string,
  ): Promise<GetTenantTeamResponse> => {
    const response = await apiClient.get<GetTenantTeamResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}`,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id */
  updateTenantTeam: async (
    tenantId: string,
    teamId: string,
    data: UpdateTenantTeamRequest,
  ): Promise<UpdateTenantTeamResponse> => {
    const response = await apiClient.patch<UpdateTenantTeamResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id */
  deleteTenantTeam: async (
    tenantId: string,
    teamId: string,
  ): Promise<DeleteTenantTeamResponse> => {
    const response = await apiClient.delete<DeleteTenantTeamResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}`,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id/team_members */
  listTenantTeamMembers: async (
    tenantId: string,
    teamId: string,
  ): Promise<ListTenantTeamMembersResponse> => {
    const response = await apiClient.get<ListTenantTeamMembersResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}/team_members`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id/team_members */
  addTenantTeamMembers: async (
    tenantId: string,
    teamId: string,
    data: TenantTeamMembersRequest,
  ): Promise<AddTenantTeamMembersResponse> => {
    const response = await apiClient.post<AddTenantTeamMembersResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}/team_members`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id/team_members */
  removeTenantTeamMembers: async (
    tenantId: string,
    teamId: string,
    data: TenantTeamMembersRequest,
  ): Promise<RemoveTenantTeamMembersResponse> => {
    const response = await apiClient.delete<RemoveTenantTeamMembersResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}/team_members`,
      { data },
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/teams/:team_id/team_members */
  updateTenantTeamMembers: async (
    tenantId: string,
    teamId: string,
    data: TenantTeamMembersRequest,
  ): Promise<UpdateTenantTeamMembersResponse> => {
    const response = await apiClient.patch<UpdateTenantTeamMembersResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/teams/${teamId}/team_members`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/labels */
  listTenantLabels: async (
    tenantId: string,
  ): Promise<ListTenantLabelsResponse> => {
    const response = await apiClient.get<ListTenantLabelsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/labels`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/labels */
  createTenantLabel: async (
    tenantId: string,
    data: CreateTenantLabelRequest,
  ): Promise<CreateTenantLabelResponse> => {
    const response = await apiClient.post<CreateTenantLabelResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/labels`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/labels/:label */
  deleteTenantLabel: async (
    tenantId: string,
    label: string,
  ): Promise<DeleteTenantLabelResponse> => {
    const response = await apiClient.delete<DeleteTenantLabelResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/labels/${encodeURIComponent(label)}`,
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

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/messages */
  createTenantConversationMessage: async (
    tenantId: string,
    conversationId: string,
    data: CreateTenantConversationMessageRequest,
  ): Promise<CreateTenantConversationMessageResponse> => {
    const response =
      await apiClient.post<CreateTenantConversationMessageResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/messages`,
        data,
        data instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : undefined,
      );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/messages/:message_id */
  deleteTenantConversationMessage: async (
    tenantId: string,
    conversationId: string,
    messageId: string,
  ): Promise<DeleteTenantConversationMessageResponse> => {
    const response =
      await apiClient.delete<DeleteTenantConversationMessageResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/messages/${messageId}`,
      );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/toggle_status */
  toggleTenantConversationStatus: async (
    tenantId: string,
    conversationId: string,
    data: ToggleTenantConversationStatusRequest,
  ): Promise<ToggleTenantConversationStatusResponse> => {
    const response =
      await apiClient.post<ToggleTenantConversationStatusResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/toggle_status`,
        data,
      );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/labels */
  getTenantConversationLabels: async (
    tenantId: string,
    conversationId: string,
  ): Promise<GetTenantConversationLabelsResponse> => {
    const response = await apiClient.get<GetTenantConversationLabelsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/labels`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/labels */
  setTenantConversationLabels: async (
    tenantId: string,
    conversationId: string,
    data: SetTenantConversationLabelsRequest,
  ): Promise<SetTenantConversationLabelsResponse> => {
    const response = await apiClient.post<SetTenantConversationLabelsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/labels`,
      data,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/toggle_typing_status */
  toggleTenantConversationTyping: async (
    tenantId: string,
    conversationId: string,
    data: ToggleTenantConversationTypingRequest,
  ): Promise<ToggleTenantConversationTypingResponse> => {
    const response =
      await apiClient.post<ToggleTenantConversationTypingResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/toggle_typing_status`,
        data,
      );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id/custom_attributes */
  updateTenantConversationCustomAttributes: async (
    tenantId: string,
    conversationId: string,
    data: UpdateTenantConversationCustomAttributesRequest,
  ): Promise<UpdateTenantConversationCustomAttributesResponse> => {
    const response =
      await apiClient.post<UpdateTenantConversationCustomAttributesResponse>(
        `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/custom_attributes`,
        data,
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

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations/filter */
  filterConversations: async (
    tenantId: string,
    data: FilterConversationsRequest,
    page?: number,
    query?: Pick<
      ListTenantConversationsParams,
      "conversation_type" | "assignee_type"
    >,
  ): Promise<FilterConversationsResponse> => {
    const response = await apiClient.post<FilterConversationsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/filter`,
      data,
      {
        params: {
          page: typeof page === "number" && Number.isFinite(page) ? page : 1,
          ...(query?.conversation_type
            ? { conversation_type: query.conversation_type }
            : {}),
          ...(query?.assignee_type
            ? { assignee_type: query.assignee_type }
            : {}),
        },
      },
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/tenants/:tenant_id/conversations */
  listTenantConversations: async (
    tenantId: string,
    params?: ListTenantConversationsParams,
  ): Promise<ListTenantConversationsResponse> => {
    const requestParams = params
      ? (() => {
          const { labels, status, ...rest } = params;
          const statusValues = Array.isArray(status)
            ? status
            : typeof status === "string" && status.includes(",")
              ? status
                  .split(",")
                  .map((value) => value.trim())
                  .filter(Boolean)
              : status
                ? [status]
                : [];

          return {
            ...rest,
            ...(statusValues.length > 0
              ? {
                  status:
                    statusValues.length === 1
                      ? statusValues[0]
                      : statusValues.join(","),
                }
              : {}),
            ...(Array.isArray(labels) && labels.length > 0
              ? { "labels[]": labels }
              : {}),
          };
        })()
      : undefined;

    const response = await apiClient.get<ListTenantConversationsResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations`,
      {
        params: requestParams,
        paramsSerializer: {
          indexes: false,
        },
      },
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/:tenant_id/conversations */
  createTenantConversation: async (
    tenantId: string,
    data: CreateTenantConversationRequest,
  ): Promise<CreateTenantConversationResponse> => {
    const response = await apiClient.post<CreateTenantConversationResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations`,
      data,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id */
  updateTenantConversation: async (
    tenantId: string,
    conversationId: string,
    data: UpdateTenantConversationRequest,
  ): Promise<UpdateTenantConversationResponse> => {
    const response = await apiClient.patch<UpdateTenantConversationResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/tenants/:tenant_id/conversations/:conversation_id */
  deleteTenantConversation: async (
    tenantId: string,
    conversationId: string,
  ): Promise<DeleteTenantConversationResponse> => {
    const response = await apiClient.delete<DeleteTenantConversationResponse>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}`,
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

  /** POST /api/v1/chatwoot/accounts/:tenant_id/bulk_actions */
  bulkAction: async (
    tenantId: string,
    data: BulkActionRequest,
  ): Promise<BulkActionResponse> => {
    const response = await apiClient.post<BulkActionResponse>(
      `${CHATWOOT_BASE}/accounts/${tenantId}/bulk_actions`,
      data,
    );
    return response.data;
  },

  /** GET /api/v1/chatwoot/accounts/:tenant_id/custom_filters */
  listAccountCustomFilters: async (
    tenantId: string,
  ): Promise<ListAccountCustomFiltersResponse> => {
    const response = await apiClient.get<ListAccountCustomFiltersResponse>(
      `${CHATWOOT_BASE}/accounts/${tenantId}/custom_filters`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/accounts/:tenant_id/custom_filters */
  createAccountCustomFilter: async (
    tenantId: string,
    data: CreateAccountCustomFilterRequest,
  ): Promise<CreateAccountCustomFilterResponse> => {
    const response = await apiClient.post<CreateAccountCustomFilterResponse>(
      `${CHATWOOT_BASE}/accounts/${tenantId}/custom_filters`,
      data,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/accounts/:tenant_id/custom_filters/:filter_id */
  updateAccountCustomFilter: async (
    tenantId: string,
    filterId: number,
    data: UpdateAccountCustomFilterRequest,
  ): Promise<UpdateAccountCustomFilterResponse> => {
    const response = await apiClient.patch<UpdateAccountCustomFilterResponse>(
      `${CHATWOOT_BASE}/accounts/${tenantId}/custom_filters/${filterId}`,
      data,
    );
    return response.data;
  },

  /** DELETE /api/v1/chatwoot/accounts/:tenant_id/custom_filters/:filter_id */
  deleteAccountCustomFilter: async (
    tenantId: string,
    filterId: number,
  ): Promise<DeleteAccountCustomFilterResponse> => {
    const response = await apiClient.delete<DeleteAccountCustomFilterResponse>(
      `${CHATWOOT_BASE}/accounts/${tenantId}/custom_filters/${filterId}`,
    );
    return response.data;
  },

  /** GET /api/v1/messaging/accounts/:account_id/inbox_members/:inbox_id */
  listAccountInboxMembers: async (
    accountId: string,
    inboxId: string | number,
  ): Promise<ListAccountInboxMembersResponse> => {
    const response = await apiClient.get<ListAccountInboxMembersResponse>(
      `${CHATWOOT_BASE}/accounts/${accountId}/inbox_members/${inboxId}`,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/accounts/:account_id/inbox_members */
  createAccountInboxMembers: async (
    accountId: string,
    data: AccountInboxMembersRequest,
  ): Promise<CreateAccountInboxMembersResponse> => {
    const response = await apiClient.post<CreateAccountInboxMembersResponse>(
      `${CHATWOOT_BASE}/accounts/${accountId}/inbox_members`,
      data,
    );
    return response.data;
  },

  /** PATCH /api/v1/chatwoot/accounts/:account_id/inbox_members */
  updateAccountInboxMembers: async (
    accountId: string,
    data: AccountInboxMembersRequest,
  ): Promise<UpdateAccountInboxMembersResponse> => {
    const response = await apiClient.patch<UpdateAccountInboxMembersResponse>(
      `${CHATWOOT_BASE}/accounts/${accountId}/inbox_members`,
      data,
    );
    return response.data;
  },

  /** POST /api/v1/chatwoot/tenants/{tenant_id}/conversations/{conversation_id}/update_last_seen */
  updateTenantConversationLastSeen: async (
    tenantId: string,
    conversationId: string,
  ): Promise<unknown> => {
    const response = await apiClient.post<unknown>(
      `${CHATWOOT_BASE}/tenants/${tenantId}/conversations/${conversationId}/update_last_seen`,
    );
    return response.data;
  },
};
