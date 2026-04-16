import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createAppAccountApi,
  getAppAccountApi,
  updateAppAccountApi,
  type CreateAppAccountRequest,
  type UpdateAppAccountRequest,
} from "@/services/chatwoots/api/accounts/account/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const accountKey = (accountId: number) =>
  ["chatwoot", "account", accountId, "app-account"] as const;

export const useChatwootAppAccount = (
  accountId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: accountKey(accountId),
    queryFn: () => getAppAccountApi(accountId),
    enabled: options?.enabled ?? !!accountId,
    staleTime: 60 * 1000,
  });
};

export const useChatwootAppAccountCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppAccountRequest) => createAppAccountApi(data),
    onSuccess: () => {
      toast.success("Tạo tài khoản Chatwoot thành công");
      queryClient.invalidateQueries({ queryKey: ["chatwoot", "account"] });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi tạo tài khoản Chatwoot"),
  });
};

export const useChatwootAppAccountUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: UpdateAppAccountRequest;
    }) => updateAppAccountApi(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Cập nhật tài khoản Chatwoot thành công");
      queryClient.invalidateQueries({ queryKey: accountKey(accountId) });
    },
    onError: (e) =>
      toastError(e, "Có lỗi xảy ra khi cập nhật tài khoản Chatwoot"),
  });
};
