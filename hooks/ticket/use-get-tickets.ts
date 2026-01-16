import { useQuery } from "@tanstack/react-query";
import {
  getTickets,
  getTicketById,
  getTicketByCode,
  GetTicketsResponse,
  GetTicketByIdResponse,
  GetTicketByCodeResponse,
} from "@/services/ticket/tickets/get-tickets";

export const useGetTickets = () => {
  return useQuery<GetTicketsResponse>({
    queryKey: ["tickets"],
    queryFn: getTickets,
  });
};

export const useGetTicketById = (id: string) => {
  return useQuery<GetTicketByIdResponse>({
    queryKey: ["ticket", id],
    queryFn: () => getTicketById(id),
    enabled: !!id,
  });
};

export const useGetTicketByCode = (code: string) => {
  return useQuery<GetTicketByCodeResponse>({
    queryKey: ["ticket-code", code],
    queryFn: () => getTicketByCode(code),
    enabled: !!code,
  });
};
