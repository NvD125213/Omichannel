/**
 * Kiểu dữ liệu Đa kênh — nhóm `chatwoot` trong Postman
 * "Đa kênh có chatwoot" → `{{baseUrl}}/api/v1/chatwoot/...`
 */

// —— Response chung (cùng format @services/customer/service.ts) ——

export interface ApiResponse<T> {
  status: string;
  status_code: number;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** 422 FastAPI-style từ collection */
export interface HttpValidationErrorDetailItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HttpValidationError {
  detail: HttpValidationErrorDetailItem[];
}

/** Payload linh hoạt khi schema response trong Postman trống */
export type ChatwootJsonPayload = Record<string, unknown>;

// —— POST /api/v1/chatwoot/accounts — Provision Chatwoot Account ——

export interface ProvisionChatwootAccountRequest {
  tenant_id: string;
  name: string;
  locale: string;
  domain?: string | null;
  support_email: string;
  status?: string | null;
  limits?: unknown | null;
  custom_attributes?: Record<string, unknown>;
  features?: unknown | null;
}

export type ProvisionChatwootAccountResponse = ApiResponse<ChatwootJsonPayload>;

// —— /api/v1/chatwoot/tenants/:tenant_id/account ——

export interface UpdateTenantChatwootAccountRequest {
  name?: string;
  locale?: string;
  domain?: string | null;
  support_email?: string;
  status?: string | null;
  limits?: unknown | null;
  custom_attributes?: Record<string, unknown>;
  features?: unknown | null;
}

export type GetTenantChatwootAccountResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateTenantChatwootAccountResponse =
  ApiResponse<ChatwootJsonPayload>;
export type DeleteTenantChatwootAccountResponse = ApiResponse<void>;

// —— POST .../integration-account-user ——

export type SyncChatwootIntegrationAccountUserResponse =
  ApiResponse<ChatwootJsonPayload>;

// —— Agent bots (tenant + global) ——

export interface CreateChatwootAgentBotRequest {
  name: string;
  description?: string | null;
  outgoing_url?: string | null;
  account_id?: number;
  avatar_url?: string | null;
}

export interface UpdateChatwootAgentBotRequest {
  name?: string;
  description?: string;
  outgoing_url?: string;
  account_id?: number;
  avatar_url?: string;
}

export type GetChatwootAgentBotResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateChatwootAgentBotResponse = ApiResponse<ChatwootJsonPayload>;
export type DeleteChatwootAgentBotResponse = ApiResponse<void>;
export type ListTenantChatwootAgentBotsResponse =
  ApiResponse<ChatwootJsonPayload>;
export type CreateChatwootAgentBotResponse = ApiResponse<ChatwootJsonPayload>;
export type ListAllChatwootAgentBotsResponse = ApiResponse<ChatwootJsonPayload>;

// —— Tenant account agent bots ——

export interface CreateTenantAccountAgentBotRequest {
  [key: string]: unknown;
}

export interface UpdateTenantAccountAgentBotRequest {
  [key: string]: unknown;
}

export type GetTenantAccountAgentBotResponse = ApiResponse<ChatwootJsonPayload>;
export type ListTenantAccountAgentBotsResponse =
  ApiResponse<ChatwootJsonPayload>;
export type CreateTenantAccountAgentBotResponse =
  ApiResponse<ChatwootJsonPayload>;
export type UpdateTenantAccountAgentBotResponse =
  ApiResponse<ChatwootJsonPayload>;
export type DeleteTenantAccountAgentBotResponse = ApiResponse<void>;

// —— Agents ——

export interface CreateChatwootAgentRequest {
  name: string;
  email: string;
  role: "administrator" | "agent";
  availability_status: string;
  auto_offline?: boolean | null;
}

export interface UpdateChatwootAgentRequest {
  role?: "administrator" | "agent";
  availability_status?: string;
  auto_offline?: boolean;
}

export type ListChatwootAgentsResponse = ApiResponse<ChatwootJsonPayload>;
export type CreateChatwootAgentResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateChatwootAgentResponse = ApiResponse<ChatwootJsonPayload>;
export type DeleteChatwootAgentResponse = ApiResponse<void>;

// —— Conversations & messages ——

export interface ListTenantConversationsParams {
  page?: number;
  page_size?: number;
  /** open | resolved | pending | snoozed | all */
  status?: string;
  /** me | unassigned | all | assigned */
  assignee_type?: string;
  /** me | mention | unattended — khớp sidebar / Chatwoot proxy */
  conversation_type?: string;
  sort_by?: string;
  inbox_id?: number;
  team_id?: number | string;
  labels?: string[];
  q?: string;
}

/** Meta đếm tab (Chatwoot / proxy) */
export interface TenantConversationsListMeta {
  mine_count?: number;
  assigned_count?: number;
  unassigned_count?: number;
  all_count?: number;
  [key: string]: unknown;
}

/**
 * Phần `data` trong `ApiResponse` của GET `/messaging/tenants/:tenant_id/conversations`.
 * Có thể trả `payload` phẳng hoặc lồng qua `data` / `messaging.data`.
 */
export interface ListTenantConversationsData {
  payload?: unknown[];
  meta?: TenantConversationsListMeta;
  data?: {
    payload?: unknown[];
    meta?: TenantConversationsListMeta;
  };
  messaging?: {
    data?: {
      payload?: unknown[];
      meta?: TenantConversationsListMeta;
    };
    payload?: unknown[];
    meta?: TenantConversationsListMeta;
  };
  /** @deprecated legacy key — prefer `messaging` */
  chatwoot?: {
    data?: {
      payload?: unknown[];
      meta?: TenantConversationsListMeta;
    };
  };
}

export interface ListTenantConversationMessagesParams {
  before?: number;
  after?: number;
}

export interface AssignTenantConversationRequest {
  assignee_agent_uuid: string;
  team_id?: string | null;
}

export type ListTenantConversationsResponse =
  ApiResponse<ListTenantConversationsData>;
export type GetTenantConversationResponse = ApiResponse<ChatwootJsonPayload>;
export type ListTenantConversationMessagesResponse =
  ApiResponse<ChatwootJsonPayload>;
export type AssignTenantConversationResponse = ApiResponse<ChatwootJsonPayload>;

export interface CreateTenantConversationRequest {
  [key: string]: unknown;
}

export interface UpdateTenantConversationRequest {
  [key: string]: unknown;
}

export type CreateTenantConversationMessageRequest =
  | Record<string, unknown>
  | FormData;

export interface ToggleTenantConversationStatusRequest {
  [key: string]: unknown;
}

export interface SetTenantConversationLabelsRequest {
  labels: string[];
}

export interface ToggleTenantConversationTypingRequest {
  [key: string]: unknown;
}

export interface UpdateTenantConversationCustomAttributesRequest {
  custom_attributes: Record<string, unknown>;
}

export type CreateTenantConversationResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateTenantConversationResponse = ApiResponse<ChatwootJsonPayload>;
export type DeleteTenantConversationResponse = ApiResponse<void>;
export type CreateTenantConversationMessageResponse =
  ApiResponse<ChatwootJsonPayload>;
export type DeleteTenantConversationMessageResponse = ApiResponse<void>;
export type ToggleTenantConversationStatusResponse =
  ApiResponse<ChatwootJsonPayload>;
export type GetTenantConversationLabelsResponse =
  ApiResponse<ChatwootJsonPayload>;
export type SetTenantConversationLabelsResponse =
  ApiResponse<ChatwootJsonPayload>;
export type ToggleTenantConversationTypingResponse =
  ApiResponse<ChatwootJsonPayload>;
export type UpdateTenantConversationCustomAttributesResponse =
  ApiResponse<ChatwootJsonPayload>;

// —— Inboxes / teams / labels ——

export interface CreateTenantInboxRequest {
  [key: string]: unknown;
}

export interface UpdateTenantInboxRequest {
  [key: string]: unknown;
}

export interface TenantTeam {
  id?: string | number;
  name: string;
  description?: string | null;
  allow_auto_assign?: boolean | null;
  [key: string]: unknown;
}

export interface CreateTenantTeamRequest {
  name: string;
  description?: string | null;
  allow_auto_assign?: boolean | null;
}

export type UpdateTenantTeamRequest = Partial<CreateTenantTeamRequest> & {
  [key: string]: unknown;
};

export interface TenantTeamMember {
  id?: string | number;
  user_id?: string;
  team_id?: string | number;
  [key: string]: unknown;
}

export interface TenantTeamMembersRequest {
  user_ids: string[];
}

export interface CreateTenantLabelRequest {
  [key: string]: unknown;
}

export type ListTenantInboxesResponse = ApiResponse<ChatwootJsonPayload>;
export type GetTenantInboxResponse = ApiResponse<ChatwootJsonPayload>;
export type CreateTenantInboxResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateTenantInboxResponse = ApiResponse<ChatwootJsonPayload>;

export interface AccountInboxMembersRequest {
  inbox_id: number;
  user_ids: string[];
}

export type CreateAccountInboxMembersResponse =
  ApiResponse<ChatwootJsonPayload>;
export type UpdateAccountInboxMembersResponse =
  ApiResponse<ChatwootJsonPayload>;

export type ListTenantTeamsResponse = ApiResponse<
  TenantTeam[] | ChatwootJsonPayload
>;
export type GetTenantTeamResponse = ApiResponse<
  TenantTeam | ChatwootJsonPayload
>;
export type CreateTenantTeamResponse = ApiResponse<
  TenantTeam | ChatwootJsonPayload
>;
export type UpdateTenantTeamResponse = ApiResponse<
  TenantTeam | ChatwootJsonPayload
>;
export type DeleteTenantTeamResponse = ApiResponse<void>;
export type ListTenantTeamMembersResponse = ApiResponse<
  TenantTeamMember[] | ChatwootJsonPayload
>;
export type AddTenantTeamMembersResponse = ApiResponse<
  TenantTeamMember[] | ChatwootJsonPayload
>;
export type RemoveTenantTeamMembersResponse = ApiResponse<void>;
export type UpdateTenantTeamMembersResponse = ApiResponse<
  TenantTeamMember[] | ChatwootJsonPayload
>;
export type ListTenantLabelsResponse = ApiResponse<ChatwootJsonPayload>;
export type CreateTenantLabelResponse = ApiResponse<ChatwootJsonPayload>;
export type DeleteTenantLabelResponse = ApiResponse<void>;

// —— Users + SSO ——

export interface CreateChatwootUserRequest {
  name: string;
  display_name: string;
  email?: string | null;
  password?: string | null;
  custom_attributes?: Record<string, unknown>;
}

export interface UpdateChatwootUserRequest {
  name?: string | null;
  display_name?: string;
  email?: string;
  password?: string;
  custom_attributes?: Record<string, unknown>;
}

export type GetChatwootUserSsoLinkResponse = ApiResponse<ChatwootJsonPayload>;
export type CreateChatwootUserResponse = ApiResponse<ChatwootJsonPayload>;
export type GetChatwootUserResponse = ApiResponse<ChatwootJsonPayload>;
export type UpdateChatwootUserResponse = ApiResponse<ChatwootJsonPayload>;
export type DeleteChatwootUserResponse = ApiResponse<void>;

// —— Bulk actions ——
export interface BulkActionRequest {
  type: string;
  ids: Array<string | number>;
  labels?: {
    add?: string[];
    remove?: string[];
  };
  fields?: {
    assignee_id?: string | number | null;
    status?: string;
    [key: string]: unknown;
  };
}
export type BulkActionResponse = ApiResponse<ChatwootJsonPayload>;

export interface ConversationFilter {
  attribute_key: string;
  filter_operator: string;
  values: Array<string | number>;

