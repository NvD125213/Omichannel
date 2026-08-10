import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  callLogService,
  type CreateCallLogRequest,
  type GetCallLogEventsParams,
  type GetCallLogsParams,
  type UpdateCallLogRequest,
} from "@/services/call-logs/service";

const QUERY_KEY = "call-logs";
const EVENTS_QUERY_KEY = "call-log-events";

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

export const useGetCallLogEvents = (
  sipCallId: string,
  params?: GetCallLogEventsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: [EVENTS_QUERY_KEY, sipCallId, params],
    queryFn: () => callLogService.getCallLogEvents(sipCallId, params),
    enabled: enabled && !!sipCallId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCallLogEventById = (
  sipCallId: string,
  eventId: string,
  enabled = true,
) => {
  return useQuery({
    queryKey: [EVENTS_QUERY_KEY, sipCallId, eventId],
    queryFn: () => callLogService.getCallLogEventById(sipCallId, eventId),
    enabled: enabled && !!sipCallId && !!eventId,
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
        queryClient.invalidateQueries({
          queryKey: [EVENTS_QUERY_KEY, variables.sipCallId],
        });
      }
    },
  });
};
