import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createFlowStepApi,
  CreateFlowStepRequest,
  deleteFlowStepApi,
  FlowStepParams,
  getFlowStepsApi,
  updateFlowStepApi,
  UpdateFlowStepRequest,
} from "@/services/ticket/ticket-flows/ticket-flow-step/services";
import { toast } from "sonner";

export const useGetTicketFlowStepsInfinite = (params: FlowStepParams) => {
  return useInfiniteQuery({
    // Bỏ page khỏi queryKey để tránh reset cache khi fetchNextPage
    queryKey: ["ticket-flow-steps", { ...params, page: undefined }],

    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const response = await getFlowStepsApi({
        ...params,
        page: pageParam,
      });
      return response;
    },

    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.data.data.pagination;

      return current_page < total_pages ? current_page + 1 : undefined;
    },

    placeholderData: (previousData) => previousData,

    // Chỉ gọi khi đã có flow_id
    enabled: !!params.flow_id,
  });
};

export const useGetTicketFlowSteps = (params: FlowStepParams) => {
  return useQuery({
    queryKey: ["ticket-flow-steps", params],
    queryFn: () => getFlowStepsApi(params),
    placeholderData: (previousData) => previousData,
    enabled: !!params.flow_id,
  });
};

export const useCreateTicketFlowSteps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (steps: Array<CreateFlowStepRequest>) => {
      const results = [];
      for (const step of steps) {
        const result = await createFlowStepApi(step);
        results.push(result);
      }
      // Return last result or a summary
      return results[results.length - 1];
    },
    onSuccess: (response) => {
      // Invalidate both ticket-flow-steps and ticket-flows to update counts
      queryClient.invalidateQueries({
        queryKey: ["ticket-flow-steps"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket-flows"],
      });
      if (response?.data.status_code == 201) {
        toast.success(response.data.message || "Tạo bước xử lý thành công");
      } else {
        toast.error(response?.data.message || "Có lỗi khi tạo bước xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi tạo bước xử lý",
      );
    },
  });
};

export const useUpdateTicketFlowStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlowStepRequest }) =>
      updateFlowStepApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
      if (response?.data.status_code == 200) {
        toast.success(
          response.data.message || "Cập nhật bước xử lý thành công",
        );
      } else {
        toast.error(response?.data.message || "Có lỗi khi cập nhật bước xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật bước xử lý",
      );
    },
  });
};

export const useDeleteTicketFlowStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowStepApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
      if (response?.data.status_code == 200) {
        toast.success(response.data.message || "Xóa bước xử lý thành công");
      } else {
        toast.error(response?.data.message || "Có lỗi khi xóa bước xử lý");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa bước xử lý",
      );
    },
  });
};
