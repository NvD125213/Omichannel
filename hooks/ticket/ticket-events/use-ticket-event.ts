import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicketEventApi,
  deleteTicketEventApi,
  getTicketEventsApi,
  TicketEventParams,
  TicketEventRequest,
  updateTicketEventApi,
} from "@/services/ticket/ticket-events/services";
import { toast } from "sonner";

export const useGetTicketEvents = (params: TicketEventParams) => {
  return useQuery({
    queryKey: ["ticket-events", params],
    queryFn: () => getTicketEventsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketEventRequest) => createTicketEventApi(data),
    onSuccess: () => {
      toast.success("Tạo event thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo event",
      );
    },
  });
};

export const useUpdateTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketEventRequest>;
    }) => updateTicketEventApi(id, data),
    onSuccess: () => {
      toast.success("Cập nhật event thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật event",
      );
    },
  });
};

export const useDeleteTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicketEventApi(id),
    onSuccess: () => {
      toast.success("Xóa event thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa event",
      );
    },
  });
};
