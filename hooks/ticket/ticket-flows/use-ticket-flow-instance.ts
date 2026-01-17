import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlowInstanceApi,
  CreateFlowInstanceRequest,
  deleteFlowInstanceApi,
  FlowInstanceParams,
  getFlowInstancesApi,
  updateFlowInstanceApi,
  UpdateFlowInstanceRequest,
} from "@/services/ticket/ticket-flows/ticket-flow-instance/services";

export const useGetTicketFlowInstances = (params: FlowInstanceParams) => {
  return useQuery({
    queryKey: ["ticket-flow-instances", params],
    queryFn: () => getFlowInstancesApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketFlowInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowInstanceRequest) =>
      createFlowInstanceApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
    },
  });
};

export const useDeleteTicketFlowInstance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowInstanceApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-instances"] });
    },
  });
};
