import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getContactLabelsApi,
  setContactLabelsApi,
  type SetContactLabelsRequest,
} from "@/services/chatwoots/api/accounts/contact-labels/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const contactLabelsKey = (accountId: number, contactId: number) =>
  ["chatwoot", "account", accountId, "contacts", contactId, "labels"] as const;

export const useChatwootContactLabels = (
  accountId: number,
  contactId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: contactLabelsKey(accountId, contactId),
    queryFn: () => getContactLabelsApi(accountId, contactId),
    enabled: options?.enabled ?? (!!accountId && !!contactId),
  });
};

export const useChatwootContactLabelsSet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      contactId,
      data,
    }: {
      accountId: number;
      contactId: number;
      data: SetContactLabelsRequest;
    }) => setContactLabelsApi(accountId, contactId, data),
    onSuccess: (_, { accountId, contactId }) => {
      toast.success("Cập nhật nhãn contact thành công");
      queryClient.invalidateQueries({
        queryKey: contactLabelsKey(accountId, contactId),
      });
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "contacts"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật nhãn contact"),
  });
};
