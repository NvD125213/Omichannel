import {
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from "@/services/role/action-role";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoleApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo vai trò thành công!",
        "Có lỗi xảy ra khi tạo vai trò",
      );

      queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo Role:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo vai trò");
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRoleApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật vai trò thành công",
        "Có lỗi xảy ra khi cập nhật vai trò",
      );

      queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật vai trò",
      );
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoleApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa vai trò thành công",
        "Có lỗi xảy ra khi xóa vai trò",
      );

      queryClient.invalidateQueries({
        queryKey: ["roles"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa vai trò",
      );
    },
  });
}
