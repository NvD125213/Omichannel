import apiClient from "@/lib/api-client";

export interface CustomerProvidedInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  description: string;
  tenant_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerProvidedInfoRequest {
  name: string;
  email: string;
  phone: string;
  description: string;
  tenant_id: string;
}

export type UpdateCustomerProvidedInfoRequest = CustomerProvidedInfoRequest;

export interface ApiResponse<T> {
  status: string;
  status_code: number;
  message: string;
  data: T;
}

export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type CustomerProvidedInfoSortBy =
  | "name"
  | "email"
  | "phone"
  | "created_at"
  | "updated_at";

export interface GetCustomerProvidedInfoParams {
  id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: CustomerProvidedInfoSortBy;
  sort_order?: "asc" | "desc";
}

export type GetCustomerProvidedInfoListResponse = ApiResponse<{
  items: CustomerProvidedInfo[];
  pagination: Pagination;
}>;

export type GetCustomerProvidedInfoDetailResponse =
  ApiResponse<CustomerProvidedInfo>;

export type CreateCustomerProvidedInfoResponse =
  ApiResponse<CustomerProvidedInfo>;

export type UpdateCustomerProvidedInfoResponse =
  ApiResponse<CustomerProvidedInfo>;

export type DeleteCustomerProvidedInfoResponse = ApiResponse<void>;

export const customerProvidedInfoService = {
  getCustomerProvidedInfos: async (
    params: GetCustomerProvidedInfoParams,
  ): Promise<GetCustomerProvidedInfoListResponse> => {
    const response = await apiClient.get<GetCustomerProvidedInfoListResponse>(
      "/customer-provided-info",
      { params },
    );
    return response.data;
  },

  createCustomerProvidedInfo: async (data: CustomerProvidedInfoRequest) => {
    const response = await apiClient.post<CreateCustomerProvidedInfoResponse>(
      "/customer-provided-info",
      data,
    );
    return response.data;
  },

  updateCustomerProvidedInfo: async (
    id: string,
    data: UpdateCustomerProvidedInfoRequest,
  ) => {
    const response = await apiClient.put<UpdateCustomerProvidedInfoResponse>(
      `/customer-provided-info/${id}`,
      data,
    );
    return response.data;
  },

  deleteCustomerProvidedInfo: async (id: string) => {
    const response = await apiClient.delete<DeleteCustomerProvidedInfoResponse>(
      `/customer-provided-info/${id}`,
    );
    return response.data;
  },
};
