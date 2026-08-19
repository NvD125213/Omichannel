import {
  createGroupApi,
  updateGroupApi,
  deleteGroupApi,
} from "@/services/group/action-group";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo nhóm thành công!",
        "Có lỗi xảy ra khi tạo nhóm",
      );

      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["department-detail"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo Group:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo nhóm");
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGroupApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật nhóm thành công",
        "Có lỗi xảy ra khi cập nhật nhóm",
      );

      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["department-detail"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật nhóm",
      );
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroupApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa nhóm thành công",
        "Có lỗi xảy ra khi xóa nhóm",
      );

      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["department-detail"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa nhóm",
      );
    },
  });
}
