import apiClient from "@/lib/api-client";

export interface TicketExtension {
  id: string;
  ticket_id: string;
  data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TicketExtensionRequest {
  ticket_id: string;
  data: Record<string, any>;
}

export interface GetTicketExtensionsResponse {
  status: string;
  status_code: number;
  message: string;
  data: Record<string, any>;
}

export interface CreateTicketExtensionResponse {
  status: string;
  status_code: number;
  message: string;
  data: Record<string, any>;
}

export interface UpdateTicketExtensionResponse {
  status: string;
  status_code: number;
  message: string;
  data: Record<string, any>;
}

export interface DeleteTicketExtensionResponse {
  status: string;
  status_code: number;
  message: string;
}

export interface TicketExtensionParams {
  id?: string;
  ticket_id?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: string;
}

export const getTicketExtensionsApi = (params: TicketExtensionParams) => {
  return apiClient.get<GetTicketExtensionsResponse>("/ticket-extensions", {
    params,
  });
};

export const createTicketExtensionApi = (data: TicketExtensionRequest) => {
  return apiClient.post<CreateTicketExtensionResponse>(
    "/ticket-extensions",
    data,
  );
};

export const updateTicketExtensionApi = (
  id: string,
  data: Partial<TicketExtensionRequest>,
) => {
  return apiClient.patch<UpdateTicketExtensionResponse>(
    `/ticket-extensions/${id}`,
    data,
  );
};

export const deleteTicketExtensionApi = (id: string) => {
  return apiClient.delete<DeleteTicketExtensionResponse>(
    `/ticket-extensions/${id}`,
  );
};
