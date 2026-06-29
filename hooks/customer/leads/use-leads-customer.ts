import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
      if (res.status_code === 201) {
        toast.success(res.message || "Tạo thông tin khách hàng thành công");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } else {
        toast.error(
          res.message || "Có lỗi xảy ra khi tạo thông tin khách hàng",
        );
      }
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
      if (res.status_code === 200) {
        toast.success(
          res.message || "Cập nhật thông tin khách hàng thành công",
        );
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY, variables.id],
        });
      } else {
        toast.error(
          res.message || "Có lỗi xảy ra khi cập nhật thông tin khách hàng",
        );
      }
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
      if (res.status_code === 200) {
        toast.success(res.message || "Xóa thông tin khách hàng thành công");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      } else {
        toast.error(
          res.message || "Có lỗi xảy ra khi xóa thông tin khách hàng",
        );
      }
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(message || "Có lỗi xảy ra khi xóa thông tin khách hàng");
    },
  });
};
