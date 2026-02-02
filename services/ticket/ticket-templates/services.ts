import apiClient from "@/lib/api-client";

/* =======================
 * Types
 * ======================= */

export interface TicketTemplate {
  id: string;
  name: string;
  description?: string;
  flow_id: string;
  sla_id?: string;
  extension_schema: Record<string, unknown>;
  is_active: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
  // Additional fields from join/API
  flow_name?: string;
  sla_name?: string;
}

export interface GetTicketTemplatesParams {
  id?: string;
  name?: string;
  is_active?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  tenant_id?: string;
}

export interface GetTicketTemplatesResponse {
  data: {
    templates: TicketTemplate[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

export interface CreateTicketTemplateRequest {
  name: string;
  description?: string;
  flow_id: string;
  sla_id?: string;
  extension_schema?: Record<string, unknown>;
  is_active: boolean;
  tenant_id?: string;
}

// Update template - partial of CreateTicketTemplateRequest
export type UpdateTicketTemplateRequest = Partial<CreateTicketTemplateRequest>;

export interface ActionResponse {
  status: string;
  status_code: number;
  message: string;
}
/* =======================
 * APIs
 * ======================= */

export const getTicketTemplates = async (
  params?: GetTicketTemplatesParams,
): Promise<GetTicketTemplatesResponse> => {
  const res = await apiClient.get("/ticket-templates", { params });
  return res.data;
};

export interface GetTicketTemplateByIdResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketTemplate;
}

export const getTicketTemplateById = async (
  id: string,
): Promise<GetTicketTemplateByIdResponse> => {
  const res = await apiClient.get(`/ticket-templates/${id}`);
  return res.data;
};

export const createTicketTemplateApi = async (
  payload: CreateTicketTemplateRequest,
): Promise<ActionResponse> => {
  const res = await apiClient.post("/ticket-templates", payload);
  return res.data;
};

export const updateTicketTemplateApi = async (
  id: string,
  payload: UpdateTicketTemplateRequest,
): Promise<ActionResponse> => {
  const res = await apiClient.put(`/ticket-templates/${id}`, payload);
  return res.data;
};

export const deleteTicketTemplateApi = async (
  id: string,
): Promise<ActionResponse> => {
  const res = await apiClient.delete(`/ticket-templates/${id}`);
  return res.data;
};

export const statusTicketTemplateApi = async (
  id: string,
): Promise<ActionResponse> => {
  const res = await apiClient.patch(`/ticket-templates/${id}/status`);
  return res.data;
};
