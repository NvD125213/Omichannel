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

export const useGetTicketFlows = (params: FlowParams) => {
  return useQuery({
    queryKey: ["ticket-flows", params],
    queryFn: () => getFlowsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowRequest) => createFlowApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
    },
  });
};

export const useUpdateTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlowRequest }) =>
      updateFlowApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
    },
  });
};

export const useDeleteTicketFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flows"] });
    },
  });
};