  attribute_model?: string;
  query_operator?: string;
  custom_attribute_type?: string;
}

export interface FilterConversationsRequest {
  payload: ConversationFilter[];
}

/** Contact / sender trong meta hoặc message của conversation */
export interface ChatwootContact {
  additional_attributes?: Record<string, unknown>;
  availability_status?: string;
  email?: string | null;
  id: number;
  name: string;
  phone_number?: string | null;
  blocked?: boolean;
  identifier?: string;
  thumbnail?: string;
  custom_attributes?: Record<string, unknown>;
  last_activity_at?: number;
  created_at?: number;
  /** Có trên `message.sender` */
  type?: string;
}

export interface ChatwootAssignee {
  id: string;
  availability_status?: string;
  auto_offline?: boolean;
  confirmed?: boolean;
  email?: string;
  provider?: string;
  available_name?: string;
  name: string;
  role?: string;
  thumbnail?: string;
  custom_role_id?: string | null;
}

export interface ChatwootConversationItemMeta {
  sender: ChatwootContact;
  channel?: string;
  assignee?: ChatwootAssignee;
  assignee_type?: string;
  hmac_verified?: boolean;
}

export interface ChatwootMessageConversationSnippet {
  assignee_id?: number;
  unread_count?: number;
  last_activity_at?: number;
  contact_inbox?: {
    source_id?: string;
  };
}

export interface ChatwootConversationMessage {
  id: number;
  content?: string | null;
  inbox_id?: number;
  conversation_id?: number;
  message_type?: number;
  created_at?: number;
  updated_at?: string;
  private?: boolean;
  status?: string;
  source_id?: string | null;
  content_type?: string;
  content_attributes?: Record<string, unknown>;
  sender_type?: string | null;
  sender_id?: number | null;
  external_source_ids?: Record<string, unknown>;
  additional_attributes?: Record<string, unknown>;
  processed_message_content?: string;
  sentiment?: Record<string, unknown>;
  conversation?: ChatwootMessageConversationSnippet;
  sender?: ChatwootContact;
}

/** Một conversation trong `data.messaging.payload` */
export interface FilteredTenantConversation {
  meta: ChatwootConversationItemMeta;
  id: number;
  messages?: ChatwootConversationMessage[];
  uuid: string;
  additional_attributes?: Record<string, unknown>;
  agent_last_seen_at?: number;
  assignee_last_seen_at?: number;
  can_reply?: boolean;
  contact_last_seen_at?: number;
  custom_attributes?: Record<string, unknown>;
  inbox_id?: number;
  labels?: string[];
  muted?: boolean;
  snoozed_until?: number | null;
  status: string;
  created_at?: number;
  updated_at?: number;
  timestamp?: number;
  first_reply_created_at?: number;
  unread_count?: number;
  last_non_activity_message?: ChatwootConversationMessage | null;
  last_activity_at?: number;
  priority?: string | null;
  waiting_since?: number;
  sla_policy_id?: number | null;
}

export interface FilterConversationsChatwootData {
  meta: TenantConversationsListMeta;
  payload: FilteredTenantConversation[];
}

/** Phần `data` trong `ApiResponse` của POST filter conversations */
export interface FilterConversationsData {
  tenant_id: string;
  messaging: FilterConversationsChatwootData;
  /** @deprecated legacy key — prefer `messaging` */
  chatwoot?: FilterConversationsChatwootData;
}

export type FilterConversationsResponse = ApiResponse<FilterConversationsData>;

// —— Account custom filters ——

export interface AccountCustomFilterQuery {
  payload: ConversationFilter[];
}

export interface CreateAccountCustomFilterRequest {
  name: string;
  filter_type: number | string;
  query: AccountCustomFilterQuery;
}

export interface AccountCustomFilter {
  id: number | string;
  name: string;
  filter_type: number | string;
  query: AccountCustomFilterQuery;
  account_id?: number;
  created_at?: string | number;
  updated_at?: string | number;
  [key: string]: unknown;
}

export interface ListAccountCustomFiltersData {
  tenant_id?: string;
  chatwoot_account_id?: number;
  custom_filters?: AccountCustomFilter[];
  payload?: AccountCustomFilter[];
  data?: {
    payload?: AccountCustomFilter[];
    custom_filters?: AccountCustomFilter[];
  };
  messaging?: {
    payload?: AccountCustomFilter[];
    custom_filters?: AccountCustomFilter[];
  };
  /** @deprecated legacy key — prefer `messaging` */
  chatwoot?: {
    payload?: AccountCustomFilter[];
    custom_filters?: AccountCustomFilter[];
  };
}

export type ListAccountCustomFiltersResponse = ApiResponse<
  ListAccountCustomFiltersData | AccountCustomFilter[]
>;
export type CreateAccountCustomFilterResponse = ApiResponse<
  AccountCustomFilter | ChatwootJsonPayload
>;

export type UpdateAccountCustomFilterRequest =
  Partial<CreateAccountCustomFilterRequest>;

export type UpdateAccountCustomFilterResponse = ApiResponse<
  AccountCustomFilter | ChatwootJsonPayload
>;

export type DeleteAccountCustomFilterResponse = ApiResponse<void>;
