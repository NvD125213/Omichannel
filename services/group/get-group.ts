import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface GroupResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    groups: {
      id: string;
      name: string;
      description: string;
      tenant_id: string;
      group_order: number;
      member_count: number;
    }[];
    total_pages: number;
    total_records: number;
  };
}

export interface GroupQueryParams {
  id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getGroupsApi(params: GroupQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<GroupResponseApi>("/groups", {
    params: queryParams,
  });
  return response.data;
}
