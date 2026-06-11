"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useListTenantConversations } from "@/hooks/chatwoot/use-chatwoot";
import { useChatwootRealtime } from "@/hooks/chatwoot/use-chatwoot-realtime";
import { useChatUnreadStore } from "@/features/chats/utils/chat-unread-store";
import type { ListTenantConversationsResponse } from "@/services/chatwoot/interface";

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

const extractPayloadFromPage = (
  page: ListTenantConversationsResponse | undefined,
): Record<string, unknown>[] | null => {
  const data = page?.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;
  const nested = coerceConversationRecords(
    (data.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nested) return nested;
  const chatwoot = data.chatwoot as Record<string, unknown> | undefined;
  const chatwootPayload = coerceConversationRecords(chatwoot?.payload);
  if (chatwootPayload) return chatwootPayload;
  const chatwootData = chatwoot?.data as Record<string, unknown> | undefined;
  return coerceConversationRecords(chatwootData?.payload);
};

const mapUnreadEntries = (records: Record<string, unknown>[]) =>
  records
    .map((conversation) => {
      const rawInboxId = conversation.inbox_id;
      const inboxId =
        typeof rawInboxId === "number"
          ? rawInboxId
          : typeof rawInboxId === "string"
            ? Number(rawInboxId)
            : Number.NaN;

      return {
        id: String(conversation.id ?? ""),
        unreadCount:
          typeof conversation.unread_count === "number"
            ? conversation.unread_count
            : 0,
        inboxId: Number.isFinite(inboxId) ? inboxId : undefined,
      };
    })
    .filter((item) => item.id.length > 0);

const buildUnreadSignature = (
  items: Array<{
    id: string;
    unreadCount: number;
    inboxId?: number;
  }>,
) =>
  items
    .map((item) => `${item.id}:${item.unreadCount}:${item.inboxId ?? ""}`)
    .sort()
    .join("|");

/** Đồng bộ unread toàn app: API + socket real-time */
export function ChatUnreadSync() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversation_id");
  const mergeUnreadEntries = useChatUnreadStore(
    (state) => state.mergeUnreadEntries,
  );
  const lastMergedSignatureRef = useRef("");

  const { data: conversationsList } = useListTenantConversations(tenantId, {
    status: "open",
    sort_by: "last_activity_at_desc",
    page: 1,
  });

  const unreadEntries = useMemo(() => {
    const pages = conversationsList?.pages ?? [];
    const merged: Record<string, unknown>[] = [];
    for (const page of pages) {
      const payload = extractPayloadFromPage(page);
      if (payload) merged.push(...payload);
    }
    return mapUnreadEntries(merged);
  }, [conversationsList?.pages]);

  const unreadSignature = useMemo(
    () => buildUnreadSignature(unreadEntries),
    [unreadEntries],
  );

  useEffect(() => {
    if (!tenantId || !unreadSignature) return;
    if (lastMergedSignatureRef.current === unreadSignature) return;

    lastMergedSignatureRef.current = unreadSignature;
    mergeUnreadEntries(unreadEntries);
  }, [mergeUnreadEntries, tenantId, unreadEntries, unreadSignature]);

  useChatwootRealtime({
    tenantId,
    selectedConversationId,
  });

  return null;
}
