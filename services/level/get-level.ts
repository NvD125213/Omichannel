import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface LevelResponseApi {
  status: string;
  status_code: number;
  message: string;
  data: {
    levels: {
      id: string;
      name: string;
      description: string;
      level_order: number;
    }[];
    total_pages: number;
    total_records: number;
  };
}

export interface LevelQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getLevelsApi(params: LevelQueryParams) {
  const queryParams = cleanParams(params);
  const response = await apiClient.get<LevelResponseApi>("/levels", {
    params: queryParams,
  });
  return response.data;
}
