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

export interface Account {
  id: number;
  name: string;
  status: string;
  active_at: string | null;
  role: string;
  permissions: string[];
  availability: string;
  availability_status: string;
  auto_offline: boolean;
  custom_role_id: number | null;
  custom_role: Record<string, unknown> | null;
}

export interface UserProfile {
  id: number;
  access_token?: string;
  account_id?: number;
  available_name?: string;
  avatar_url?: string;
  confirmed?: boolean;
  display_name?: string;
  message_signature?: string;
  email?: string;
  hmac_identifier?: string;
  inviter_id?: number;
  name?: string;
  provider?: string;
  pubsub_token?: string;
  role?: string;
  ui_settings?: Record<string, unknown>;
  uid?: string;
  type?: string;
  custom_attributes?: Record<string, unknown>;
  accounts?: Account[];
}

export interface UpdateProfileRequest {
  profile: {
    name?: string;
    email?: string;
    display_name?: string;
    message_signature?: string;
    phone_number?: string;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
    ui_settings?: Record<string, unknown>;
  };
}

export async function fetchUserProfileApi() {
  const response = await client.get<UserProfile>(`/api/v1/profile`);
  return response.data;
}

export async function updateUserProfileApi(data: UpdateProfileRequest) {
  const response = await client.put<UserProfile>(`/api/v1/profile`, data);
  return response.data;
}
