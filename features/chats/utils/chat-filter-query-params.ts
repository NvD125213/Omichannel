import type { QueryParamConfig } from "use-query-params";
import type { ConversationSidebarAssigneeFilter } from "../components/chat-notification-sidebar";
import type { ChatConversationFilterDraft } from "./conversation-filter";

export const CommaArrayParam: QueryParamConfig<string[] | undefined> = {
  encode: (array) => {
    if (!array?.length) return undefined;
    return array.join(",");
  },
  decode: (input) => {
    if (input == null || input === "") return undefined;
    const raw = Array.isArray(input) ? input.join(",") : String(input);
    const values = raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return values.length > 0 ? values : undefined;
  },
};

export function parseSidebarAssigneeFilter(
  value: string | null | undefined,
): ConversationSidebarAssigneeFilter {
  if (value === "mention" || value === "unattended") return value;
  return "me";
}

export function buildAppliedFilterDraftFromQuery(query: {
  status?: string[] | null;
  filter_assignee?: string | null;
  filter_inbox?: string | null;
  filter_labels?: string[] | null;
}): ChatConversationFilterDraft {
  return {
    status: query.status ?? [],
    assigneeId: query.filter_assignee?.trim() ?? "",
    inboxId: query.filter_inbox?.trim() ?? "",
    labels: query.filter_labels ?? [],
  };
}

export function hasRailFilterQuery(query: {
  status?: string[] | null;
  filter_assignee?: string | null;
  filter_inbox?: string | null;
  filter_labels?: string[] | null;
}): boolean {
  return Boolean(
    (query.status && query.status.length > 0) ||
    query.filter_assignee?.trim() ||
    query.filter_inbox?.trim() ||
    (query.filter_labels && query.filter_labels.length > 0),
  );
}

export const CLEAR_RAIL_FILTER_QUERY = {
  custom_filter: undefined,
  status: undefined,
  filter_assignee: undefined,
  filter_inbox: undefined,
  filter_labels: undefined,
} as const;

export const CLEAR_SIDEBAR_SCOPE_QUERY = {
  inbox_id: undefined,
  team_id: undefined,
  label: undefined,
  ...CLEAR_RAIL_FILTER_QUERY,
} as const;

export function buildRailFilterQueryFromDraft(
  draft: ChatConversationFilterDraft,
) {
  return {
    ...CLEAR_SIDEBAR_SCOPE_QUERY,
    assignee: undefined,
    status: draft.status.length > 0 ? draft.status : undefined,
    filter_assignee: draft.assigneeId.trim() || undefined,
    filter_inbox: draft.inboxId.trim() || undefined,
    filter_labels: draft.labels.length > 0 ? draft.labels : undefined,
  };
}
