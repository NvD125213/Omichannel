import type {
  ConversationFilter,
  FilterConversationsRequest,
  FilterConversationsResponse,
  ListTenantConversationsParams,
  ListTenantConversationsResponse,
  TenantConversationsListMeta,
  AccountCustomFilter,
  AccountCustomFilterQuery,
  ListAccountCustomFiltersResponse,
  ListAccountCustomFiltersData,
  CreateAccountCustomFilterRequest,
} from "@/services/chatwoot/interface";
import { getMessagingEnvelope } from "./messaging-envelope";

export type SidebarConversationAssigneeFilter = "me" | "mention" | "unattended";

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
  { value: "pending", label: "Chờ xử lý" },
  { value: "resolved", label: "Đã xử lý" },
  { value: "snoozed", label: "Đã tạm ẩn" },
  { value: "all", label: "Tất cả" },
] as const;

export const DEFAULT_CHAT_CONVERSATION_STATUSES = ["open", "pending"] as const;

export const CONVERSATION_STATUS_BADGE_STYLES: Record<
  string,
  { dot: string; bg: string; text: string; border: string }
> = {
  open: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-500/25",
  },
  resolved: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/10",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-500/25",
  },
  pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/25",
  },
  snoozed: {
    dot: "bg-slate-400",
    bg: "bg-slate-400/10",
    text: "text-slate-700 dark:text-slate-400",
    border: "border-slate-400/25",
  },
  all: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-500/25",
  },
};

export function conversationStatusBadgeStyle(status: string) {
  return (
    CONVERSATION_STATUS_BADGE_STYLES[status] ??
    CONVERSATION_STATUS_BADGE_STYLES.open
  );
}

export function normalizeConversationStatuses(
  status: string | string[] | undefined | null,
): string[] {
  if (status == null || status === "") return [];
  const values = Array.isArray(status) ? status : String(status).split(",");
  return values.map((value) => value.trim()).filter(Boolean);
}

export function conversationStatusLabel(status: string) {
  return (
    CHAT_CONVERSATION_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status
  );
}

type FilterPayloadEntry = {
  attribute_key: string;
  values: Array<string | number>;
  filter_operator?: string;
};

function finalizeFilterPayload(
  entries: FilterPayloadEntry[],
): ConversationFilter[] {
  return entries.map((entry, index) => {
    const isLast = index === entries.length - 1;
    const isLabels = entry.attribute_key === "labels";

    const filter: ConversationFilter = {
      attribute_key: entry.attribute_key,
      filter_operator: entry.filter_operator ?? "equal_to",
      values: entry.values,
    };

    if (!isLabels) {
      filter.attribute_model = "standard";
      filter.custom_attribute_type = "";
    }

    if (!isLast) {
      filter.query_operator = "and";
    }

    return filter;
  });
}

export function buildFilterConversationsPayload(
  draft: ChatConversationFilterDraft,
): FilterConversationsRequest {
  const entries: FilterPayloadEntry[] = [];

  if (draft.status.length > 0) {
    entries.push({ attribute_key: "status", values: draft.status });
  }
  if (draft.assigneeId) {
    entries.push({ attribute_key: "assignee_id", values: [draft.assigneeId] });
  }
  if (draft.inboxId) {
    const inboxId = Number(draft.inboxId);
    if (Number.isFinite(inboxId)) {
      entries.push({ attribute_key: "inbox_id", values: [inboxId] });
    }
  }
  if (draft.labels.length > 0) {
    entries.push({ attribute_key: "labels", values: draft.labels });
  }

  return { payload: finalizeFilterPayload(entries) };
}

export function buildConversationListFilterRequest(options?: {
  status?: string[];
  inboxId?: string | number;
  labels?: string[];
  teamId?: string | null;
  assigneeType?: "all" | "me" | "unassigned";
  currentAssigneeId?: string;
}): FilterConversationsRequest {
  const entries: FilterPayloadEntry[] = [];

  entries.push({
    attribute_key: "status",
    values:
      options?.status && options.status.length > 0
        ? options.status
        : [...DEFAULT_CHAT_CONVERSATION_STATUSES],
  });

  if (options?.assigneeType === "me" && options.currentAssigneeId) {
    entries.push({
      attribute_key: "assignee_id",
      values: [options.currentAssigneeId],
    });
  }

  if (options?.inboxId !== undefined && options.inboxId !== "") {
    const inboxId = Number(options.inboxId);
    if (Number.isFinite(inboxId)) {
      entries.push({ attribute_key: "inbox_id", values: [inboxId] });
    }
  }

  if (options?.labels && options.labels.length > 0) {
    entries.push({ attribute_key: "labels", values: options.labels });
  }

  if (options?.teamId?.trim()) {
    const teamId = Number(options.teamId.trim());
    entries.push({
      attribute_key: "team_id",
      values: [Number.isFinite(teamId) ? teamId : options.teamId.trim()],
    });
  }

  if (options?.assigneeType === "unassigned") {
    entries.push({
      attribute_key: "assignee_id",
      filter_operator: "is_not_present",
      values: [""],
    });
  }

  return { payload: finalizeFilterPayload(entries) };
}

export type FilterConversationsQueryParams = Pick<
  ListTenantConversationsParams,
  "conversation_type" | "assignee_type"
