import { getTime } from "@/helpers/format-message-time";
import type { ChatConversation } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Lấy mảng conversations từ response search messaging. */
export function extractMessagingSearchConversations(
  response: unknown,
): Record<string, unknown>[] {
  if (!response || typeof response !== "object") return [];
  const root = response as Record<string, unknown>;
  const data = asRecord(root.data);

  const candidates: unknown[] = [
    asRecord(data?.messaging)?.payload,
    asRecord(asRecord(data?.messaging)?.payload)?.conversations,
    asRecord(data?.payload)?.conversations,
    data?.conversations,
    asRecord(data?.data)?.conversations,
    root.conversations,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
    }
    const record = asRecord(candidate);
    if (record && Array.isArray(record.conversations)) {
      return record.conversations.filter(
        (item): item is Record<string, unknown> =>
          !!item && typeof item === "object" && !Array.isArray(item),
      );
    }
  }

  return [];
}

/** Map item search conversations → ChatConversation (UI list). */
export function normalizeSearchConversation(
  raw: Record<string, unknown>,
): ChatConversation {
  const contact = asRecord(raw.contact) ?? {};
  const message = asRecord(raw.message) ?? {};
  const messageSender = asRecord(message.sender) ?? {};
  const inbox = asRecord(raw.inbox) ?? {};
  const agent = asRecord(raw.agent) ?? {};

  const conversationId =
    raw.id != null && String(raw.id).trim()
      ? String(raw.id)
      : message.conversation_id != null
        ? String(message.conversation_id)
        : `search-${Date.now()}`;

  const contactId =
    contact.id != null
      ? String(contact.id)
      : messageSender.id != null
        ? String(messageSender.id)
        : "unknown-user";

  const name =
    (typeof contact.name === "string" && contact.name.trim()) ||
    (typeof messageSender.name === "string" && messageSender.name.trim()) ||
    `Cuộc trò chuyện #${conversationId}`;

  const avatar =
    (typeof messageSender.thumbnail === "string" && messageSender.thumbnail) ||
    (typeof contact.thumbnail === "string" && contact.thumbnail) ||
    "";

  const content =
    (typeof message.content === "string" && message.content.trim()) ||
    "Chưa có tin nhắn";

  const timestampMs = getTime(
    message.created_at ??
      contact.last_activity_at ??
      raw.created_at ??
      Date.now(),
  );

  const inboxIdRaw = inbox.id ?? message.inbox_id;
  const inboxId =
    typeof inboxIdRaw === "number"
      ? inboxIdRaw
      : typeof inboxIdRaw === "string"
        ? Number(inboxIdRaw)
        : Number.NaN;

  const channel =
    (typeof inbox.name === "string" && inbox.name.trim()) ||
    (typeof inbox.channel_type === "string" && inbox.channel_type.trim()) ||
    undefined;

  return {
    id: conversationId,
    type: "direct",
    participants: [contactId],
    name,
    avatar,
    labels: [],
    lastMessage: {
      id: message.id != null ? String(message.id) : `last-${conversationId}`,
      content,
      timestamp: String(timestampMs || Date.now()),
      senderId: contactId,
    },
    unreadCount: 0,
    isPinned: false,
    isMuted: false,
    status: "open",
    inboxId: Number.isFinite(inboxId) ? inboxId : undefined,
    meta: {
      sender: {
        id: contactId,
        name:
          typeof contact.name === "string"
            ? contact.name
            : typeof messageSender.name === "string"
              ? messageSender.name
              : undefined,
        email:
          typeof contact.email === "string"
            ? contact.email
            : typeof messageSender.email === "string"
              ? messageSender.email
              : undefined,
        phoneNumber:
          typeof contact.phone_number === "string"
            ? contact.phone_number
            : typeof messageSender.phone_number === "string"
              ? messageSender.phone_number
              : undefined,
        identifier:
          typeof contact.identifier === "string"
            ? contact.identifier
            : typeof messageSender.identifier === "string"
              ? messageSender.identifier
              : undefined,
        thumbnail: avatar || undefined,
      },
      channel,
      assignee:
        agent.id != null || agent.name != null || agent.email != null
          ? {
              id: agent.id != null ? String(agent.id) : undefined,
              availableName:
                typeof agent.available_name === "string"
                  ? agent.available_name
                  : undefined,
              name: typeof agent.name === "string" ? agent.name : undefined,
              email: typeof agent.email === "string" ? agent.email : undefined,
              role: typeof agent.role === "string" ? agent.role : undefined,
            }
          : undefined,
    },
  };
}
