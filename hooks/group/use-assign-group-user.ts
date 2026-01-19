import {
  assignGroupUserApi,
  removeGroupUserApi,
} from "@/services/group/assign-group-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAssignGroupUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignGroupUserApi,
    onSuccess: (response: any) => {
      toast.success(response.data.message || "Cập nhật thành viên thành công");

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
    onSuccess: (response: any) => {
      toast.success(response.data.message || "Cập nhật thành viên thành công");

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
