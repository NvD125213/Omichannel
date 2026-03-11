import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  customerService,
  type GetCustomersParams,
  type CreateCustomerRequest,
  type UpdateCustomerRequest,
  type CreateCustomerTagRequest,
} from "@/services/customer/service";

export const useGetCustomers = (params: GetCustomersParams) => {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => customerService.getCustomers(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCustomerById = (id: string) => {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => customerService.getCustomerById(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      customerService.createCustomer(data),
    onSuccess: (res, variables) => {
      if (res.status_code == 201) {
        toast.success(res.message || "Tạo khách hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi tạo khách hàng");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi tạo khách hàng",
      );
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerService.updateCustomer(id, data),
    onSuccess: (res, variables) => {
      if (res.status_code == 200) {
        toast.success(res.message || "Cập nhật khách hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
        queryClient.invalidateQueries({ queryKey: ["customer", variables.id] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi cập nhật khách hàng");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật khách hàng",
      );
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: (res, variables) => {
      if (res.status_code == 200) {
        toast.success(res.message || "Xóa khách hàng thành công");
        queryClient.invalidateQueries({ queryKey: ["customers"] });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi xóa khách hàng");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra khi xóa khách hàng",
      );
    },
  });
};

export const useGetCustomerTags = (customerId: string) => {
  return useQuery({
    queryKey: ["tags", customerId],
    queryFn: () => customerService.getCustomerTags(customerId),
    enabled: !!customerId,
  });
};

export const useCreateCustomerTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      data,
    }: {
      customerId: string;
      data: CreateCustomerTagRequest;
    }) => customerService.createCustomerTag(customerId, data),
    onSuccess: (res, variables) => {
      if (res.status_code == 201) {
        toast.success("Cập nhật tag khách hàng thành công");
        queryClient.invalidateQueries({
          queryKey: ["tags", variables.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["customer", variables.customerId],
        });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi cập nhật tag khách hàng");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi cập nhật tag khách hàng",
      );
    },
  });
};

export const useRemoveCustomerTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      tagIds,
    }: {
      customerId: string;
      tagIds: string[];
    }) => customerService.removeCustomerTag(customerId, tagIds),
    onSuccess: (res, variables) => {
      if (res.status_code == 200) {
        toast.success(res.message || "Xóa tag khách hàng thành công");
        queryClient.invalidateQueries({
          queryKey: ["tags", variables.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["customer", variables.customerId],
        });
        queryClient.invalidateQueries({
          queryKey: ["customers", variables.customerId],
        });
      } else {
        toast.error(res.message || "Có lỗi xảy ra khi xóa tag khách hàng");
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          "Có lỗi xảy ra khi xóa tag khách hàng",
      );
    },
  });
};
