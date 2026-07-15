"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/socket-context";
import {
  applyConversationStatusToListCache,
  applyConversationUpdatedToListCache,
  applyMessageCreatedToConversationList,
  appendMessageToConversationMessagesCache,
  clearConversationUnreadInListCache,
} from "@/features/chats/utils/chatwoot-realtime-cache";
import { parseChatwootRealtimePayload } from "@/features/chats/utils/chatwoot-realtime-payload";
import {
  getConversationIdFromPayload,
  normalizeMessage,
} from "@/features/chats/utils/normalize-message";
import { useChatStore } from "@/features/chats/utils/use-chat";
import { useChatUnreadStore } from "@/features/chats/utils/chat-unread-store";
import { chatwootService } from "@/services/chatwoot/service";

const LAST_SEEN_DEBOUNCE_MS = 400;

interface UseChatwootRealtimeOptions {
  tenantId: string;
  selectedConversationId: string | null;
}

export function useChatwootRealtime({
  tenantId,
  selectedConversationId,
}: UseChatwootRealtimeOptions) {
  const { socket, isAuthenticated } = useSocket();
  const queryClient = useQueryClient();
  const upsertMessage = useChatStore((state) => state.upsertMessage);
  const patchConversation = useChatStore((state) => state.patchConversation);
  const removeConversation = useChatStore((state) => state.removeConversation);
  const markAsRead = useChatStore((state) => state.markAsRead);
  const incrementUnread = useChatUnreadStore((state) => state.incrementUnread);
  const clearUnread = useChatUnreadStore((state) => state.clearUnread);

  const selectedConversationRef = useRef(selectedConversationId);
  const lastSeenTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId;
  }, [selectedConversationId]);

  useEffect(() => {
    const timers = lastSeenTimersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  useEffect(() => {
    if (!socket || !tenantId || !isAuthenticated) return;

    const scheduleConversationLastSeen = (conversationId: string) => {
      const timers = lastSeenTimersRef.current;
      const existing = timers.get(conversationId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        timers.delete(conversationId);
        void chatwootService
          .updateTenantConversationLastSeen(tenantId, conversationId)
          .catch(() => {
            // Đã clear unread cục bộ; last_seen thất bại không chặn luồng realtime.
          });
      }, LAST_SEEN_DEBOUNCE_MS);

      timers.set(conversationId, timer);
    };

    if (process.env.NODE_ENV === "development") {
      console.log("[chatwoot-realtime] listening chatwoot_event", { tenantId });
    }

    const handleMessageCreated = (messagePayload: Record<string, unknown>) => {
      const conversationId = getConversationIdFromPayload(messagePayload);
      if (!conversationId) return;

      const isActiveConversation =
        selectedConversationRef.current === conversationId;

      if (isActiveConversation) {
        const normalized = normalizeMessage(messagePayload, conversationId);
        upsertMessage(conversationId, normalized);
        markAsRead(conversationId);
        clearUnread(conversationId);
        clearConversationUnreadInListCache(
          queryClient,
          tenantId,
          conversationId,
        );
        scheduleConversationLastSeen(conversationId);
      } else {
        const conversation = messagePayload.conversation as
          | Record<string, unknown>
          | undefined;
        const inbox = messagePayload.inbox as
          | Record<string, unknown>
          | undefined;
        const rawInboxId =
          messagePayload.inbox_id ?? conversation?.inbox_id ?? inbox?.id;
        const inboxId =
          typeof rawInboxId === "number"
            ? rawInboxId
            : typeof rawInboxId === "string"
              ? Number(rawInboxId)
              : Number.NaN;
        incrementUnread(
          conversationId,
          Number.isFinite(inboxId) ? inboxId : undefined,
        );
      }

      appendMessageToConversationMessagesCache(
        queryClient,
        tenantId,
        conversationId,
        messagePayload,
      );

      applyMessageCreatedToConversationList(
        queryClient,
        tenantId,
        conversationId,
        messagePayload,
        isActiveConversation,
      );

      patchConversation(conversationId, (conversation) => {
        const senderId =
          typeof messagePayload.sender_id === "number" ||
          typeof messagePayload.sender_id === "string"
            ? String(messagePayload.sender_id)
            : typeof (
                  messagePayload.sender as Record<string, unknown> | undefined
                )?.id === "number" ||
                typeof (
                  messagePayload.sender as Record<string, unknown> | undefined
                )?.id === "string"
              ? String((messagePayload.sender as Record<string, unknown>).id)
              : conversation.lastMessage.senderId;

        const content =
          (typeof messagePayload.content === "string" &&
            messagePayload.content) ||
          (typeof messagePayload.processed_message_content === "string" &&
            messagePayload.processed_message_content) ||
          conversation.lastMessage.content;

        return {
          ...conversation,
          lastMessage: {
            id: String(messagePayload.id ?? conversation.lastMessage.id),
            content,
            timestamp: String(
              messagePayload.created_at ??
                messagePayload.updated_at ??
                conversation.lastMessage.timestamp,
            ),
            senderId,
          },
          unreadCount: isActiveConversation ? 0 : conversation.unreadCount + 1,
        };
      });
    };

    const handleConversationStatusChanged = (
      statusPayload: Record<string, unknown>,
    ) => {
      const conversationId = String(statusPayload.id ?? "");
      const newStatus = String(statusPayload.status ?? "");
      if (!conversationId || !newStatus) return;

      applyConversationStatusToListCache(
        queryClient,
        tenantId,
        conversationId,
        newStatus,
      );

      if (newStatus === "resolved") {
        removeConversation(conversationId);
      }
    };

    const handleConversationUpdated = (payload: Record<string, unknown>) => {
      const conversationId = String(payload.id ?? "");
      if (!conversationId) return;

      applyConversationUpdatedToListCache(
        queryClient,
        tenantId,
        conversationId,
        payload,
      );

      const assignee = payload.assignee as Record<string, unknown> | undefined;

      patchConversation(conversationId, (conversation) => ({
        ...conversation,
        meta: {
          ...conversation.meta,
          assignee: assignee
            ? {
                id:
                  typeof assignee.id === "number" ||
                  typeof assignee.id === "string"
                    ? String(assignee.id)
                    : conversation.meta?.assignee?.id,
                availableName:
                  typeof assignee.available_name === "string"
                    ? assignee.available_name
                    : conversation.meta?.assignee?.availableName,
                name:
                  typeof assignee.name === "string"
                    ? assignee.name
                    : conversation.meta?.assignee?.name,
                email:
                  typeof assignee.email === "string"
                    ? assignee.email
                    : conversation.meta?.assignee?.email,
                role:
                  typeof assignee.role === "string"
                    ? assignee.role
                    : conversation.meta?.assignee?.role,
                thumbnail:
                  typeof assignee.thumbnail === "string"
                    ? assignee.thumbnail
                    : conversation.meta?.assignee?.thumbnail,
                availabilityStatus:
                  typeof assignee.availability_status === "string"
                    ? assignee.availability_status
                    : conversation.meta?.assignee?.availabilityStatus,
              }
            : conversation.meta?.assignee,
        },
      }));
    };

    const dispatchParsed = (raw: unknown) => {
      const parsed = parseChatwootRealtimePayload(raw);
      if (!parsed) {
        if (process.env.NODE_ENV === "development") {
          console.warn("[chatwoot-realtime] unparseable payload", raw);
        }
        return;
      }

      const { event, payload: record } = parsed;

      if (process.env.NODE_ENV === "development") {
        console.log(`[chatwoot-realtime] ${event}`, record);
      }

      switch (event) {
        case "message_created":
          handleMessageCreated(record);
          break;
        case "conversation_status_changed":
          handleConversationStatusChanged(record);
          break;
        case "conversation_updated":
          handleConversationUpdated(record);
          break;
        default:
          break;
      }
    };

    const onMissedNotifications = (data: unknown) => {
      if (!Array.isArray(data)) return;
      for (const item of data) {
        dispatchParsed(item);
      }
    };

    const socketEventNames = [
      "chatwoot_event",
      "message",
      "conversation",
    ] as const;

    for (const eventName of socketEventNames) {
      socket.on(eventName, dispatchParsed);
    }
    socket.on("missed_notifications", onMissedNotifications);

    return () => {
      for (const eventName of socketEventNames) {
        socket.off(eventName, dispatchParsed);
      }
      socket.off("missed_notifications", onMissedNotifications);
    };
  }, [
    socket,
    isAuthenticated,
    tenantId,
    queryClient,
    upsertMessage,
    patchConversation,
    removeConversation,
    incrementUnread,
    clearUnread,
    markAsRead,
  ]);
}
