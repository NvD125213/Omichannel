import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";

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
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo ticket template thành công",
        "Có lỗi xảy ra khi tạo ticket template",
      );
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
    onSuccess: (response, variables) => {
      toastApiMutation(
        response,
        "Cập nhật ticket template thành công",
        "Có lỗi xảy ra khi cập nhật ticket template",
      );
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
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa ticket template thành công",
        "Có lỗi xảy ra khi xóa ticket template",
      );
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
    onSuccess: (response, id) => {
      toastApiMutation(
        response,
        "Cập nhật trạng thái template thành công",
        "Có lỗi xảy ra khi cập nhật trạng thái template",
      );
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
