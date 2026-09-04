import apiClient from "@/lib/api-client";

type JsonRecord = Record<string, unknown>;

export interface ConversationRatingApiResponse<T = JsonRecord | null> {
  status: string | number;
  status_code?: number;
  message: string;
  data: T;
}

/** POST /conversation-ratings/tenants/:tenant_id/conversations/:conversation_id/send */
export interface SendConversationRatingRequest {
  force_resend?: boolean;
}

export interface SendConversationRatingData {
  token?: string;
  rating_url?: string;
  expires_at?: string | null;
  already_sent?: boolean;
  [key: string]: unknown;
}

export type SendConversationRatingResponse =
  ConversationRatingApiResponse<SendConversationRatingData | null>;

/** Query chung cho list/metrics CSAT tenant. */
export interface TenantRatingsFilterParams {
  since?: string;
  until?: string;
  status?: string;
  channel?: string;
  inbox_id?: number | string;
  agent_chatwoot_id?: number | string;
  page?: number;
  page_size?: number;
}

export type TenantRatingsMetricsParams = Omit<
  TenantRatingsFilterParams,
  "status" | "page" | "page_size"
>;

export type ListTenantRatingsParams = Pick<
  TenantRatingsFilterParams,
  "page" | "page_size" | "status" | "channel" | "inbox_id"
>;

export type ListTenantRatingResponsesParams = TenantRatingsFilterParams;

function buildQuery(
  params?: Record<string, string | number | undefined | null>,
) {
  if (!params) return undefined;
  const query: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const raw = String(value).trim();
    if (!raw || raw === "string") continue;
    query[key] = typeof value === "number" ? value : raw;
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

/**
 * Chủ động gửi link CSAT — chỉ nhân viên đang được gán conversation
 * (hoặc platform admin). Cần quyền xem conversation.
 */
export async function sendConversationRatingApi(
  tenantId: string,
  conversationId: string | number,
  data: SendConversationRatingRequest = { force_resend: false },
) {
  const response = await apiClient.post<SendConversationRatingResponse>(
    `/conversation-ratings/tenants/${encodeURIComponent(tenantId)}/conversations/${encodeURIComponent(String(conversationId))}/send`,
    data,
  );
  return response.data;
}

/** GET /api/v1/conversation-ratings/tenants/:tenant_id/metrics */
export async function getTenantRatingsMetricsApi(
  tenantId: string,
  params?: TenantRatingsMetricsParams,
) {
  const response = await apiClient.get<
    ConversationRatingApiResponse<JsonRecord | null>
  >(`/conversation-ratings/tenants/${encodeURIComponent(tenantId)}/metrics`, {
    params: buildQuery(params),
  });
  return response.data;
}

/** GET /api/v1/conversation-ratings/tenants/:tenant_id/responses */
export async function listTenantRatingResponsesApi(
  tenantId: string,
  params?: ListTenantRatingResponsesParams,
) {
  const response = await apiClient.get<
    ConversationRatingApiResponse<JsonRecord | null>
  >(`/conversation-ratings/tenants/${encodeURIComponent(tenantId)}/responses`, {
    params: buildQuery(
      params as Record<string, string | number | null | undefined>,
    ),
  });
  return response.data;
}

/** GET /api/v1/conversation-ratings/tenants/:tenant_id */
export async function listTenantRatingsApi(
  tenantId: string,
  params?: ListTenantRatingsParams,
) {
  const response = await apiClient.get<
    ConversationRatingApiResponse<JsonRecord | null>
  >(`/conversation-ratings/tenants/${encodeURIComponent(tenantId)}`, {
    params: buildQuery(params),
  });
  return response.data;
}
