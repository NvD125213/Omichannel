import type { UserFormValues } from "@/features/users/utils/schema";
import apiClient from "@/lib/api-client";

/** Trường webcall tùy chọn — Postman Create/Update User */
export interface UserWebphonePayload {
  webphone_enabled?: boolean | null;
  sip_extension?: string | null;
  sip_username?: string | null;
  sip_password?: string | null;
  sip_domain?: string | null;
  sip_ws_server?: string | null;
  sip_port?: number | string | null;
  sip_protocol?: string | null;
  webphone_api_key?: string | null;
  webphone_process_id?: string | null;
  webphone_agent_id?: string | null;
  call_recording_enabled?: boolean | null;
  call_log_enabled?: boolean | null;
}

export interface CreateUserPayload extends UserWebphonePayload {
  username: string;
  email: string;
  password?: string;
  fullname?: string | null;
  chat_id?: number | null;
  role_id?: string | null;
  level_id?: string | null;
  tenant_id?: string | null;
  is_platform_admin?: boolean;
  meta_data?: Record<string, unknown> | null;
}

export interface UpdateUserPayload extends UserWebphonePayload {
  username?: string | null;
  email?: string | null;
  password?: string | null;
  fullname?: string | null;
  chat_id?: number | null;
  role_id?: string | null;
  level_id?: string | null;
  is_active?: number | null;
  tenant_id?: string | null;
  is_platform_admin?: boolean | null;
  meta_data?: Record<string, unknown> | null;
}

export interface CreateUserResponse {
  status: string;
  status_code: number;
  message: string;
  data: UserFormValues;
}

export interface UpdateUserResponse {
  status: string;
  status_code: number;
  message: string;
  data: UserFormValues;
}

export async function createUserApi(data: CreateUserPayload) {
  return await apiClient.post<CreateUserResponse>("/user", data);
}

export async function updateUserApi(userId: string, data: UpdateUserPayload) {
  return await apiClient.put<UpdateUserResponse>(`/user/${userId}`, data);
}

export async function deleteUserApi(id: string) {
  return await apiClient.delete(`/user/${id}`);
}
