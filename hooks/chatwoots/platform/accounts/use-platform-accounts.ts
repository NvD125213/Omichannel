import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  accountApi,
  type CreateAccountRequest,
  type UpdateAccountRequest,
} from "@/services/chatwoots/platform/accounts/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const platformAccountKey = (accountId: number) =>
  ["chatwoot", "platform", "accounts", accountId] as const;

export const useChatwootPlatformAccount = (
  accountId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: platformAccountKey(accountId),
    queryFn: () => accountApi.get(accountId),
    enabled: options?.enabled ?? !!accountId,
    staleTime: 60 * 1000,
  });
};

export const useChatwootPlatformAccountCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountRequest) => accountApi.create(data),
    onSuccess: () => {
      toast.success("Tạo account (platform) thành công");
      queryClient.invalidateQueries({ queryKey: ["chatwoot", "platform"] });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi tạo account platform"),
  });
};

export const useChatwootPlatformAccountUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: UpdateAccountRequest;
    }) => accountApi.update(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Cập nhật account (platform) thành công");
      queryClient.invalidateQueries({
        queryKey: platformAccountKey(accountId),
      });
    },
    onError: (e) =>
      toastError(e, "Có lỗi xảy ra khi cập nhật account platform"),
  });
};

export const useChatwootPlatformAccountDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: number) => accountApi.delete(accountId),
    onSuccess: () => {
      toast.success("Xóa account (platform) thành công");
      queryClient.invalidateQueries({ queryKey: ["chatwoot", "platform"] });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi xóa account platform"),
  });
};
