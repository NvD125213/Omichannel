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
  account_id: number;
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
  team_id?: number;
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
 * Phần `data` trong `ApiResponse` của GET `/chatwoot/tenants/:tenant_id/conversations`.
 * Có thể trả `payload` phẳng hoặc lồng qua `data` / `chatwoot.data`.
 */
export interface ListTenantConversationsData {
  payload?: unknown[];
  meta?: TenantConversationsListMeta;
  data?: {
    payload?: unknown[];
    meta?: TenantConversationsListMeta;
  };
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
