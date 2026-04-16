import { chatwoot_api_client } from "@/lib/chatwoot-api-client";
import { cleanParams } from "@/utils/clean-params";

const client = chatwoot_api_client;

export interface ChatwootErrorBody {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface Conversation {
  id: number;
  account_id?: number;
  inbox_id?: number;
  status?: string;
  contact_id?: number;
  uuid?: string;
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ConversationsListMeta {
  mine_count?: number;
  assigned_count?: number;
  unassigned_count?: number;
  all_count?: number;
  [key: string]: unknown;
}

export interface ConversationsListResponse {
  meta?: ConversationsListMeta;
  data?: {
    payload?: Conversation[];
    [key: string]: unknown;
  };
  /** Một số phiên bản API trả payload ở root */
  payload?: Conversation[];
}

/**
 * Query cho GET /api/v1/accounts/{account_id}/conversations
 * @see https://developers.chatwoot.com/api-reference/conversations/conversations-list
 */
export interface ConversationListQueryParams {
  /** open | resolved | pending | snoozed | all */
  status?: string;
  /** me | unassigned | all | assigned */
  assignee_type?: string;
  /** me | mention | unattended (tuỳ backend map) */
  conversation_type?: string;
  page?: number;
  /** Sắp xếp (tuỳ phiên bản server, ví dụ last_activity_at_asc) */
  sort_by?: string;
  inbox_id?: number;
  team_id?: number;
  /** Lọc theo nhãn */
  labels?: string[];
  /** Tìm theo nội dung tin nhắn */
  q?: string;
  /** Một số bản cài hỗ trợ lọc theo custom filter đã lưu */
  custom_filter_id?: number;
}

/**
 * Body cho POST /api/v1/accounts/{account_id}/conversations/filter
 * Cấu trúc payload phụ thuộc rule filter trên server — giữ linh hoạt.
 */
export type ConversationsFilterBody = Record<string, unknown>;

export interface ToggleConversationStatusRequest {
  status: "open" | "resolved" | "pending" | "snoozed";
  /** Unix timestamp (giây) khi status = snoozed */
  snoozed_until?: number;
}

export interface ToggleConversationTypingRequest {
  typing_status: "on" | "off";
  is_private?: boolean;
}

export interface SetConversationLabelsRequest {
  labels: string[];
}

export interface ConversationLabelsResponse {
  payload?: string[];
  conversation_labels?: { payload?: string[] };
  [key: string]: unknown;
}

export interface CreateConversationRequest {
  source_id: string;
  inbox_id?: number;
  contact_id?: number;
  status?: string;
  message?: {
    content: string;
    message_type?: string;
    private?: boolean;
    content_type?: string;
    content_attributes?: Record<string, unknown>;
  };
  additional_attributes?: Record<string, unknown>;
  custom_attributes?: Record<string, unknown>;
}

export interface UpdateConversationRequest {
  status?: string;
  assignee_id?: number;
  team_id?: number;
  snoozed_until?: string;
  custom_attributes?: Record<string, unknown>;
}

export interface ConversationReportingEvent {
  id: number;
  name: string;
  value: number;
  value_in_business_hours: number;
  event_start_time: string;
  event_end_time: string;
  account_id: number;
  conversation_id: number;
  inbox_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export async function listConversationsApi(
  accountId: number,
  params?: ConversationListQueryParams,
) {
  const queryParams = cleanParams(params ?? {});
  const response = await client.get<ConversationsListResponse>(
    `/api/v1/accounts/${accountId}/conversations`,
    { params: queryParams },
  );
  return response.data;
}

/** Lọc nâng cao (POST) — dùng khi GET không đủ điều kiện */
export async function filterConversationsApi(
  accountId: number,
  body: ConversationsFilterBody,
  query?: { page?: number },
) {
  const queryParams = cleanParams(query ?? {});
  const response = await client.post<ConversationsListResponse>(
    `/api/v1/accounts/${accountId}/conversations/filter`,
    body,
    { params: queryParams },
  );
  return response.data;
}

export async function getConversationsMetaApi(
  accountId: number,
  params?: Record<string, unknown>,
) {
  const queryParams = cleanParams(params ?? {});
  const response = await client.get<unknown>(
    `/api/v1/accounts/${accountId}/conversations/meta`,
    { params: queryParams },
  );
  return response.data;
}

export async function createConversationApi(
  accountId: number,
  data: CreateConversationRequest,
) {
  const response = await client.post<Conversation>(
    `/api/v1/accounts/${accountId}/conversations`,
    data,
  );
  return response.data;
}

export async function getConversationApi(
  accountId: number,
  conversationId: number,
) {
  const response = await client.get<Conversation>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}`,
  );
  return response.data;
}

export async function updateConversationApi(
  accountId: number,
  conversationId: number,
  data: UpdateConversationRequest,
) {
  const response = await client.patch<Conversation>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}`,
    data,
  );
  return response.data;
}

/** POST .../conversations/{id}/toggle_status */
export async function toggleConversationStatusApi(
  accountId: number,
  conversationId: number,
  data: ToggleConversationStatusRequest,
) {
  const response = await client.post<Conversation>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_status`,
    data,
  );
  return response.data;
}

/** POST .../conversations/{id}/toggle_typing_status */
export async function toggleConversationTypingStatusApi(
  accountId: number,
  conversationId: number,
  data: ToggleConversationTypingRequest,
) {
  const response = await client.post<unknown>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/toggle_typing_status`,
    data,
  );
  return response.data;
}

/** GET .../conversations/{id}/labels */
export async function getConversationLabelsApi(
  accountId: number,
  conversationId: number,
) {
  const response = await client.get<ConversationLabelsResponse>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`,
  );
  return response.data;
}

/**
 * POST .../conversations/{id}/labels — ghi đè danh sách label của hội thoại
 */
export async function setConversationLabelsApi(
  accountId: number,
  conversationId: number,
  data: SetConversationLabelsRequest,
) {
  const response = await client.post<ConversationLabelsResponse>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/labels`,
    data,
  );
  return response.data;
}

/**
 * GET .../conversations/{id}/reporting_events — lấy danh sách sự kiện báo cáo của hội thoại
 */
export async function getConversationReportingEventsApi(
  accountId: number,
  conversationId: number,
) {
  const response = await client.get<ConversationReportingEvent[]>(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/reporting_events`,
  );
  return response.data;
}
