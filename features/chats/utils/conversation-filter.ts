import type {
  ConversationFilter,
  FilterConversationsRequest,
  FilterConversationsResponse,
  TenantConversationsListMeta,
  AccountCustomFilter,
  AccountCustomFilterQuery,
  ListAccountCustomFiltersResponse,
  ListAccountCustomFiltersData,
  CreateAccountCustomFilterRequest,
} from "@/services/chatwoot/interface";

export type ChatConversationFilterDraft = {
  status: string[];
  assigneeId: string;
  inboxId: string;
  labels: string[];
};

export const EMPTY_CHAT_CONVERSATION_FILTER: ChatConversationFilterDraft = {
  status: [],
  assigneeId: "",
  inboxId: "",
  labels: [],
};

export const CHAT_CONVERSATION_STATUS_OPTIONS = [
  { value: "open", label: "Đang mở" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "snoozed", label: "Đã tạm ẩn" },
  { value: "all", label: "Tất cả" },
] as const;

export function buildFilterConversationsPayload(
  draft: ChatConversationFilterDraft,
): FilterConversationsRequest {
  const payload: ConversationFilter[] = [];

  const pushFilter = (
    attribute_key: string,
    values: Array<string | number>,
  ) => {
    payload.push({
      attribute_key,
      attribute_model: "standard",
      filter_operator: "equal_to",
      values,
      ...(payload.length > 0 ? { query_operator: "and" } : {}),
    });
  };

  if (draft.status.length > 0) {
    pushFilter("status", draft.status);
  }
  if (draft.assigneeId) {
    pushFilter("assignee_id", [draft.assigneeId]);
  }
  if (draft.inboxId) {
    pushFilter("inbox_id", [Number(draft.inboxId)]);
  }
  if (draft.labels.length > 0) {
    pushFilter("labels", draft.labels);
  }

  return { payload };
}

export const ACCOUNT_CUSTOM_FILTER_TYPE = "conversation";

export function parseCustomFilterId(
  id: number | string | null | undefined,
): number | null {
  if (id === null || id === undefined) return null;
  const value = typeof id === "number" ? id : Number(id);
  return Number.isFinite(value) ? value : null;
}

export function buildAccountCustomFilterRequest(
  name: string,
  draft: ChatConversationFilterDraft,
  filterType: string | number = ACCOUNT_CUSTOM_FILTER_TYPE,
): CreateAccountCustomFilterRequest | null {
  const filterRequest = buildFilterConversationsPayload(draft);
  if (!filterRequest.payload.length) return null;

  const trimmedName = name.trim();
  if (!trimmedName) return null;

  return {
    name: trimmedName,
    filter_type: filterType,
    query: { payload: filterRequest.payload },
  };
}

export function hasActiveChatConversationFilter(
  draft: ChatConversationFilterDraft,
): boolean {
  return countActiveChatConversationFilters(draft) > 0;
}

export function countActiveChatConversationFilters(
  draft: ChatConversationFilterDraft,
): number {
  return (
    draft.status.length +
    (draft.assigneeId ? 1 : 0) +
    (draft.inboxId ? 1 : 0) +
    draft.labels.length
  );
}

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
  return rows;
};

export const extractFilterConversationsPayload = (
  res: FilterConversationsResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const chatwoot = res?.data?.chatwoot;
  if (!chatwoot) return null;
  return coerceConversationRecords(chatwoot.payload);
};

export const extractFilterConversationsMeta = (
  res: FilterConversationsResponse | null | undefined,
): TenantConversationsListMeta | null => {
  const meta = res?.data?.chatwoot?.meta;
  if (meta && typeof meta === "object") return meta;
  return null;
};

export const extractFilterConversationsPayloadFromPages = (
  pages: (FilterConversationsResponse | undefined)[] | undefined,
): Record<string, unknown>[] | null => {
  if (!pages || pages.length === 0) return null;

  const merged: Record<string, unknown>[] = [];
  let hasExtractablePayload = false;

  for (const page of pages) {
    const payload = extractFilterConversationsPayload(page);
    if (payload !== null) {
      hasExtractablePayload = true;
      merged.push(...payload);
    }
  }

  return hasExtractablePayload ? merged : null;
};

export const extractFilterConversationsMetaFromPages = (
  pages: (FilterConversationsResponse | undefined)[] | undefined,
): TenantConversationsListMeta | null => {
  if (!pages?.length) return null;
  return extractFilterConversationsMeta(pages[0]);
};

const coerceCustomFilterRecords = (
  value: unknown,
): AccountCustomFilter[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is AccountCustomFilter =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

export const extractAccountCustomFilters = (
  res: ListAccountCustomFiltersResponse | undefined,
): AccountCustomFilter[] => {
  if (!res?.data) return [];

  if (Array.isArray(res.data)) {
    return coerceCustomFilterRecords(res.data) ?? [];
  }

  const root = res.data as ListAccountCustomFiltersData;
  return (
    coerceCustomFilterRecords(root.custom_filters) ??
    coerceCustomFilterRecords(root.payload) ??
    coerceCustomFilterRecords(root.data?.custom_filters) ??
    coerceCustomFilterRecords(root.data?.payload) ??
    coerceCustomFilterRecords(root.chatwoot?.custom_filters) ??
    coerceCustomFilterRecords(root.chatwoot?.payload) ??
    []
  );
};

export const customFilterQueryToRequest = (
  query: AccountCustomFilterQuery | undefined,
): FilterConversationsRequest | null => {
  if (!query?.payload?.length) return null;
  return { payload: query.payload };
};

export const customFilterQueryToDraft = (
  query: AccountCustomFilterQuery | undefined,
): ChatConversationFilterDraft => {
  const draft: ChatConversationFilterDraft = {
    ...EMPTY_CHAT_CONVERSATION_FILTER,
  };

  if (!query?.payload?.length) return draft;

  for (const item of query.payload) {
    const values = item.values.map(String);

    switch (item.attribute_key) {
      case "status":
        draft.status = values;
        break;
      case "assignee_id":
        draft.assigneeId = values[0] ?? "";
        break;
      case "inbox_id":
        draft.inboxId = values[0] ?? "";
        break;
      case "labels":
        draft.labels = values;
        break;
      default:
        break;
    }
  }

  return draft;
};

export const countCustomFilterRequestConditions = (
  request: FilterConversationsRequest | null | undefined,
): number => request?.payload?.length ?? 0;
