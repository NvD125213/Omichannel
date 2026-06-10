export interface ParsedChatwootRealtimeEvent {
  event: string;
  payload: Record<string, unknown>;
}

const EVENT_ALIASES: Record<string, string> = {
  "message.created": "message_created",
  "message.updated": "message_updated",
  message_created: "message_created",
  "conversation.created": "conversation_updated",
  "conversation.updated": "conversation_updated",
  conversation_updated: "conversation_updated",
  "conversation.status_changed": "conversation_status_changed",
  conversation_status_changed: "conversation_status_changed",
};

export const normalizeChatwootEventName = (event: string): string =>
  EVENT_ALIASES[event] ?? event.replace(/\./g, "_");

/**
 * Chuẩn hóa nhiều dạng payload socket từ backend:
 * - Legacy: `{ event, payload }`
 * - Envelope: `{ message: { event: "message.created", data: {...} } }`
 * - Raw message: `{ id, conversation_id, content, ... }`
 */
export function parseChatwootRealtimePayload(
  raw: unknown,
): ParsedChatwootRealtimeEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;

  if (
    typeof root.event === "string" &&
    root.payload &&
    typeof root.payload === "object" &&
    !Array.isArray(root.payload)
  ) {
    return {
      event: normalizeChatwootEventName(root.event),
      payload: root.payload as Record<string, unknown>,
    };
  }

  for (const key of ["message", "conversation", "contact", "notification"]) {
    const envelope = root[key];
    if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
      continue;
    }
    const box = envelope as Record<string, unknown>;
    const event = typeof box.event === "string" ? box.event : "";
    const data = box.data;
    if (!event || !data || typeof data !== "object" || Array.isArray(data)) {
      continue;
    }
    return {
      event: normalizeChatwootEventName(event),
      payload: data as Record<string, unknown>,
    };
  }

  if (
    (typeof root.id === "number" || typeof root.id === "string") &&
    (typeof root.conversation_id === "number" ||
      typeof root.conversation_id === "string")
  ) {
    return { event: "message_created", payload: root };
  }

  if (typeof root.id === "number" || typeof root.id === "string") {
    if (typeof root.status === "string") {
      return {
        event: "conversation_status_changed",
        payload: root,
      };
    }
    if (root.assignee || root.meta) {
      return {
        event: "conversation_updated",
        payload: root,
      };
    }
  }

  return null;
}
