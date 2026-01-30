import apiClient from "@/lib/api-client";

// Interface instance

export interface TicketFlowInstance {
  ticket_id: string;
  flow_id: string;
  current_step_id: string;
  status: string;
  tenant_id: string;
  started_at: string;
  finished_at: string;
}
// Interface Request/Response
// Get flow instance
export interface GetFlowInstanceResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    instances: TicketFlowInstance[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

// Create flow instance
export interface CreateFlowInstanceRequest {
  ticket_id: string;
  flow_id: string;
  current_step_id: string;
}

export interface CreateFlowInstanceResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlowInstance;
}

// Update flow instance
export interface UpdateFlowInstanceRequest extends Partial<CreateFlowInstanceRequest> {
  current_step_id?: string;
  status?: string;
}

export interface UpdateFlowInstanceResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlowInstance;
}

// Delete flow instance
export interface DeleteFlowInstanceResponse {
  status: string;
  status_code: number;
  message: string;
}

// Interface query/params
export interface FlowInstanceParams {
  id?: string;
  ticket_id?: string;
  flow_id?: string;
  current_step_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

// Service
export const getFlowInstancesApi = (params: FlowInstanceParams) => {
  return apiClient.get<GetFlowInstanceResponse>("/ticket-flow-instances", {
    params,
  });
};

export const createFlowInstanceApi = (data: CreateFlowInstanceRequest) => {
  return apiClient.post<CreateFlowInstanceResponse>(
    "/ticket-flow-instances",
    data,
  );
};

export const updateFlowInstanceApi = (
  id: string,
  data: UpdateFlowInstanceRequest,
) => {
  return apiClient.put<UpdateFlowInstanceResponse>(
    `/ticket-flow-instances/${id}`,
    data,
  );
};

export const deleteFlowInstanceApi = (id: string) => {
  return apiClient.delete<DeleteFlowInstanceResponse>(
    `/ticket-flow-instances/${id}`,
  );
};