>;

export interface SidebarFilterRequestResult {
  request: FilterConversationsRequest;
  query?: FilterConversationsQueryParams;
}

export function buildSidebarFilterRequest(options: {
  conversationAssignee: SidebarConversationAssigneeFilter;
  inboxId?: number | null;
  teamId?: string | null;
  label?: string | null;
  status?: string[];
}): SidebarFilterRequestResult {
  const hasScopedFilter =
    (typeof options.inboxId === "number" && Number.isFinite(options.inboxId)) ||
    Boolean(options.teamId?.trim()) ||
    Boolean(options.label?.trim());

  const request = buildConversationListFilterRequest({
    status: options.status,
    inboxId:
      typeof options.inboxId === "number" && Number.isFinite(options.inboxId)
        ? options.inboxId
        : undefined,
    labels: options.label ? [options.label] : [],
    teamId: options.teamId,
  });

  if (hasScopedFilter) {
    return { request };
  }

  if (options.conversationAssignee === "mention") {
    return {
      request,
      query: { conversation_type: "mention" },
    };
  }

  if (options.conversationAssignee === "unattended") {
    return {
      request,
      query: {
        conversation_type: "unattended",
        assignee_type: "me",
      },
    };
  }

  return {
    request,
    query: { conversation_type: "me" },
  };
}

export function buildSidebarListConversationsParams(options: {
  conversationAssignee: SidebarConversationAssigneeFilter;
  inboxId?: number | null;
  teamId?: string | null;
  label?: string | null;
  status?: string[];
}): ListTenantConversationsParams {
  const params: ListTenantConversationsParams = {
    status:
      options.status && options.status.length > 0
        ? options.status
        : [...DEFAULT_CHAT_CONVERSATION_STATUSES],
  };

  if (typeof options.inboxId === "number" && Number.isFinite(options.inboxId)) {
    params.inbox_id = options.inboxId;
  }

  if (options.teamId?.trim()) {
    params.team_id = options.teamId.trim();
  }

  if (options.label?.trim()) {
    params.labels = [options.label.trim()];
  }

  const hasScopedFilter =
    (typeof options.inboxId === "number" && Number.isFinite(options.inboxId)) ||
    Boolean(options.teamId?.trim()) ||
    Boolean(options.label?.trim());

  if (!hasScopedFilter) {
    params.conversation_type = options.conversationAssignee;
  }

  return params;
}

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

export const extractListConversationsPayload = (
  res: ListTenantConversationsResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const data = res?.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;

  const nested = coerceConversationRecords(
    (data.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nested) return nested;

  const messaging = getMessagingEnvelope(data);
  const messagingPayload = coerceConversationRecords(messaging?.payload);
  if (messagingPayload) return messagingPayload;

  const messagingData = messaging?.data as Record<string, unknown> | undefined;
  const messagingNested = coerceConversationRecords(messagingData?.payload);
  if (messagingNested) return messagingNested;

  return null;
};

export const extractListConversationsMeta = (
  res: ListTenantConversationsResponse | null | undefined,
): TenantConversationsListMeta | null => {
  const data = res?.data as Record<string, unknown> | undefined;
  if (!data) return null;

  const flatMeta = data.meta;
  if (flatMeta && typeof flatMeta === "object") {
    return flatMeta as TenantConversationsListMeta;
  }

  const nestedMeta = (data.data as Record<string, unknown> | undefined)?.meta;
  if (nestedMeta && typeof nestedMeta === "object") {
    return nestedMeta as TenantConversationsListMeta;
  }

  const messaging = getMessagingEnvelope(data);
  const messagingMeta = messaging?.meta;
  if (messagingMeta && typeof messagingMeta === "object") {
    return messagingMeta as TenantConversationsListMeta;
  }

  const messagingData = messaging?.data as Record<string, unknown> | undefined;
  const messagingNestedMeta = messagingData?.meta;
  if (messagingNestedMeta && typeof messagingNestedMeta === "object") {
    return messagingNestedMeta as TenantConversationsListMeta;
  }

  return null;
};

export const extractListConversationsPayloadFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): Record<string, unknown>[] | null => {
  if (!pages || pages.length === 0) return null;

  const merged: Record<string, unknown>[] = [];
  let hasExtractablePayload = false;

  for (const page of pages) {
    const payload = extractListConversationsPayload(page);
    if (payload !== null) {
      hasExtractablePayload = true;
      merged.push(...payload);
    }
  }

  return hasExtractablePayload ? merged : null;
};

export const extractListConversationsMetaFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): TenantConversationsListMeta | null => {
  if (!pages?.length) return null;
  return extractListConversationsMeta(pages[0]);
};

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

export const extractFilterConversationsPayload = (
  res: FilterConversationsResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const envelope = res?.data?.messaging ?? res?.data?.chatwoot;
  if (!envelope) return null;
  return coerceConversationRecords(envelope.payload);
};

export const extractFilterConversationsMeta = (
  res: FilterConversationsResponse | null | undefined,
): TenantConversationsListMeta | null => {
  const meta = res?.data?.messaging?.meta ?? res?.data?.chatwoot?.meta;
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
    coerceCustomFilterRecords(root.messaging?.custom_filters) ??
    coerceCustomFilterRecords(root.messaging?.payload) ??
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
