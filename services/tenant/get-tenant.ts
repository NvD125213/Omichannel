import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface TenantResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    items: {
      name: string;
      description: string;
      id: string;
      is_active: number;
    }[];
  };
}

export interface TenantDetailResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    name: string;
    description: string;
    id: string;
    is_active: number;
  };
}

export interface TenantQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  id?: string;
}

export async function getTenantsApi(params: TenantQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<
    TenantResponseApi | TenantDetailResponseApi
  >("/tenants", {
    params: queryParams,
  });
  return response.data;
}
