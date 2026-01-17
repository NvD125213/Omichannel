import apiClient from "@/lib/api-client";

export interface TicketContext {
  id: string;
  ticket_id: string;
  context_type: string;
  context_id: string;
  source_type: string;
  context_metadata: string;
  created_at: string;
  tenant_id: string;
}

export interface TicketContextRequest {
  ticket_id: string;
  context_type: string;
  context_id: string;
  source_type: string;
  context_metadata: string;
  tenant_id: string;
}

export interface GetTicketContextsResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    items: TicketContext[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface CreateTicketContextResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketContext;
}

export interface UpdateTicketContextResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketContext;
}

export interface DeleteTicketContextResponse {
  status: string;
  status_code: number;
  message: string;
}

export interface TicketContextParams {
  id?: string;
  ticket_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export const getTicketContextsApi = (params: TicketContextParams) => {
  return apiClient.get<GetTicketContextsResponse>("/ticket-contexts", {
    params,
  });
};

export const createTicketContextApi = (data: TicketContextRequest) => {
  return apiClient.post<CreateTicketContextResponse>("/ticket-contexts", data);
};

export const updateTicketContextApi = (
  id: string,
  data: Partial<TicketContextRequest>,
) => {
  return apiClient.put<UpdateTicketContextResponse>(
    `/ticket-contexts/${id}`,
    data,
  );
};

export const deleteTicketContextApi = (id: string) => {
  return apiClient.delete<DeleteTicketContextResponse>(
    `/ticket-contexts/${id}`,
  );
};
