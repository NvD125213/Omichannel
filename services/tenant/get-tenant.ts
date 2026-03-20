import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface TenantListItem {
  id: string;
  name: string;
  description: string;
  is_active: number;
}

export interface Tenant {
  id: string;
  name: string;
  description: string;
  is_active: number;
}

export interface TenantResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    items: TenantListItem[];
  };
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
}

export async function getTenantsApi(params: TenantQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<TenantResponseApi>("/tenants", {
    params: queryParams,
  });
  return response.data;
}

export interface CreateTenantRequest {
  name: string;
  description?: string;
  is_active?: number;
}

export interface UpdateTenantRequest {
  name?: string;
  description?: string;
  is_active?: number;
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
