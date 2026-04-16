import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createLabelApi,
  deleteLabelApi,
  getLabelApi,
  listLabelsApi,
  updateLabelApi,
  type CreateLabelRequest,
  type LabelListQueryParams,
  type UpdateLabelRequest,
} from "@/services/chatwoots/api/accounts/labels/service";
import { toastError } from "@/hooks/chatwoots/sonner-error";

const labelsListKey = (accountId: number, params?: LabelListQueryParams) =>
  ["chatwoot", "account", accountId, "labels", params ?? {}] as const;

const labelKey = (accountId: number, labelId: number) =>
  ["chatwoot", "account", accountId, "labels", labelId] as const;

export const useChatwootLabels = (
  accountId: number,
  params?: LabelListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: labelsListKey(accountId, params),
    queryFn: () => listLabelsApi(accountId, params),
    enabled: options?.enabled ?? !!accountId,
    placeholderData: (prev) => prev,
  });
};

export const useChatwootLabel = (
  accountId: number,
  labelId: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: labelKey(accountId, labelId),
    queryFn: () => getLabelApi(accountId, labelId),
    enabled: options?.enabled ?? (!!accountId && !!labelId),
  });
};

export const useChatwootLabelCreate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: number;
      data: CreateLabelRequest;
    }) => createLabelApi(accountId, data),
    onSuccess: (_, { accountId }) => {
      toast.success("Tạo nhãn thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "labels"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi tạo nhãn"),
  });
};

export const useChatwootLabelUpdate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      labelId,
      data,
    }: {
      accountId: number;
      labelId: number;
      data: UpdateLabelRequest;
    }) => updateLabelApi(accountId, labelId, data),
    onSuccess: (_, { accountId, labelId }) => {
      toast.success("Cập nhật nhãn thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "labels"],
      });
      queryClient.invalidateQueries({
        queryKey: labelKey(accountId, labelId),
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi cập nhật nhãn"),
  });
};

export const useChatwootLabelDelete = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      labelId,
    }: {
      accountId: number;
      labelId: number;
    }) => deleteLabelApi(accountId, labelId),
    onSuccess: (_, { accountId }) => {
      toast.success("Xóa nhãn thành công");
      queryClient.invalidateQueries({
        queryKey: ["chatwoot", "account", accountId, "labels"],
      });
    },
    onError: (e) => toastError(e, "Có lỗi xảy ra khi xóa nhãn"),
  });
};
