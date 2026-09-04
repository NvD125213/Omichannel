import apiClient from "@/lib/api-client";

/** Mapping KG agent gắn với tenant (inbox / graph). */
export interface TenantKgAgentBinding {
  kg_agent_id: string;
  key?: string | null;
  graph_id?: string | null;
  inbox_id?: number | string | null;
  label?: string | null;
  is_default?: boolean | null;
  is_active?: boolean | null;
}

export interface TenantKgAgentsPayload {
  kg_agents: TenantKgAgentBinding[];
}

export interface TenantKgAgentsResponse {
  status: string | number;
  status_code?: number;
  message: string;
  data: TenantKgAgentBinding[] | TenantKgAgentsPayload | null;
}

/** PUT /tenants/:tenant_id/kg-agents — thay toàn bộ danh sách binding. */
export interface ReplaceTenantKgAgentsRequest {
  kg_agents: TenantKgAgentBinding[];
}

/** GET /api/v1/tenants/:tenant_id/kg-agents */
export async function listTenantKgAgentsApi(tenantId: string) {
  const response = await apiClient.get<TenantKgAgentsResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/kg-agents`,
  );
  return response.data;
}

/** PUT /api/v1/tenants/:tenant_id/kg-agents */
export async function replaceTenantKgAgentsApi(
  tenantId: string,
  data: ReplaceTenantKgAgentsRequest,
) {
  const response = await apiClient.put<TenantKgAgentsResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/kg-agents`,
    data,
  );
  return response.data;
}

/** Chuẩn hóa `data` response về mảng binding. */
export function unwrapTenantKgAgents(
  data: TenantKgAgentsResponse["data"],
): TenantKgAgentBinding[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.kg_agents)) return data.kg_agents;
  return [];
}
