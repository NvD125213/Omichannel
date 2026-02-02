import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
    onSuccess: () => {
      toast.success("Tạo SLA thành công");
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
    onSuccess: (_, variables) => {
      toast.success("Cập nhật SLA thành công");
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
    onSuccess: () => {
      toast.success("Xóa SLA thành công");
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
