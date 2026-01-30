import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import {
  createFlowInstanceApi,
  CreateFlowInstanceRequest,
  deleteFlowInstanceApi,
  FlowInstanceParams,
  getFlowInstancesApi,
  updateFlowInstanceApi,
  UpdateFlowInstanceRequest,
} from "@/services/ticket/ticket-flows/ticket-flow-instance/services";
import { toast } from "sonner";

export const useGetTicketFlowInstances = (params: FlowInstanceParams) => {
  return useInfiniteQuery({
    // Bỏ page khỏi queryKey để tránh reset cache khi load thêm
    queryKey: ["ticket-flow-instances", { ...params, page: undefined }],

    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const response = await getFlowInstancesApi({
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
  });
};

// Single instance query (non-infinite)
export const useGetTicketFlowInstance = (
  params: FlowInstanceParams,
  options?: Partial<UseQueryOptions<any, any, any>>,
) => {
  return useQuery({
    queryKey: ["ticket-flow-instance", params],
    queryFn: () => getFlowInstancesApi(params),
    ...options,
  });
};

export const useCreateTicketFlowInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowInstanceRequest) =>
      createFlowInstanceApi(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instance"] });
      if (response.data.status_code == 201) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateTicketFlowInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFlowInstanceRequest;
    }) => updateFlowInstanceApi(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instance"] });
      if (response.data.status_code == 200) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useDeleteTicketFlowInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowInstanceApi(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
      if (response.data.status_code == 200) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
