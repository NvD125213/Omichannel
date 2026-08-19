import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";

import {
  getSlas,
  getSlaById,
  GetSlasParams,
  GetSlasResponse,
  Sla,
  createSlaApi,
  updateSlaApi,
  deleteSlaApi,
  CreateSlaRequest,
  UpdateSlaRequest,
} from "@/services/ticket/ticket-slas/services";

/* =======================
 * Queries
 * ======================= */

export const useGetSlas = (params?: GetSlasParams) => {
  return useQuery<GetSlasResponse>({
    queryKey: ["slas", params],
    queryFn: () => getSlas(params),
  });
};

export const useGetSlaById = (id: string) => {
  return useQuery<Sla>({
    queryKey: ["sla", id],
    queryFn: () => getSlaById(id),
    enabled: !!id,
  });
};

/* =======================
 * Mutations
 * ======================= */

export const useCreateSla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSlaApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo SLA thành công",
        "Có lỗi xảy ra khi tạo SLA",
      );
      queryClient.invalidateQueries({
        queryKey: ["slas"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo SLA",
      );
    },
  });
};

export const useUpdateSla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSlaRequest }) =>
      updateSlaApi(id, payload),
    onSuccess: (response, variables) => {
      toastApiMutation(
        response,
        "Cập nhật SLA thành công",
        "Có lỗi xảy ra khi cập nhật SLA",
      );
      queryClient.invalidateQueries({
        queryKey: ["slas"],
      });
      queryClient.invalidateQueries({
        queryKey: ["sla", variables.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật SLA",
      );
    },
  });
};

export const useDeleteSla = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSlaApi,
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa SLA thành công",
        "Có lỗi xảy ra khi xóa SLA",
      );
      queryClient.invalidateQueries({
        queryKey: ["slas"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa SLA",
      );
    },
  });
};
