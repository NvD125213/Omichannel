import { useMutation } from "@tanstack/react-query";
import {
  assignRolePermissionApi,
  AssignRolePermissionResponseApi,
  unassignRolePermissionApi,
  UnassignRolePermissionResponseApi,
} from "@/services/permission/action-permission";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useAssignRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignRolePermissionApi,
    mutationKey: ["assign-role-permission"],
    onSuccess: (response) => {
      console.log("Phân quyền thành công:", response);
      toast.success(response.message || "Phân quyền thành công!");

      // Invalidate cache để fetch lại dữ liệu
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
      console.log("Gỡ quyền thành công:", response);
      toast.success(response.message || "Gỡ quyền thành công!");

      // Invalidate cache để fetch lại dữ liệu
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
