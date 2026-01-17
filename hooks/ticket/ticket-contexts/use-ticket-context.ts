import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicketContextApi,
  deleteTicketContextApi,
  getTicketContextsApi,
  TicketContextParams,
  TicketContextRequest,
  updateTicketContextApi,
} from "@/services/ticket/ticket-contexts/services";
import { toast } from "sonner";

export const useGetTicketContexts = (params: TicketContextParams) => {
  return useQuery({
    queryKey: ["ticket-contexts", params],
    queryFn: () => getTicketContextsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketContextRequest) => createTicketContextApi(data),
    onSuccess: () => {
      toast.success("Tạo context thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo context",
      );
    },
  });
};

export const useUpdateTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketContextRequest>;
    }) => updateTicketContextApi(id, data),
    onSuccess: () => {
      toast.success("Cập nhật context thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật context",
      );
    },
  });
};

export const useDeleteTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicketContextApi(id),
    onSuccess: () => {
      toast.success("Xóa context thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa context",
      );
    },
  });
};
