import {
  createDepartmentApi,
  updateDepartmentApi,
  deleteDepartmentApi,
} from "@/services/department/action-deparment";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartmentApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo phòng ban thành công!",
        "Có lỗi xảy ra khi tạo phòng ban",
      );

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi tạo Department:", error);
      toast.error(error.message || "Có lỗi xảy ra khi tạo phòng ban");
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDepartmentApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật phòng ban thành công",
        "Có lỗi xảy ra khi cập nhật phòng ban",
      );

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi cập nhật phòng ban",
      );
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDepartmentApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa phòng ban thành công",
        "Có lỗi xảy ra khi xóa phòng ban",
      );

      queryClient.invalidateQueries({
        queryKey: ["departments"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Có lỗi khi xóa phòng ban",
      );
    },
  });
}
