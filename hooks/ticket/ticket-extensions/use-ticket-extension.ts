import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTicketExtensionApi,
  deleteTicketExtensionApi,
  getTicketExtensionsApi,
  TicketExtensionParams,
  TicketExtensionRequest,
  updateTicketExtensionApi,
} from "@/services/ticket/ticket-extensions/services";
import { toast } from "sonner";

export const useGetTicketExtensions = (params: TicketExtensionParams) => {
  return useQuery({
    queryKey: ["ticket-extensions", params],
    queryFn: () => getTicketExtensionsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketExtensionRequest) =>
      createTicketExtensionApi(data),
    onSuccess: () => {
      toast.success("Tạo extension thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-extensions"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo extension",
      );
    },
  });
};

export const useUpdateTicketExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketExtensionRequest>;
    }) => updateTicketExtensionApi(id, data),
    onSuccess: () => {
      toast.success("Cập nhật extension thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-extensions"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật extension",
      );
    },
  });
};

export const useDeleteTicketExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicketExtensionApi(id),
    onSuccess: () => {
      toast.success("Xóa extension thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-extensions"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa extension",
      );
    },
  });
};
