import apiClient from "@/lib/api-client";

export interface FlowInfo {
  id: string;
  name: string;
  description: string;
}

export interface AssigneeUser {
  id: string;
  username: string;
  fullname: string;
}

export interface AssigneeGroup {
  id: string;
  name: string;
  description: string;
}

// Interface instance
export interface TicketFlowStep {
  id: string;
  flow_id: string;
  step_name: string;
  step_order: number;
  assignee_user_id: string | null;
  assignee_group_id: string | null;
  created_at: string;
  flow: FlowInfo;
  assignee_user?: AssigneeUser | null;
  assignee_group?: AssigneeGroup | null;
}

// Interface Request/Response
// Get flow step
export interface GetFlowStepResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    steps: TicketFlowStep[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

// Create flow step
export interface CreateFlowStepRequest {
  flow_id: string;
  step_name: string;
  step_order: number;
  assignee_user_id?: string;
  assignee_group_id?: string;
}

export interface CreateFlowStepResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlowStep;
}

// Update flow step - same as CreateFlowStepRequest
export type UpdateFlowStepRequest = CreateFlowStepRequest;

export interface UpdateFlowStepResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketFlowStep;
}

// Delete flow step
export interface DeleteFlowStepResponse {
  status: string;
  status_code: number;
  message: string;
}

// Interface query/params
export interface FlowStepParams {
  id?: string;
  flow_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

// Service
export const getFlowStepsApi = (params: FlowStepParams) => {
  return apiClient.get<GetFlowStepResponse>("/ticket-flow-steps", { params });
};

export const createFlowStepApi = (data: CreateFlowStepRequest) => {
  return apiClient.post<CreateFlowStepResponse>("/ticket-flow-steps", data);
};

export const updateFlowStepApi = (id: string, data: UpdateFlowStepRequest) => {
  return apiClient.put<UpdateFlowStepResponse>(
    `/ticket-flow-steps/${id}`,
    data,
  );
};

export const deleteFlowStepApi = (id: string) => {
  return apiClient.delete<DeleteFlowStepResponse>(`/ticket-flow-steps/${id}`);
};
