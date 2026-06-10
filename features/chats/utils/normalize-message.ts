import { coerceToDate } from "@/helpers/format-message-time";
import type { ChatMessage } from "./types";

export const normalizeMessage = (
  message: Record<string, unknown>,
  currentConversationId: string,
  syntheticSeq?: number,
): ChatMessage => {
  const sender = (message.sender ?? {}) as Record<string, unknown>;
  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];
  return {
    id:
      typeof message.id === "number" || typeof message.id === "string"
        ? String(message.id)
        : `msg-${currentConversationId}-noid-${syntheticSeq ?? 0}-${String(message.created_at ?? message.updated_at ?? "")}`,
    content:
      (typeof message.content === "string" && message.content) ||
      (typeof message.processed_message_content === "string" &&
        message.processed_message_content) ||
      "",
    created_at: String(coerceToDate(message.created_at ?? message.updated_at)),
    updated_at: String(coerceToDate(message.updated_at ?? message.created_at)),
    conversation_id:
      typeof message.conversation_id === "number" ||
      typeof message.conversation_id === "string"
        ? String(message.conversation_id)
        : currentConversationId,
    message_type:
      typeof message.message_type === "number"
        ? message.message_type
        : undefined,
    content_attributes:
      message.content_attributes &&
      typeof message.content_attributes === "object" &&
      !Array.isArray(message.content_attributes)
        ? (message.content_attributes as Record<string, unknown>)
        : undefined,
    sender_id:
      typeof message.sender_id === "number" ||
      typeof message.sender_id === "string"
        ? String(message.sender_id)
        : typeof sender.id === "number" || typeof sender.id === "string"
          ? String(sender.id)
          : undefined,
    sender: {
      id: 1,
      name: typeof sender.name === "string" ? sender.name : undefined,
      available_name:
        typeof sender.available_name === "string"
          ? sender.available_name
          : undefined,
      avatar_url:
        typeof sender.avatar_url === "string" ? sender.avatar_url : undefined,
      type: typeof sender.type === "string" ? sender.type : undefined,
      availability_status:
        typeof sender.availability_status === "string"
          ? sender.availability_status
          : undefined,
      thumbnail:
        typeof sender.thumbnail === "string" ? sender.thumbnail : undefined,
    },
    attachments: attachments.map((attachment) => {
      const item =
        attachment && typeof attachment === "object"
          ? (attachment as Record<string, unknown>)
          : {};
      return {
        id:
          typeof item.id === "number" || typeof item.id === "string"
            ? String(item.id)
            : undefined,
        message_id:
          typeof item.message_id === "number" ||
          typeof item.message_id === "string"
            ? String(item.message_id)
            : undefined,
        file_type:
          typeof item.file_type === "string" ? item.file_type : undefined,
        extension:
          typeof item.extension === "string" ? item.extension : undefined,
        data_url: typeof item.data_url === "string" ? item.data_url : undefined,
        thumb_url:
          typeof item.thumb_url === "string" ? item.thumb_url : undefined,
        file_size:
          typeof item.file_size === "number" ? item.file_size : undefined,
        width: typeof item.width === "number" ? item.width : undefined,
        height: typeof item.height === "number" ? item.height : undefined,
      };
    }) as ChatMessage["attachments"],
  };
};

export const getConversationIdFromPayload = (
  payload: Record<string, unknown>,
): string | null => {
  const conversation = payload.conversation as
    | Record<string, unknown>
    | undefined;
  if (conversation) {
    if (
      typeof conversation.id === "number" ||
      typeof conversation.id === "string"
    ) {
      return String(conversation.id);
    }
  }
  if (
    typeof payload.conversation_id === "number" ||
    typeof payload.conversation_id === "string"
  ) {
    return String(payload.conversation_id);
  }
  return null;
};

export const isActivityMessage = (payload: Record<string, unknown>) =>
  payload.message_type === 2;
