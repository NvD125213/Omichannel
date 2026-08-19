import apiClient from "@/lib/api-client";

export interface UserWebcallConfig {
  webphone_enabled?: boolean;
  call_log_enabled?: boolean;
  call_recording_enabled?: boolean;
  enable_widget?: boolean;
  sip_only?: boolean;
  sip_extension?: string | null;
  sip_username?: string | null;
  sip_password?: string | null;
  sip_domain?: string | null;
  ws_server?: string | null;
  sip_port?: number | string | null;
  sip_protocol?: string | null;
  api_key?: string | null;
  domain_uuid?: string | null;
  hotlines?: unknown[];
  webphone_process_id?: string | null;
  webphone_agent_id?: string | null;
}

export interface UserCurrentData {
  id: string;
  username: string;
  email: string;
  fullname: string;
  is_active: number;
  role: string;
  level: string;
  tenant_id: string;
  graph_id: string;
  agent_id?: string | null;
  graph_activated: number;
  meta_data?: unknown;
  permissions: string[];
  is_platform_admin?: boolean;
  webcall?: UserWebcallConfig | null;
}

export interface UserCurrentResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: UserCurrentData;
}

export async function getCurrentUserApi() {
  const response = await apiClient.get<UserCurrentResponse>("/user/current");
  return response.data;
}
