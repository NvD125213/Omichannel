import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  callLogService,
  type CreateCallLogRequest,
  type GetCallLogsParams,
  type UpdateCallLogRequest,
} from "@/services/call-logs/service";

const QUERY_KEY = "call-logs";

export const useGetCallLogs = (params?: GetCallLogsParams, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => callLogService.getCallLogs(params),
    enabled,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCallLogById = (sipCallId: string, enabled = true) => {
  return useQuery({
    queryKey: [QUERY_KEY, sipCallId],
    queryFn: () => callLogService.getCallLogById(sipCallId),
    enabled: enabled && !!sipCallId,
  });
};

export const useCreateCallLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCallLogRequest) =>
      callLogService.createCallLog(data),
    onSuccess: (res) => {
      if (res.status_code === 200 || res.status_code === 201) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      }
    },
  });
};

export const useUpdateCallLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sipCallId,
      data,
    }: {
      sipCallId: string;
      data: UpdateCallLogRequest;
    }) => callLogService.updateCallLog(sipCallId, data),
    onSuccess: (res, variables) => {
      if (res.status_code === 200) {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY, variables.sipCallId],
        });
      }
    },
  });
};
