import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import {
  createTagApi,
  deleteTagApi,
  getTagsApi,
  getTagsStatisticsSummaryApi,
  updateTagApi,
  CreateTagRequest,
  GetTagsParams,
  GetTagsResponse,
  GetTagsStatisticsSummaryResponse,
  UpdateTagRequest,
} from "@/services/ticket/ticket-tags/services";

export const useGetTags = (params?: GetTagsParams) => {
  return useQuery<GetTagsResponse>({
    queryKey: ["tags", params],
    queryFn: () => getTagsApi(params || {}),
  });
};

export const useGetTagsStatistics = () => {
  return useQuery<GetTagsStatisticsSummaryResponse>({
    queryKey: ["tags-statistics"],
    queryFn: () => getTagsStatisticsSummaryApi(),
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTagApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo tag thành công",
        "Có lỗi xảy ra khi tạo tag",
      );
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags-statistics"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo tag",
      );
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTagRequest }) =>
      updateTagApi(id, payload),
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật tag thành công",
        "Có lỗi xảy ra khi cập nhật tag",
      );
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags-statistics"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật tag",
      );
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTagApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa tag thành công",
        "Có lỗi xảy ra khi xóa tag",
      );
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["tags-statistics"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa tag",
      );
    },
  });
};
