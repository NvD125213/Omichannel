import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getTicketTemplates,
  getTicketTemplateById,
  GetTicketTemplatesParams,
  GetTicketTemplatesResponse,
  TicketTemplate,
  GetTicketTemplateByIdResponse,
  createTicketTemplateApi,
  updateTicketTemplateApi,
  deleteTicketTemplateApi,
  statusTicketTemplateApi,
  CreateTicketTemplateRequest,
  UpdateTicketTemplateRequest,
} from "@/services/ticket/ticket-templates/services";

/* =======================
 * Queries
 * ======================= */

export const useGetTicketTemplates = (params?: GetTicketTemplatesParams) => {
  return useQuery<GetTicketTemplatesResponse>({
    queryKey: ["ticket-templates", params],
    queryFn: () => getTicketTemplates(params),
  });
};

export const useGetTicketTemplateById = (id: string) => {
  return useQuery<GetTicketTemplateByIdResponse>({
    queryKey: ["ticket-template", id],
    queryFn: () => getTicketTemplateById(id),
    enabled: !!id,
  });
};

/* =======================
 * Mutations
 * ======================= */

export const useCreateTicketTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTicketTemplateApi,
    onSuccess: () => {
      toast.success("Tạo ticket template thành công");
      queryClient.invalidateQueries({
        queryKey: ["ticket-templates"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi tạo ticket template",
      );
    },
  });
};

export const useUpdateTicketTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTicketTemplateRequest;
    }) => updateTicketTemplateApi(id, payload),
    onSuccess: (_, variables) => {
      toast.success("Cập nhật ticket template thành công");
      queryClient.invalidateQueries({
        queryKey: ["ticket-templates"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket-template", variables.id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật ticket template",
      );
    },
  });
};

export const useDeleteTicketTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTicketTemplateApi,
    onSuccess: () => {
      toast.success("Xóa ticket template thành công");
      queryClient.invalidateQueries({
        queryKey: ["ticket-templates"],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi xóa ticket template",
      );
    },
  });
};

export const useStatusTicketTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: statusTicketTemplateApi,
    onSuccess: (_, id) => {
      toast.success("Cập nhật trạng thái template thành công");
      queryClient.invalidateQueries({
        queryKey: ["ticket-templates"],
      });
      queryClient.invalidateQueries({
        queryKey: ["ticket-template", id],
      });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật trạng thái template",
      );
    },
  });
};
