"use client";

import { create } from "zustand";
import type { ChatConversation } from "./types";

export interface ConversationUnreadEntry {
  unreadCount: number;
  inboxId?: number;
}

interface ChatUnreadState {
  entries: Record<string, ConversationUnreadEntry>;
  totalUnread: number;
  unreadByInboxId: Record<string, number>;
}

interface ChatUnreadActions {
  reset: () => void;
  mergeFromConversations: (conversations: ChatConversation[]) => void;
  mergeUnreadEntries: (
    items: Array<{
      id: string;
      unreadCount: number;
      inboxId?: number;
    }>,
  ) => void;
  incrementUnread: (
    conversationId: string,
    inboxId?: number,
    by?: number,
  ) => void;
  clearUnread: (conversationId: string) => void;
}

const recomputeFromEntries = (
  entries: Record<string, ConversationUnreadEntry>,
) => {
  const unreadByInboxId: Record<string, number> = {};
  let totalUnread = 0;

  for (const entry of Object.values(entries)) {
    if (entry.unreadCount <= 0) continue;
    totalUnread += entry.unreadCount;
    const inboxKey =
      entry.inboxId !== undefined ? String(entry.inboxId) : "unknown";
    unreadByInboxId[inboxKey] =
      (unreadByInboxId[inboxKey] ?? 0) + entry.unreadCount;
  }

  return { totalUnread, unreadByInboxId };
};

const entriesAreEqual = (
  prev: Record<string, ConversationUnreadEntry>,
  next: Record<string, ConversationUnreadEntry>,
) => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of nextKeys) {
    const prevEntry = prev[key];
    const nextEntry = next[key];
    if (
      prevEntry?.unreadCount !== nextEntry?.unreadCount ||
      prevEntry?.inboxId !== nextEntry?.inboxId
    ) {
      return false;
    }
  }

  return true;
};

const inboxMapsAreEqual = (
  prev: Record<string, number>,
  next: Record<string, number>,
) => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of nextKeys) {
    if (prev[key] !== next[key]) return false;
  }

  return true;
};

const commitEntries = (
  set: (
    partial:
      | Partial<ChatUnreadState>
      | ((state: ChatUnreadState) => Partial<ChatUnreadState>),
  ) => void,
  get: () => ChatUnreadState & ChatUnreadActions,
  nextEntries: Record<string, ConversationUnreadEntry>,
) => {
  const current = get();
  if (entriesAreEqual(current.entries, nextEntries)) return;

  const stats = recomputeFromEntries(nextEntries);
  const unreadByInboxId = inboxMapsAreEqual(
    current.unreadByInboxId,
    stats.unreadByInboxId,
  )
    ? current.unreadByInboxId
    : stats.unreadByInboxId;

  set({
    entries: nextEntries,
    totalUnread: stats.totalUnread,
    unreadByInboxId,
  });
};

export const useChatUnreadStore = create<ChatUnreadState & ChatUnreadActions>(
  (set, get) => ({
    entries: {},
    totalUnread: 0,
    unreadByInboxId: {},

    reset: () =>
      set({
        entries: {},
        totalUnread: 0,
        unreadByInboxId: {},
      }),

    mergeFromConversations: (conversations) => {
      const next = { ...get().entries };
      for (const conv of conversations) {
        next[conv.id] = {
          unreadCount: conv.unreadCount,
          inboxId: conv.inboxId,
        };
      }
      commitEntries(set, get, next);
    },

    mergeUnreadEntries: (items) => {
      const next = { ...get().entries };
      for (const item of items) {
        if (!item.id) continue;
        next[item.id] = {
          unreadCount: item.unreadCount,
          inboxId: item.inboxId,
        };
      }
      commitEntries(set, get, next);
    },

    incrementUnread: (conversationId, inboxId, by = 1) => {
      const prev = get().entries[conversationId];
      const next = {
        ...get().entries,
        [conversationId]: {
          unreadCount: (prev?.unreadCount ?? 0) + by,
          inboxId: inboxId ?? prev?.inboxId,
        },
      };
      commitEntries(set, get, next);
    },

    clearUnread: (conversationId) => {
      const prev = get().entries[conversationId];
      if (!prev || prev.unreadCount <= 0) return;
      const next = {
        ...get().entries,
        [conversationId]: { ...prev, unreadCount: 0 },
      };
      commitEntries(set, get, next);
    },
  }),
);

export const useTotalUnread = () =>
  useChatUnreadStore((state) => state.totalUnread);

export const useUnreadByInboxId = () =>
  useChatUnreadStore((state) => state.unreadByInboxId);

export const formatUnreadBadgeCount = (count: number) =>
  count > 99 ? "99+" : String(count);

export const getInboxUnreadCount = (
  unreadByInboxId: Record<string, number>,
  inboxId: number,
) => unreadByInboxId[String(inboxId)] ?? 0;
