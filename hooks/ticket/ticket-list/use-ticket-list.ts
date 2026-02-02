import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createTicketApi,
  updateTicketApi,
  deleteTicketApi,
  assignTicketApi,
  statusTicketApi,
  ActionTicketRequest,
  AssignTicketRequest,
} from "@/services/ticket/tickets/action-tickets";
import {
  getTickets,
  getTicketById,
  getTicketByCode,
  GetTicketsResponse,
  GetTicketByIdResponse,
  GetTicketByCodeResponse,
} from "@/services/ticket/tickets/get-tickets";

export const useGetTickets = (params?: any) => {
  return useQuery<GetTicketsResponse>({
    queryKey: ["tickets", params],
    queryFn: () => getTickets(params),
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

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicketApi,
    onSuccess: () => {
      toast.success("Tạo ticket thành công");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo ticket",
      );
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: ActionTicketRequest;
    }) => updateTicketApi(id, payload),
    onSuccess: (_, variables) => {
      if (_.status_code == 200) {
        toast.success("Cập nhật template ticket thành công");
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
        queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
      } else {
        toast.error("Lỗi: " + _.message);
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật ticket",
      );
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicketApi,
    onSuccess: () => {
      toast.success("Xóa ticket thành công");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa ticket",
      );
    },
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AssignTicketRequest;
    }) => assignTicketApi(id, payload),
    onSuccess: (_, variables) => {
      toast.success("Phân quyền ticket thành công");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi phân quyền ticket",
      );
    },
  });
};

export const useStatusTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: statusTicketApi,
    onSuccess: (_, id) => {
      toast.success("Cập nhật trạng thái ticket thành công");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật trạng thái ticket",
      );
    },
  });
};
