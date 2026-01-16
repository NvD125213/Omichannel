import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface RoleResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    roles: {
      id: string;
      name: string;
      description: string;
      tenant_id: string;
      role_order: number;
    }[];
    total_pages: number;
    total_records: number;
  };
}

export interface RoleQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getRolesApi(params: RoleQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<RoleResponseApi>("/roles", {
    params: queryParams,
  });
  return response.data;
}
