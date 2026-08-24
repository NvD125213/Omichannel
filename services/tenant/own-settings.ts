import apiClient from "@/lib/api-client";

export type TenantDefaultResponder = "bot" | "agent";

/** Cài đặt vận hành tenant hiện tại (CSAT, chatbot) — GET/PATCH /tenants/me/settings */
export interface OwnTenantSettings {
  conversation_rating_enabled?: boolean | null;
  chatbot_enabled?: boolean | null;
  default_responder?: TenantDefaultResponder | null;
}

export interface OwnTenantSettingsResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: OwnTenantSettings;
}

/** PATCH chỉ nhận 3 field này; field không gửi thì giữ nguyên. */
export interface UpdateOwnTenantSettingsRequest {
  conversation_rating_enabled?: boolean | null;
  chatbot_enabled?: boolean | null;
  default_responder?: TenantDefaultResponder | null;
}

/** GET /api/v1/tenants/me/settings — admin-partner */
export async function getOwnTenantSettingsApi() {
  const response = await apiClient.get<OwnTenantSettingsResponse>(
    "/tenants/me/settings",
  );
  return response.data;
}

/** PATCH /api/v1/tenants/me/settings */
export async function updateOwnTenantSettingsApi(
  data: UpdateOwnTenantSettingsRequest,
) {
  const response = await apiClient.patch<OwnTenantSettingsResponse>(
    "/tenants/me/settings",
    data,
  );
  return response.data;
}
