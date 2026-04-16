import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createContactApi,
  deleteContactApi,
  getContactApi,
  getContactConversationsApi,
  listContactsApi,
  updateContactApi,
  type ContactListQueryParams,
  type CreateContactRequest,
  type UpdateContactRequest,
} from "@/services/chatwoots/api/accounts/contacts/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const contactsListKey = (accountId: number, params?: ContactListQueryParams) =>
  ["chatwoot", "account", accountId, "contacts", params ?? {}] as const;

const contactKey = (accountId: number, contactId: number) =>
  ["chatwoot", "account", accountId, "contacts", contactId] as const;

const contactConversationsKey = (accountId: number, contactId: number) =>
  [
    "chatwoot",
    "account",
    accountId,
    "contacts",
    contactId,
    "conversations",
  ] as const;

export const useChatwootContacts = (
  accountId: number,
  params?: ContactListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: contactsListKey(accountId, params),
    queryFn: () => listContactsApi(accountId, params),
    enabled: options?.enabled ?? !!accountId,
    placeholderData: (prev) => prev,
  });
};

export const useChatwootContact = (
  accountId: number,
  contactId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: contactKey(accountId, contactId),
    queryFn: () => getContactApi(accountId, contactId),
    enabled: options?.enabled ?? (!!accountId && !!contactId),
  });
};

export const useChatwootContactConversations = (
  accountId: number,
  contactId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: contactConversationsKey(accountId, contactId),
    queryFn: () => getContactConversationsApi(accountId, contactId),
    enabled: options?.enabled ?? (!!accountId && !!contactId),
  });
};

export const useChatwootContactCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: CreateContactRequest;
    }) => createContactApi(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Tạo contact thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "contacts"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi tạo contact"),
  });
};

export const useChatwootContactUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      contactId,
      data,
    }: {
      accountId: number;
      contactId: number;
      data: UpdateContactRequest;
    }) => updateContactApi(accountId, contactId, data),
    onSuccess: (_, { accountId, contactId }) => {
      toast.success("Cập nhật contact thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "contacts"],
      });
      queryClient.invalidateQueries({
        queryKey: contactKey(accountId, contactId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật contact"),
  });
};

export const useChatwootContactDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      contactId,
    }: {
      accountId: number;
      contactId: number;
    }) => deleteContactApi(accountId, contactId),
    onSuccess: (_, { accountId }) => {
      toast.success("Xóa contact thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "contacts"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi xóa contact"),
  });
};
