import apiClient from "@/lib/api-client";

export interface TicketContext {
  id: string;
  ticket_id: string;
  context_type: string;
  context_id: string;
  source_type: string;
  context_metadata: Record<string, any> | null;
  created_at: string;
  tenant_id: string;
}

export interface TicketContextRequest {
  ticket_id: string;
  context_type: string;
  context_id: string;
  source_type: string;
  context_metadata: Record<string, any> | null;
  tenant_id: string;
}

export interface GetTicketContextsResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    contexts: TicketContext[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
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

export const getTicketContextWithTicketIdApi = (ticketId: string) => {
  return apiClient.get<GetTicketContextsResponse>(
    `ticket-contexts/ticket/${ticketId}/contexts`,
  );
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
