import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlowApi,
  CreateFlowRequest,
  deleteFlowApi,
  FlowParams,
  getFlowsApi,
  updateFlowApi,
  UpdateFlowRequest,
} from "@/services/ticket/ticket-flows/ticket-flow/services";
import { toast } from "sonner";

export const useGetTicketFlows = (
  params: FlowParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["ticket-flows", params],
    queryFn: () => getFlowsApi(params),
    placeholderData: (previousData) => previousData,
    enabled: options?.enabled,
  });
};

export const useCreateTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowRequest) => createFlowApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
      if (response.data.status_code == 201) {
        toast.success(response.data.message || "Tạo luồng xử lý thành công");
      } else {
        toast.error(response.data.message || "Có lỗi khi tạo luồng xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi tạo luồng xử lý",
      );
    },
  });
};

export const useUpdateTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlowRequest }) =>
      updateFlowApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
      if (response.data.status_code == 200) {
        toast.success(
          response.data.message || "Cập nhật luồng xử lý thành công",
        );
      } else {
        toast.error(response.data.message || "Có lỗi khi cập nhật luồng xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật luồng xử lý",
      );
    },
  });
};

export const useDeleteTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
      if (response.data.status_code == 200) {
        toast.success(response.data.message || "Xóa luồng xử lý thành công");
      } else {
        toast.error(response.data.message || "Có lỗi khi xóa luồng xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa luồng xử lý",
      );
    },
  });
};
