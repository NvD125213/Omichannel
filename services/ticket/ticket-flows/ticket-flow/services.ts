import apiClient from "@/lib/api-client";

// Interface instance

export interface TicketFlow {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}
// Interface Request/Response
// Get flow
export interface GetFlowResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    flows: TicketFlow[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

// Create flow
export interface CreateFlowRequest {
  name: string;
  description: string;
  tenant_id: string;
}

export interface CreateFlowResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlow;
}

// Update flow - same as CreateFlowRequest
export type UpdateFlowRequest = CreateFlowRequest;

export interface UpdateFlowResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlow;
}

// Delete flow
export interface DeleteFlowResponse {
  status: string;
  status_code: number;
  message: string;
}

// Interface query/params
export interface FlowParams {
  id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

// Service
export const getFlowsApi = (params: FlowParams) => {
  return apiClient.get<GetFlowResponse>("/ticket-flows", { params });
};

export const createFlowApi = (data: CreateFlowRequest) => {
  return apiClient.post<CreateFlowResponse>("/ticket-flows", data);
};

export const updateFlowApi = (id: string, data: UpdateFlowRequest) => {
  return apiClient.put<UpdateFlowResponse>(`/ticket-flows/${id}`, data);
};

export const deleteFlowApi = (id: string) => {
  return apiClient.delete<DeleteFlowResponse>(`/ticket-flows/${id}`);
};
