import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFlowStepApi,
  CreateFlowStepRequest,
  deleteFlowStepApi,
  FlowStepParams,
  getFlowStepsApi,
  updateFlowStepApi,
  UpdateFlowStepRequest,
} from "@/services/ticket/ticket-flows/ticket-flow-step/services";

export const useGetTicketFlowSteps = (params: FlowStepParams) => {
  return useQuery({
    queryKey: ["ticket-flow-steps", params],
    queryFn: () => getFlowStepsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketFlowStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFlowStepRequest) => createFlowStepApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
    },
  });
};

export const useUpdateTicketFlowStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFlowStepRequest }) =>
      updateFlowStepApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
    },
  });
};

export const useDeleteTicketFlowStep = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFlowStepApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-flow-steps"] });
    },
  });
};
