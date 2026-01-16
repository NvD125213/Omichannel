import {
  createGroupApi,
  updateGroupApi,
  deleteGroupApi,
} from "@/services/group/action-group";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroupApi,
    onSuccess: (response) => {
      console.log("Tạo thành công Group:", response.data);
      toast.success(response.data.message || "Tạo nhóm thành công!");

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
    onSuccess: (response: any) => {
      toast.success(response.data.message || "Cập nhật nhóm thành công");

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
    onSuccess: () => {
      toast.success("Xóa nhóm thành công");

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
