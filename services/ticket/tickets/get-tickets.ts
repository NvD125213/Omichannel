import apiClient from "@/lib/api-client";
import { TicketTag } from "../ticket-tags/services";

export interface Ticket {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  template_id: string;
  flow_id: string;
  sla_id: string;
  created_by: string;
  assigned_to: string;
  created_at: string;
  closed_at: string;
  template_name: string;
  flow_name: string;
  created_by_name: string;
  assigned_to_name: string;
  tags: TicketTag[];
  extension_data: any;
}

export interface GetTicketsResponse {
  status: string;
  status_code: number;
  message: string;
  data: {
    items: Ticket[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export interface GetTicketByIdResponse {
  status: string;
  status_code: number;
  message: string;
  data: Ticket;
}

export interface GetTicketByCodeResponse {
  status: string;
  status_code: number;
  message: string;
  data: Ticket;
}

// Lấy danh sách ticket
export const getTickets = async (params?: any) => {
  const response = await apiClient.get<GetTicketsResponse>("/tickets", {
    params,
    paramsSerializer: {
      indexes: null, // Serialize array as tag_ids=uuid1&tag_ids=uuid2 instead of tag_ids[]=uuid1&tag_ids[]=uuid2
    },
  });
  return response.data;
};

// Lấy ticket theo id
export const getTicketById = async (id: string) => {
  const response = await apiClient.get<GetTicketByIdResponse>(`/tickets/${id}`);
  return response.data;
};

// Lấy ticket theo code
export const getTicketByCode = async (code: string) => {
  const response = await apiClient.get<GetTicketByCodeResponse>(
    `/tickets/code/${code}`,
  );
  return response.data;
};
