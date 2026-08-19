import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  createTicketEventApi,
  deleteTicketEventApi,
  getTicketEventsApi,
  TicketEventParams,
  TicketEventRequest,
  updateTicketEventApi,
} from "@/services/ticket/ticket-events/services";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";

export const useGetTicketEventsInfinite = (params: TicketEventParams) => {
  return useInfiniteQuery({
    // Loại bỏ page khỏi queryKey để tránh reset cache khi đổi trang
    queryKey: ["ticket-events", { ...params, page: undefined }],

    // API bắt đầu từ trang 1
    initialPageParam: 1,

    queryFn: async ({ pageParam }) => {
      const response = await getTicketEventsApi({
        ...params,
        page: pageParam,
      });
      // Trả về toàn bộ response để getNextPageParam có thể truy cập pagination
      return response;
    },

    // Xác định trang tiếp theo dựa trên dữ liệu pagination từ API
    getNextPageParam: (lastPage) => {
      const { current_page, total_pages } = lastPage.data.data.pagination;
      // Nếu trang hiện tại nhỏ hơn tổng số trang, trả về trang tiếp theo
      return current_page < total_pages ? current_page + 1 : undefined;
    },

    placeholderData: (previousData) => previousData,
  });
};

export const useCreateTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TicketEventRequest) => createTicketEventApi(data),
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Tạo event thành công",
        "Có lỗi xảy ra khi tạo event",
      );
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo event",
      );
    },
  });
};

export const useUpdateTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TicketEventRequest>;
    }) => updateTicketEventApi(id, data),
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Cập nhật event thành công",
        "Có lỗi xảy ra khi cập nhật event",
      );
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi cập nhật event",
      );
    },
  });
};

export const useDeleteTicketEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicketEventApi(id),
    onSuccess: (response) => {
      toastApiMutation(
        response,
        "Xóa event thành công",
        "Có lỗi xảy ra khi xóa event",
      );
      queryClient.invalidateQueries({ queryKey: ["ticket-events"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa event",
      );
    },
  });
};
