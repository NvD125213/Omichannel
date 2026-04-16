import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchUserProfileApi,
  updateUserProfileApi,
  type UpdateProfileRequest,
} from "@/services/chatwoots/api/profile/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const profileKey = ["chatwoot", "profile"] as const;

export const useChatwootProfile = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: profileKey,
    queryFn: () => fetchUserProfileApi(),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

export const useChatwootProfileUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateUserProfileApi(data),
    onSuccess: () => {
      toast.success("Cập nhật hồ sơ thành công");
      queryClient.invalidateQueries({ queryKey: profileKey });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật hồ sơ"),
  });
};
