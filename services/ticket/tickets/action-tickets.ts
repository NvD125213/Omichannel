import apiClient from "@/lib/api-client";

export interface ActionTicketRequest {
  assigned_to: string;
  description: string;
  extension_data: {
    customer_name: string;
    phone: string;
  };
  priority: string;
  tag_ids: string[];
  template_id: string;
  title: string;
}

export interface ActionTicketResponse {
  status: string;
  status_code: number;
  message: string;
  data: unknown;
}

// Assign ticket
export interface AssignTicketRequest {
  assigned_to: string;
}

export interface AssignTicketResponse {
  status: string;
  status_code: number;
  message: string;
  data: unknown;
}

export const createTicketApi = async (payload: ActionTicketRequest) => {
  const response = await apiClient.post<ActionTicketResponse>(
    "/tickets",
    payload,
  );
  return response.data;
};

export const updateTicketApi = async (
  id: string,
  payload: ActionTicketRequest,
) => {
  const response = await apiClient.put<ActionTicketResponse>(
    `/tickets/${id}`,
    payload,
  );
  return response.data;
};

export const deleteTicketApi = async (id: string) => {
  const response = await apiClient.delete<ActionTicketResponse>(
    `/tickets/${id}`,
  );
  return response.data;
};

export const assignTicketApi = async (
  ticket_id: string,
  payload: AssignTicketRequest,
) => {
  const response = await apiClient.post<AssignTicketResponse>(
    `tickets/${ticket_id}/assign`,
    payload,
  );
  return response.data;
};

export const statusTicketApi = async (ticket_id: string) => {
  const response = await apiClient.post<ActionTicketResponse>(
    `tickets/${ticket_id}/status`,
  );
  return response.data;
};
