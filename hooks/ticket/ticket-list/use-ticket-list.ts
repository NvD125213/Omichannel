import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
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
import { ApiErrorParser } from "@/lib/api-error-special";

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
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo ticket thành công",
        "Có lỗi xảy ra khi tạo ticket",
      );
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
    onSuccess: (response, variables) => {
      toastApiMutation(
        response,
        "Cập nhật ticket thành công",
        "Có lỗi xảy ra khi cập nhật ticket",
      );
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["ticket", variables.id] });
    },
    onError: (error: any) => {
      console.log(error);

      const status = error?.response?.status;
      const data = error?.response?.data;

      // Xử lý riêng lỗi validate 422 (ví dụ: uuid_parsing cho assigned_to)
      if (status === 422 && data) {
        const parsedErrors = ApiErrorParser.parse(data);
        if (parsedErrors && parsedErrors.length > 0) {
          const fieldMap = ApiErrorParser.toFieldMap(parsedErrors);

          // Ưu tiên hiển thị dạng "field: message"
          let message = "";
          if (Object.keys(fieldMap).length > 0) {
            message = Object.entries(fieldMap)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join("\n");
          } else {
            message = parsedErrors.map((e) => e.message).join("\n");
          }

          toast.error(message || "Dữ liệu không hợp lệ (422)");
          return;
        }
      }

      // Fallback cho các lỗi khác
      toast.error(data?.message || "Có lỗi xảy ra khi cập nhật ticket");
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicketApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa ticket thành công",
        "Có lỗi xảy ra khi xóa ticket",
      );
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
    onSuccess: (response, variables) => {
      toastApiMutation(
        response,
        "Phân quyền ticket thành công",
        "Có lỗi xảy ra khi phân quyền ticket",
      );
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
    onSuccess: (response, id) => {
      toastApiMutation(
        response,
        "Cập nhật trạng thái ticket thành công",
        "Có lỗi xảy ra khi cập nhật trạng thái ticket",
      );
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
