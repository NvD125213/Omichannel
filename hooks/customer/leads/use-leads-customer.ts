import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { toastApiMutation } from "@/lib/toast-api-mutation";
import {
  customerProvidedInfoService,
  type CustomerProvidedInfoRequest,
  type GetCustomerProvidedInfoParams,
  type UpdateCustomerProvidedInfoRequest,
} from "@/services/customer/leads/service";

const QUERY_KEY = "customer-provided-info";

export const useGetCustomerProvidedInfos = (
  params: GetCustomerProvidedInfoParams,
) => {
  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => customerProvidedInfoService.getCustomerProvidedInfos(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useCreateCustomerProvidedInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerProvidedInfoRequest) =>
      customerProvidedInfoService.createCustomerProvidedInfo(data),
    onSuccess: (res) => {
      toastApiMutation(
        res,
        "Tạo thông tin khách hàng thành công",
        "Có lỗi xảy ra khi tạo thông tin khách hàng",
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi tạo thông tin khách hàng");
    },
  });
};

export const useUpdateCustomerProvidedInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCustomerProvidedInfoRequest;
    }) => customerProvidedInfoService.updateCustomerProvidedInfo(id, data),
    onSuccess: (res, variables) => {
      toastApiMutation(
        res,
        "Cập nhật thông tin khách hàng thành công",
        "Có lỗi xảy ra khi cập nhật thông tin khách hàng",
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, variables.id],
      });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi cập nhật thông tin khách hàng");
    },
  });
};

export const useDeleteCustomerProvidedInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      customerProvidedInfoService.deleteCustomerProvidedInfo(id),
    onSuccess: (res) => {
      toastApiMutation(
        res,
        "Xóa thông tin khách hàng thành công",
        "Có lỗi xảy ra khi xóa thông tin khách hàng",
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi xóa thông tin khách hàng");
    },
  });
};
