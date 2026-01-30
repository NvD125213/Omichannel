import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  createTicketContextApi,
  deleteTicketContextApi,
  getTicketContextsApi,
  getTicketContextWithTicketIdApi,
  TicketContextParams,
  TicketContextRequest,
  updateTicketContextApi,
} from "@/services/ticket/ticket-contexts/services";
import { toast } from "sonner";

export const useGetTicketContexts = (params: TicketContextParams) => {
  return useQuery({
    queryKey: ["ticket-contexts", params],
    queryFn: () => getTicketContextsApi(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useGetTicketContextWithTicketIdInfinite = (
  ticketId: string,
  params?: TicketContextParams,
) => {
  return useInfiniteQuery({
    // Loại bỏ page khỏi queryKey để tránh reset cache khi load thêm
    queryKey: ["ticket-contexts", ticketId, { ...params, page: undefined }],

    // Trang bắt đầu
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const response = await getTicketContextWithTicketIdApi(ticketId, {
        ...params,
        page: pageParam,
      });

      // Trả về toàn bộ response để dùng pagination
      return response;
    },

    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.data.data.pagination;

      return current_page < total_pages ? current_page + 1 : undefined;
    },

    placeholderData: (previousData) => previousData,
  });
};

export const useGetTicketContextWithTicketId = (
  ticketId: string,
  params?: TicketContextParams,
) => {
  return useQuery({
    queryKey: ["ticket-contexts", ticketId, params],
    queryFn: () => getTicketContextWithTicketIdApi(ticketId, params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketContextRequest) => createTicketContextApi(data),
    onSuccess: (_data, variables) => {
      toast.success("Tạo context thành công");
      queryClient.invalidateQueries({
        queryKey: ["ticket-contexts", variables.ticket_id],
      });
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo context",
      );
    },
  });
};

export const useUpdateTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketContextRequest>;
    }) => updateTicketContextApi(id, data),
    onSuccess: () => {
      toast.success("Cập nhật context thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật context",
      );
    },
  });
};

export const useDeleteTicketContext = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicketContextApi(id),
    onSuccess: () => {
      toast.success("Xóa context thành công");
      queryClient.invalidateQueries({ queryKey: ["ticket-contexts"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa context",
      );
    },
  });
};
