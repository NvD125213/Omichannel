import apiClient from "@/lib/api-client";

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

export interface SendConversationRatingResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: SendConversationRatingData | null;
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
