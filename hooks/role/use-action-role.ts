import {
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
} from "@/services/role/action-role";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoleApi,
    onSuccess: (response) => {
      // response là AxiosResponse, data thật sự nằm trong response.data
      console.log("Tạo thành công Role:", response.data);
      toast.success(response.data.message || "Tạo vai trò thành công!");

      // Invalidate cache để fetch lại dữ liệu
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
      toast.success(response.data.message || "Cập nhật vai trò thành công");

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
    onSuccess: () => {
      toast.success("Xóa vai trò thành công");

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
