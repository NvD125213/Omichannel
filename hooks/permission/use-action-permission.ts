import { useMutation } from "@tanstack/react-query";
import {
  assignRolePermissionApi,
  unassignRolePermissionApi,
} from "@/services/permission/action-permission";
import { useQueryClient } from "@tanstack/react-query";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import { toast } from "sonner";

export const useAssignRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignRolePermissionApi,
    mutationKey: ["assign-role-permission"],
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Phân quyền thành công!",
        "Có lỗi xảy ra khi phân quyền",
      );

      queryClient.invalidateQueries({
        queryKey: ["permissions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["role-permissions"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi phân quyền:", error);
      toast.error(error.message || "Có lỗi xảy ra khi phân quyền");
    },
  });
};

export const useUnassignRolePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unassignRolePermissionApi,
    mutationKey: ["unassign-role-permission"],
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Gỡ quyền thành công!",
        "Có lỗi xảy ra khi gỡ quyền",
      );

      queryClient.invalidateQueries({
        queryKey: ["permissions"],
      });
    },
    onError: (error: Error) => {
      console.error("Lỗi khi gỡ quyền:", error);
      toast.error(error.message || "Có lỗi xảy ra khi gỡ quyền");
    },
  });
};
