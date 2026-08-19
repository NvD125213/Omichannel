import {
  assignGroupUserApi,
  removeGroupUserApi,
} from "@/services/group/assign-group-user";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAssignGroupUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignGroupUserApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật thành viên thành công",
        "Có lỗi xảy ra khi cập nhật thành viên",
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
          "Có lỗi xảy ra khi cập nhật thành viên",
      );
    },
  });
};

export const useRemoveGroupUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeGroupUserApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật thành viên thành công",
        "Có lỗi xảy ra khi cập nhật thành viên",
      );

      queryClient.invalidateQueries({
        queryKey: ["groups"],
      });
      queryClient.invalidateQueries({
        queryKey: ["group-detail"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi xảy ra khi cập nhật thành viên",
      );
    },
  });
};
