import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createUserApi,
  updateUserApi,
  deleteUserApi,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/services/user/action-user";
import type { UserFormValues } from "@/features/users/utils/schema";
import { toastApiMutation } from "@/lib/toast-api-mutation";

function toCreateUserPayload(data: UserFormValues): CreateUserPayload {
  const { id: _id, is_active: _isActive, ...payload } = data;
  return payload;
}

function toUpdateUserPayload(data: UserFormValues): UpdateUserPayload {
  const { id: _id, password, ...rest } = data;
  return {
    ...rest,
    ...(password ? { password } : {}),
  };
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserFormValues) =>
      createUserApi(toCreateUserPayload(data)),
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo người dùng thành công!",
        "Có lỗi xảy ra khi tạo người dùng",
      );

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
    mutationFn: (data: UserFormValues) => {
      if (!data.id) {
        throw new Error("Thiếu id người dùng");
      }
      return updateUserApi(data.id, toUpdateUserPayload(data));
    },
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật người dùng thành công",
        "Có lỗi xảy ra khi cập nhật người dùng",
      );

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
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa người dùng thành công",
        "Có lỗi xảy ra khi xóa người dùng",
      );

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
