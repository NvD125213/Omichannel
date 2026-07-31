import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  callLogService,
  type CreateCallLogRequest,
  type GetCallLogsParams,
  type UpdateCallLogRequest,
} from "@/services/call-logs/service";

const QUERY_KEY = "call-logs";

function getErrorMessage(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message || fallback
  );
}

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
        toast.success(res.message || "Tạo lịch sử cuộc gọi thành công");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi tạo lịch sử cuộc gọi");
      }
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(error, "Có lỗi xảy ra khi tạo lịch sử cuộc gọi"),
      );
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
        toast.success(res.message || "Cập nhật lịch sử cuộc gọi thành công");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY, variables.sipCallId],
        });
      } else {
        toast.error(
          res.message || "Có lỗi xảy ra khi cập nhật lịch sử cuộc gọi",
        );
      }
    },
    onError: (error: unknown) => {
      toast.error(
        getErrorMessage(error, "Có lỗi xảy ra khi cập nhật lịch sử cuộc gọi"),
      );
    },
  });
};
