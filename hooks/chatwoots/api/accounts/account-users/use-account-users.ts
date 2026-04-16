import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  accountUsersApi,
  type AccountUsersQueryParams,
  type CreateAccountUserRequest,
} from "@/services/chatwoots/api/accounts/account-users/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const accountUsersKey = (accountId: number) =>
  ["chatwoot", "platform", "account-users", accountId] as const;

export const useChatwootAccountUsers = (
  params: AccountUsersQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: accountUsersKey(params.account_id),
    queryFn: () => accountUsersApi.getList(params),
    enabled: options?.enabled ?? !!params.account_id,
    staleTime: 60 * 1000,
  });
};

export const useChatwootAccountUserCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: CreateAccountUserRequest;
    }) => accountUsersApi.create(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Thêm thành viên account thành công");
      queryClient.invalidateQueries({
        queryKey: accountUsersKey(accountId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi thêm thành viên account"),
  });
};

export const useChatwootAccountUserDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      userId,
    }: {
      accountId: number;
      userId: number;
    }) => accountUsersApi.delete(accountId, userId),
    onSuccess: (_, { accountId }) => {
      toast.success("Xóa thành viên account thành công");
      queryClient.invalidateQueries({
        queryKey: accountUsersKey(accountId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi xóa thành viên account"),
  });
};
