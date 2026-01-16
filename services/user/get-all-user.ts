import apiClient from "@/lib/api-client";
import { cleanParams } from "@/utils/clean-params";

export interface GetAllUserQuery {
  id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface GetAllUserResponse {
  status: number;
  status_code: number;
  message: string;
  data: {
    items: {
      id: string;
      username: string;
      email: string;
      fullname: string;
      role: string;
      level: string;
      tenant_id: string;
      is_active: number;
      permissions: string[];
    }[];
    pagination: {
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    };
  };
}

export async function getAllUserApi(query: GetAllUserQuery) {
  try {
    const cleanedParams = cleanParams(query);

    const response = await apiClient.get<GetAllUserResponse>("/user/all", {
      params: cleanedParams,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
