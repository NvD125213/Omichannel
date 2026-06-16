"use client";

import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import {
  useListChatwootAgents,
  useListTenantInboxes,
  useListTenantLabels,
} from "@/hooks/chatwoot/use-chatwoot";
import {
  CHAT_CONVERSATION_STATUS_OPTIONS,
  countActiveChatConversationFilters,
  type ChatConversationFilterDraft,
} from "../utils/conversation-filter";

type TenantInboxItem = {
  id?: number | string;
  name?: string;
};

const coerceStringArray = (value: unknown): string[] | null =>
  Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;

const coerceObjectArray = (
  value: unknown,
): Array<Record<string, unknown>> | null =>
  Array.isArray(value) &&
  value.every(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  )
    ? (value as Array<Record<string, unknown>>)
    : null;

function extractRawLabels(
  response: unknown,
): Array<string | Record<string, unknown>> {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const fromData = root.data as Record<string, unknown> | undefined;
  const chatwoot = fromData?.chatwoot as Record<string, unknown> | undefined;

  const chatwootPayloadObjects = coerceObjectArray(chatwoot?.payload);
  if (chatwootPayloadObjects) return chatwootPayloadObjects;

  const chatwootPayloadStrings = coerceStringArray(chatwoot?.payload);
  if (chatwootPayloadStrings) return chatwootPayloadStrings;

  const dataLabelStrings = coerceStringArray(fromData?.labels);
  if (dataLabelStrings) return dataLabelStrings;

  return [];
}

function extractAgentRecords(
  response: unknown,
): Record<string, unknown>[] | null {
  const coerceRecords = (value: unknown) => {
    if (!Array.isArray(value)) return null;
    return value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object" && !Array.isArray(item),
    );
  };

  const directArray = coerceRecords(response);
  if (directArray) return directArray;
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;

  return (
    coerceRecords(data?.payload) ??
    coerceRecords(data?.agents) ??
    coerceRecords(
      (data?.chatwoot as Record<string, unknown> | undefined)?.payload,
    ) ??
    null
  );
}

function FilterPreviewRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function PreviewBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      variant="secondary"
      className="border-primary/20 bg-primary/10 text-xs font-normal text-primary"
    >
      {children}
    </Badge>
  );
}

interface ChatConversationFilterPreviewProps {
  tenantId: string;
  filterDraft: ChatConversationFilterDraft;
}

export function ChatConversationFilterPreview({
  tenantId,
  filterDraft,
}: ChatConversationFilterPreviewProps) {
  const { data: inboxData } = useListTenantInboxes(tenantId);
  const { data: labelData } = useListTenantLabels(tenantId);
  const { data: agentsData } = useListChatwootAgents(tenantId);

  const inboxNameById = useMemo(() => {
    const inboxPayload = (
      inboxData?.data as { chatwoot?: { payload?: unknown } } | undefined
    )?.chatwoot?.payload;
    const inboxes: TenantInboxItem[] = Array.isArray(inboxPayload)
      ? (inboxPayload as TenantInboxItem[])
      : [];

    const map = new Map<string, string>();
    for (const inbox of inboxes) {
      const id =
        typeof inbox.id === "number"
          ? inbox.id
          : typeof inbox.id === "string"
            ? Number(inbox.id)
            : Number.NaN;
      if (!Number.isFinite(id)) continue;
      const name =
        typeof inbox.name === "string" && inbox.name.length > 0
          ? inbox.name
          : `Inbox #${id}`;
      map.set(String(id), name);
    }
    return map;
  }, [inboxData]);

  const labelTitleByValue = useMemo(() => {
    const map = new Map<string, string>();
    for (const raw of extractRawLabels(labelData)) {
      if (typeof raw === "string") {
        map.set(raw, raw);
        continue;
      }
      const title =
        typeof raw.title === "string"
          ? raw.title
          : typeof raw.name === "string"
            ? raw.name
            : typeof raw.label === "string"
              ? raw.label
              : "";
      if (title) map.set(title, title);
    }
    return map;
  }, [labelData]);

  const assigneeNameById = useMemo(() => {
    const map = new Map<string, string>();
    const records = extractAgentRecords(agentsData) ?? [];
    for (const [index, record] of records.entries()) {
      const id = String(record.id ?? record.user_id ?? "").trim();
      if (!id) continue;
      const name = String(
        record.name ??
          record.available_name ??
          record.email ??
          `Agent ${index + 1}`,
      ).trim();
      map.set(id, name);
    }
    return map;
  }, [agentsData]);

  const statusLabels = useMemo(
    () =>
      filterDraft.status.map(
        (value) =>
          CHAT_CONVERSATION_STATUS_OPTIONS.find(
            (option) => option.value === value,
          )?.label ?? value,
      ),
    [filterDraft.status],
  );

  const assigneeLabel = filterDraft.assigneeId
    ? (assigneeNameById.get(filterDraft.assigneeId) ?? filterDraft.assigneeId)
    : null;

  const inboxLabel = filterDraft.inboxId
    ? (inboxNameById.get(filterDraft.inboxId) ?? `Inbox #${filterDraft.inboxId}`)
    : null;

  const labelItems = filterDraft.labels.map(
    (value) => labelTitleByValue.get(value) ?? value,
  );

  const hasConditions =
    countActiveChatConversationFilters(filterDraft) > 0;

  if (!hasConditions) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có điều kiện lọc nào được chọn.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filterDraft.status.length > 0 && (
        <FilterPreviewRow label="Trạng thái">
          {statusLabels.map((label) => (
            <PreviewBadge key={label}>{label}</PreviewBadge>
          ))}
        </FilterPreviewRow>
      )}

      {assigneeLabel && (
        <FilterPreviewRow label="Người phụ trách">
          <PreviewBadge>{assigneeLabel}</PreviewBadge>
        </FilterPreviewRow>
      )}

      {inboxLabel && (
        <FilterPreviewRow label="Inbox">
          <PreviewBadge>{inboxLabel}</PreviewBadge>
        </FilterPreviewRow>
      )}

      {labelItems.length > 0 && (
        <FilterPreviewRow label="Nhãn">
          {labelItems.map((label) => (
            <PreviewBadge key={label}>{label}</PreviewBadge>
          ))}
        </FilterPreviewRow>
      )}
    </div>
  );
}
