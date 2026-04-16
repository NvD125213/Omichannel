import { chatwoot_api_client } from "@/lib/chatwoot-api-client";
import { cleanParams } from "@/utils/clean-params";

const client = chatwoot_api_client;

/** Định nghĩa nhãn cấp account — GET/POST/PATCH/DELETE `/api/v1/accounts/:account_id/labels` */

export interface ChatwootErrorBody {
  description?: string;
  errors?: Array<{
    field?: string;
    message?: string;
    code?: string;
  }>;
}

export interface Label {
  id: number;
  title: string;
  description?: string | null;
  color: string;
  show_on_sidebar?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface LabelsListMeta {
  count?: number;
  [key: string]: unknown;
}

export interface LabelsListResponse {
  meta?: LabelsListMeta;
  payload?: Label[];
  [key: string]: unknown;
}

export interface LabelListQueryParams {
  page?: number;
}

export interface CreateLabelRequest {
  title: string;
  description?: string;
  color: string;
  show_on_sidebar?: boolean;
}

export interface UpdateLabelRequest {
  title?: string;
  description?: string;
  color?: string;
  show_on_sidebar?: boolean;
}

export async function listLabelsApi(
  accountId: number,
  params?: LabelListQueryParams,
) {
  const queryParams = cleanParams(params ?? {});
  const response = await client.get<LabelsListResponse>(
    `/api/v1/accounts/${accountId}/labels`,
    { params: queryParams },
  );
  return response.data;
}

export async function getLabelApi(accountId: number, labelId: number) {
  const response = await client.get<Label>(
    `/api/v1/accounts/${accountId}/labels/${labelId}`,
  );
  return response.data;
}

export async function createLabelApi(
  accountId: number,
  data: CreateLabelRequest,
) {
  const response = await client.post<Label>(
    `/api/v1/accounts/${accountId}/labels`,
    data,
  );
  return response.data;
}

export async function updateLabelApi(
  accountId: number,
  labelId: number,
  data: UpdateLabelRequest,
) {
  const response = await client.patch<Label>(
    `/api/v1/accounts/${accountId}/labels/${labelId}`,
    data,
  );
  return response.data;
}

export async function deleteLabelApi(accountId: number, labelId: number) {
  const response = await client.delete<void>(
    `/api/v1/accounts/${accountId}/labels/${labelId}`,
  );
  return response.data;
}
