import {
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "@/services/user/action-user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUserApi,
    onSuccess: (response) => {
      // response là AxiosResponse, data thật sự nằm trong response.data
      console.log("Tạo thành công user:", response.data);
      toast.success(response.data.message || "Tạo người dùng thành công!");

      // Invalidate cache để fetch lại dữ liệu
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo user:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo người dùng");
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserApi,
    onSuccess: (response) => {
      toast.success(response.data.message || "Cập nhật người dùng thành công");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật người dùng",
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUserApi,
    onSuccess: () => {
      toast.success("Xóa người dùng thành công");

      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa người dùng",
      );
    },
  });
}
