import apiClient from "@/lib/api-client";

/* =======================
 * Types
 * ======================= */

export interface Sla {
  id: string;
  name: string;
  description?: string;
  response_time: number; // in minutes
  resolution_time: number; // in minutes
  priority: string;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface GetSlasParams {
  id?: string;
  name?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface GetSlasResponse {
  data: {
    slas: Sla[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

export interface CreateSlaRequest {
  name: string;
  description?: string;
  response_time: number;
  resolution_time: number;
  priority: string;
  is_active: boolean;
}

export type UpdateSlaRequest = Partial<CreateSlaRequest>;

export interface ActionResponse {
  status: string;
  status_code: number;
  message: string;
}

/* =======================
 * APIs
 * ======================= */

export const getSlas = async (
  params?: GetSlasParams,
): Promise<GetSlasResponse> => {
  const res = await apiClient.get("/slas", { params });
  return res.data;
};

export const getSlaById = async (id: string): Promise<Sla> => {
  const res = await apiClient.get(`/slas/${id}`);
  return res.data;
};

export const createSlaApi = async (
  payload: CreateSlaRequest,
): Promise<ActionResponse> => {
  const res = await apiClient.post("/slas", payload);
  return res.data;
};

export const updateSlaApi = async (
  id: string,
  payload: UpdateSlaRequest,
): Promise<ActionResponse> => {
  const res = await apiClient.put(`/slas/${id}`, payload);
  return res.data;
};

export const deleteSlaApi = async (id: string): Promise<ActionResponse> => {
  const res = await apiClient.delete(`/slas/${id}`);
  return res.data;
};
