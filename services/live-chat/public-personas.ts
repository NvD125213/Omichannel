import apiClient from "@/lib/api-client";

type JsonRecord = Record<string, unknown>;

export interface LiveChatApiResponse<T = JsonRecord | null> {
  status: string | number;
  status_code?: number;
  message: string;
  data: T;
}

/** POST /public/live-chat/:website_token/personas/select */
export interface SelectLiveChatPersonaRequest {
  persona_id: string;
  client_session_id: string;
  meta?: Record<string, unknown>;
}

/** POST /public/live-chat/:website_token/contact */
export interface SubmitLiveChatContactRequest {
  client_session_id: string;
  name?: string;
  email?: string;
  phone?: string;
}

/** GET /api/v1/public/live-chat/:website_token/personas */
export async function getLiveChatPersonasApi(websiteToken: string) {
  const response = await apiClient.get<LiveChatApiResponse>(
    `/public/live-chat/${encodeURIComponent(websiteToken)}/personas`,
  );
  return response.data;
}

/**
 * POST /api/v1/public/live-chat/:website_token/personas/select
 * Chọn persona trước khi inject Chatwoot.
 */
export async function selectLiveChatPersonaApi(
  websiteToken: string,
  data: SelectLiveChatPersonaRequest,
) {
  const response = await apiClient.post<LiveChatApiResponse>(
    `/public/live-chat/${encodeURIComponent(websiteToken)}/personas/select`,
    data,
  );
  return response.data;
}

/**
 * POST /api/v1/public/live-chat/:website_token/contact
 * Lưu pending name/email/phone trước khi setUser + mở chat.
 */
export async function submitLiveChatContactApi(
  websiteToken: string,
  data: SubmitLiveChatContactRequest,
) {
  const response = await apiClient.post<LiveChatApiResponse>(
    `/public/live-chat/${encodeURIComponent(websiteToken)}/contact`,
    data,
  );
  return response.data;
}
