import apiClient from "@/lib/api-client";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  tenant_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  meta_data: Record<string, unknown>;
  is_active: boolean;
  tag_ids: string[];
}

// Request api
export interface CreateCustomerRequest {
  name: string;
  phone: string;
  email: string;
  tenant_id?: string;
  meta_data?: Record<string, unknown>;
  tag_ids?: string[];
}

export type UpdateCustomerRequest = CreateCustomerRequest;

export interface CreateCustomerTagRequest {
  tag_ids: string[];
}

// Response api
// Base response
export interface ApiResponse<T> {
  status: string;
  status_code: number;
  message: string;
  data: T;
}

// Pagination type
export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Response cụ thể
export type GetCustomersResponse = ApiResponse<{
  items: Customer[];
  pagination: Pagination;
}>;

export type CreateCustomerResponse = ApiResponse<Customer>;

export type UpdateCustomerResponse = ApiResponse<Customer>;

export type DeleteCustomerResponse = ApiResponse<void>;

export type GetCustomerByIdResponse = ApiResponse<Customer>;

export type GetCustomerTagsResponse = ApiResponse<
  {
    id: string;
    name: string;
    description: string;
    color: string;
    type: string;
  }[]
>;

export type CreateCustomerTagResponse = ApiResponse<Customer>;

export type UpdateCustomerTagResponse = ApiResponse<Customer>;

export type AddTagsToCustomerResponse = ApiResponse<{
  customer_id: string;
  tag_ids: string[];
}>;

export type RemoveTagsFromCustomerResponse = ApiResponse<void>;

// Params type
export interface GetCustomersParams {
  id?: string;
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: string;
  is_active?: boolean;
}

// Xử lý api service
export const customerService = {
  getCustomers: async (
    params: GetCustomersParams,
  ): Promise<GetCustomersResponse> => {
    const response = await apiClient.get(`/customers`, {
      params,
    });
    return response.data;
  },

  getCustomerById: async (id: string) => {
    const response = await apiClient.get<GetCustomerByIdResponse>(
      `/customers/${id}`,
    );
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest) => {
    const response = await apiClient.post<CreateCustomerResponse>(
      `/customers`,
      data,
    );
    return response.data;
  },

  updateCustomer: async (id: string, data: UpdateCustomerRequest) => {
    const response = await apiClient.put<UpdateCustomerResponse>(
      `/customers/${id}`,
      data,
    );
    return response.data;
  },

  deleteCustomer: async (id: string) => {
    const response = await apiClient.delete<DeleteCustomerResponse>(
      `/customers/${id}`,
    );
    return response.data;
  },

  getCustomerTags: async (customerId: string) => {
    const response = await apiClient.get<GetCustomerTagsResponse>(
      `/customers/${customerId}/tags`,
    );
    return response.data;
  },

  createCustomerTag: async (
    customerId: string,
    data: CreateCustomerTagRequest,
  ) => {
    const response = await apiClient.post<CreateCustomerTagResponse>(
      `/customers/${customerId}/tags`,
      data,
    );
    return response.data;
  },

  removeCustomerTag: async (customerId: string, tagIds: string[]) => {
    const response = await apiClient.delete<RemoveTagsFromCustomerResponse>(
      `/customers/${customerId}/tags`,
      { data: { tag_ids: tagIds } },
    );
    return response.data;
  },
};
