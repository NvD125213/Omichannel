import apiClient from "@/lib/api-client";

export interface GetTagsParams {
  page?: number;
  page_size?: number;
  is_active?: number;
  id?: string;
  search?: string;
  sort_by?: string;
  sort?: string;
}

export interface TicketTag {
  id: string;
  name: string;
  color: string;
  description: string;
}

export interface CreateTagRequest {
  name: string;
  color: string;
  description: string;
}

// Update tag - same as CreateTagRequest
export type UpdateTagRequest = CreateTagRequest;

export interface GetTagsResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    tags: TicketTag[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

export interface GetTagsStatisticsSummaryResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    total_tags: number;
    active_tags: number;
    inactive_tags: number;
    top_used_tags: [
      {
        id: string;
        name: string;
        color: string;
        usage_count: number;
      },
    ];
  };
}

export const getTagsApi = async (params: GetTagsParams) => {
  const response = await apiClient.get<GetTagsResponse>("/tags", { params });
  return response.data;
};

export const createTagApi = async (data: CreateTagRequest) => {
  const response = await apiClient.post(`/tags`, data);
  return response.data;
};

export const updateTagApi = async (id: string, data: UpdateTagRequest) => {
  const response = await apiClient.put(`/tags/${id}`, data);
  return response.data;
};

export const deleteTagApi = async (id: string) => {
  const response = await apiClient.delete(`/tags/${id}`);
  return response.data;
};

export const getTagsStatisticsSummaryApi = async () => {
  const response = await apiClient.get<GetTagsStatisticsSummaryResponse>(
    "/tags/statistics/summary",
  );
  return response.data;
};
