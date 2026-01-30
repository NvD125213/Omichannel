import apiClient from "@/lib/api-client";

export interface TicketEvent {
  id: string;
  ticket_id: string;
  event_type: string;
  payload: any;
  actor_type: string;
  actor_username: string;
  actor_id: string;
  created_at: string;
  tenant_id: string;
}

export interface TicketEventRequest {
  ticket_id: string;
  event_type: string;
  payload: any;

  actor_type: string;
  actor_id: string;
  tenant_id: string;
}

export interface GetTicketEventsResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    ticket_events: TicketEvent[];
    pagination: {
      current_page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
    };
  };
}

export interface CreateTicketEventResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketEvent;
}

export interface UpdateTicketEventResponse {
  status: string;
  status_code: number;
  message: string;
  data: TicketEvent;
}

export interface DeleteTicketEventResponse {
  status: string;
  status_code: number;
  message: string;
}

export interface TicketEventParams {
  id?: string;
  ticket_id?: string;
  event_type?: string;
  actor_type?: string;
  actor_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
  tenant_id?: string;
  from_date?: string;
  to_date?: string;
}

export const getTicketEventsApi = (params: TicketEventParams) => {
  return apiClient.get<GetTicketEventsResponse>("/ticket-events", { params });
};

export const createTicketEventApi = (data: TicketEventRequest) => {
  return apiClient.post<CreateTicketEventResponse>("/ticket-events", data);
};

export const updateTicketEventApi = (
  id: string,
  data: Partial<TicketEventRequest>,
) => {
  return apiClient.put<UpdateTicketEventResponse>(`/ticket-events/${id}`, data);
};

export const deleteTicketEventApi = (id: string) => {
  return apiClient.delete<DeleteTicketEventResponse>(`/ticket-events/${id}`);
};
