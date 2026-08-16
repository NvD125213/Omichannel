import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface TenantListItem {
  id: string;
  name: string;
  description: string;
  is_active: number;
  meta?: {
    chatbot_enabled?: boolean;
    default_responder?: "bot" | "agent";
    [key: string]: unknown;
  } | null;
  meta_data?: {
    chatbot_enabled?: boolean;
    default_responder?: "bot" | "agent";
    [key: string]: unknown;
  } | null;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  is_active: number;
  meta?: {
    chatbot_enabled?: boolean;
    default_responder?: "bot" | "agent";
    [key: string]: unknown;
  } | null;
  /** API find-by-id thường trả `meta_data` thay vì `meta` */
  meta_data?: {
    chatbot_enabled?: boolean;
    default_responder?: "bot" | "agent";
    [key: string]: unknown;
  } | null;
  graph_id?: string | null;
  agent_id?: string | null;
  graph_activated?: number | null;
  webcall_config?: Record<string, unknown> | null;
}

/** Response list: GET /tenants (không truyền id) */
export interface TenantListData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: TenantListItem[];
}

/**
 * GET /tenants?id=... → `data` là 1 tenant object
 * GET /tenants → `data` là pagination + items
 */
export type TenantQueryData = TenantListData | Tenant;

export interface TenantResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: TenantQueryData;
}

export interface TenantDetailResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: Tenant;
}

export interface TenantQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  id?: string;
  is_active?: number;
}

export function isTenantListData(
  data: TenantQueryData | undefined | null,
): data is TenantListData {
  return (
    !!data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as TenantListData).items)
  );
}

export function isTenantDetail(
  data: TenantQueryData | undefined | null,
): data is Tenant {
  return (
    !!data &&
    typeof data === "object" &&
    "id" in data &&
    "name" in data &&
    !("items" in data)
  );
}

/** Chuẩn hóa data từ useGetTenants về 1 tenant (khi gọi theo id hoặc lấy phần tử đầu). */
export function unwrapTenant(
  data: TenantQueryData | undefined | null,
): Tenant | undefined {
  if (!data) return undefined;
  if (isTenantDetail(data)) return data;
  if (isTenantListData(data)) {
    const first = data.items[0];
    return first as Tenant | undefined;
  }
  return undefined;
}

export async function getTenantsApi(params: TenantQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<TenantResponseApi>("/tenants", {
    params: queryParams,
  });
  return response.data;
}

/** GET /api/v1/tenants/:id — chi tiết tenant theo ID */
export async function getTenantByIdApi(id: string) {
  const response = await apiClient.get<TenantDetailResponseApi>(
    `/tenants/${encodeURIComponent(id)}`,
  );
  return response.data;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
  is_active?: number;
  meta?: {
    chatbot_enabled: boolean;
    default_responder: "bot" | "agent";
  };
  /** Một số BE nhận/lưu dưới tên `meta_data` */
  meta_data?: {
    chatbot_enabled: boolean;
    default_responder: "bot" | "agent";
  };
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  is_active?: number;
  meta?: {
    chatbot_enabled: boolean;
    default_responder: "bot" | "agent";
  };
  meta_data?: {
    chatbot_enabled: boolean;
    default_responder: "bot" | "agent";
  };
}

export async function createTenantApi(data: CreateTenantRequest) {
  const response = await apiClient.post<TenantDetailResponseApi>(
    "/tenants",
    data,
  );
  return response.data;
}

export async function updateTenantApi(id: string, data: UpdateTenantRequest) {
  const response = await apiClient.put<TenantDetailResponseApi>(
    `/tenants/${id}`,
    data,
  );
  return response.data;
}

export async function deleteTenantApi(id: string) {
  const response = await apiClient.delete<TenantDetailResponseApi>(
    `/tenants/${id}`,
  );
  return response.data;
}
