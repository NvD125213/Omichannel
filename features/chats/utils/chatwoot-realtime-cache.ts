import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { chatwootOmniKeys } from "@/hooks/chatwoot/use-chatwoot";
import type {
  ListTenantConversationMessagesResponse,
  ListTenantConversationsResponse,
} from "@/services/chatwoot/interface";
import { getMessagingEnvelope } from "./messaging-envelope";
import { isActivityMessage } from "./normalize-message";

const createMessagesCachePage = (
  payload: Record<string, unknown>[],
): ListTenantConversationMessagesResponse => ({
  status: "success",
  status_code: 200,
  message: "",
  data: { payload },
});

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  return value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
};

const extractPayloadFromConversationPage = (
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
  const messaging = getMessagingEnvelope(data);
  const messagingPayload = coerceConversationRecords(messaging?.payload);
  if (messagingPayload) return messagingPayload;
  const messagingData = messaging?.data as Record<string, unknown> | undefined;
  const messagingNested = coerceConversationRecords(messagingData?.payload);
  if (messagingNested) return messagingNested;
  return null;
};

const setPayloadOnConversationPage = (
  page: ListTenantConversationsResponse,
  payload: Record<string, unknown>[],
): ListTenantConversationsResponse => {
  const data = (page.data ?? {}) as Record<string, unknown>;
  if (Array.isArray(data.payload)) {
    return {
      ...page,
      data: { ...data, payload } as ListTenantConversationsResponse["data"],
    };
  }
  const nested = data.data as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.payload)) {
    return {
      ...page,
      data: {
        ...data,
        data: { ...nested, payload },
      } as ListTenantConversationsResponse["data"],
    };
  }
  const chatwoot = getMessagingEnvelope(data);
  if (chatwoot && Array.isArray(chatwoot.payload)) {
    return {
      ...page,
      data: {
        ...data,
        messaging: { ...chatwoot, payload },
      } as ListTenantConversationsResponse["data"],
    };
  }
  const chatwootData = chatwoot?.data as Record<string, unknown> | undefined;
  if (chatwootData && Array.isArray(chatwootData.payload)) {
    return {
      ...page,
      data: {
        ...data,
        messaging: { ...chatwoot, data: { ...chatwootData, payload } },
      } as ListTenantConversationsResponse["data"],
    };
  }
  return {
    ...page,
    data: { ...data, payload } as ListTenantConversationsResponse["data"],
  };
};

const extractMessagePayloadFromPage = (
  page: ListTenantConversationMessagesResponse | undefined,
): Record<string, unknown>[] | null => {
  const data = page?.data as Record<string, unknown> | undefined;
  if (!data) return null;
  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;
  const nested = coerceConversationRecords(
    (data.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nested) return nested;
  const messaging = getMessagingEnvelope(data);
  const messagingDirect = coerceConversationRecords(messaging?.payload);
  if (messagingDirect) return messagingDirect;
  const messagingData = messaging?.data as Record<string, unknown> | undefined;
  const messagingNested = coerceConversationRecords(messagingData?.payload);
  if (messagingNested) return messagingNested;
  const messages = coerceConversationRecords(data.messages);
  if (messages) return messages;
  return null;
};

const setPayloadOnMessagePage = (
  page: ListTenantConversationMessagesResponse,
  payload: Record<string, unknown>[],
): ListTenantConversationMessagesResponse => {
  const data = (page.data ?? {}) as Record<string, unknown>;
  if (Array.isArray(data.payload)) {
    return {
      ...page,
      data: {
        ...data,
        payload,
      } as ListTenantConversationMessagesResponse["data"],
    };
  }
  const nested = data.data as Record<string, unknown> | undefined;
  if (nested && Array.isArray(nested.payload)) {
    return {
      ...page,
      data: {
        ...data,
        data: { ...nested, payload },
      } as ListTenantConversationMessagesResponse["data"],
    };
  }
  const chatwoot = getMessagingEnvelope(data);
  if (chatwoot && Array.isArray(chatwoot.payload)) {
    return {
      ...page,
      data: {
        ...data,
        messaging: { ...chatwoot, payload },
      } as ListTenantConversationMessagesResponse["data"],
    };
  }
  const chatwootData = chatwoot?.data as Record<string, unknown> | undefined;
  if (chatwootData && Array.isArray(chatwootData.payload)) {
    return {
      ...page,
      data: {
        ...data,
        messaging: { ...chatwoot, data: { ...chatwootData, payload } },
      } as ListTenantConversationMessagesResponse["data"],
    };
  }
  return {
    ...page,
    data: {
      ...data,
      payload,
    } as ListTenantConversationMessagesResponse["data"],
  };
};

const getConversationRecordId = (conversation: Record<string, unknown>) =>
  String(conversation.id ?? "");

export function appendMessageToConversationMessagesCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  rawMessage: Record<string, unknown>,
) {
  const messageId = String(rawMessage.id ?? "");
  if (!messageId) return;

  queryClient.setQueriesData<
    InfiniteData<ListTenantConversationMessagesResponse>
  >(
    {
      queryKey: chatwootOmniKeys.tenantConversationMessages(
        tenantId,
        conversationId,
      ),
    },
    (old) => {
      if (!old?.pages?.length) {
        return {
          pages: [createMessagesCachePage([rawMessage])],
          pageParams: [undefined],
        };
      }

      const pages = [...old.pages];
      const lastIndex = pages.length - 1;
      const lastPage = pages[lastIndex];
      const payload = extractMessagePayloadFromPage(lastPage) ?? [];

      if (payload.some((item) => String(item.id ?? "") === messageId)) {
        return old;
      }

      pages[lastIndex] = setPayloadOnMessagePage(lastPage, [
        ...payload,
        rawMessage,
      ]);

      return { ...old, pages };
    },
  );
}

export function updateConversationInListCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  updater: (conversation: Record<string, unknown>) => Record<string, unknown>,
  options?: { moveToTop?: boolean; remove?: boolean },
) {
  queryClient.setQueriesData<InfiniteData<ListTenantConversationsResponse>>(
    { queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId) },
    (old) => {
      if (!old?.pages?.length) return old;

      let updatedConversation: Record<string, unknown> | null = null;
      const nextPages = old.pages.map((page, pageIndex) => {
        const payload = extractPayloadFromConversationPage(page);
        if (!payload) return page;

        let found = false;
        const nextPayload = payload
          .map((conversation) => {
            if (getConversationRecordId(conversation) !== conversationId) {
              return conversation;
            }
            found = true;
            if (options?.remove) return null;
            updatedConversation = updater(conversation);
            return updatedConversation;
          })
          .filter((item): item is Record<string, unknown> => item !== null);

        if (
          !found ||
          !options?.moveToTop ||
          pageIndex !== 0 ||
          options.remove
        ) {
          return setPayloadOnConversationPage(page, nextPayload);
        }

        const withoutTarget = nextPayload.filter(
          (item) => getConversationRecordId(item) !== conversationId,
        );
        const reordered = updatedConversation
          ? [updatedConversation, ...withoutTarget]
          : nextPayload;

        return setPayloadOnConversationPage(page, reordered);
      });

      return { ...old, pages: nextPages };
    },
  );
}

export function clearConversationUnreadInListCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
) {
  updateConversationInListCache(
    queryClient,
    tenantId,
    conversationId,
    (conversation) => ({ ...conversation, unread_count: 0 }),
  );
}

const buildConversationRecordFromMessageCreated = (
  conversationId: string,
  rawMessage: Record<string, unknown>,
  isActiveConversation: boolean,
): Record<string, unknown> => {
  const embedded =
    rawMessage.conversation &&
    typeof rawMessage.conversation === "object" &&
    !Array.isArray(rawMessage.conversation)
      ? ({ ...(rawMessage.conversation as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : null;

  const inbox =
    rawMessage.inbox &&
    typeof rawMessage.inbox === "object" &&
    !Array.isArray(rawMessage.inbox)
      ? (rawMessage.inbox as Record<string, unknown>)
      : null;

  const activityAt =
    rawMessage.created_at ??
    rawMessage.updated_at ??
    embedded?.last_activity_at ??
    embedded?.timestamp ??
    new Date().toISOString();

  const numericId = Number(conversationId);
  const conversationIdentity = Number.isFinite(numericId)
    ? numericId
    : conversationId;

  const base: Record<string, unknown> = embedded
    ? { ...embedded }
    : {
        id: conversationIdentity,
        status: "open",
        meta: {
          sender:
            rawMessage.sender &&
            typeof rawMessage.sender === "object" &&
            !Array.isArray(rawMessage.sender)
              ? rawMessage.sender
              : {},
        },
      };

  if (base.id === undefined || base.id === null || base.id === "") {
    base.id = conversationIdentity;
  }

  if (
    base.inbox_id == null &&
    (typeof rawMessage.inbox_id === "number" ||
      typeof rawMessage.inbox_id === "string")
  ) {
    base.inbox_id = rawMessage.inbox_id;
  } else if (base.inbox_id == null && inbox?.id != null) {
    base.inbox_id = inbox.id;
  }

  const next: Record<string, unknown> = {
    ...base,
    last_activity_at: activityAt,
    timestamp: activityAt,
    updated_at: activityAt,
  };

  if (!isActivityMessage(rawMessage)) {
    next.last_non_activity_message = rawMessage;
  }

  if (isActiveConversation) {
    next.unread_count = 0;
  } else if (typeof embedded?.unread_count === "number") {
    next.unread_count = embedded.unread_count;
  } else {
    next.unread_count = 1;
  }

  return next;
};

const patchConversationRecordForMessageCreated = (
  conversation: Record<string, unknown>,
  rawMessage: Record<string, unknown>,
  isActiveConversation: boolean,
): Record<string, unknown> => {
  const activityAt =
    rawMessage.created_at ??
    rawMessage.updated_at ??
    conversation.last_activity_at ??
    new Date().toISOString();

  const next: Record<string, unknown> = {
    ...conversation,
    last_activity_at: activityAt,
    timestamp: activityAt,
    updated_at: activityAt,
  };

  if (!isActivityMessage(rawMessage)) {
    next.last_non_activity_message = rawMessage;
  }

  if (isActiveConversation) {
    next.unread_count = 0;
  } else {
    const currentUnread =
      typeof conversation.unread_count === "number"
        ? conversation.unread_count
        : 0;
    next.unread_count = currentUnread + 1;
  }

  return next;
};

/**
 * Cập nhật preview/unread và đưa hội thoại lên đầu list.
 * Nếu conversation chưa có trong cache thì insert từ `payload.conversation`
 * để đồng bộ với unread store (ChatUnreadNotificationsMenu).
 */
export function applyMessageCreatedToConversationList(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  rawMessage: Record<string, unknown>,
  isActiveConversation: boolean,
) {
  queryClient.setQueriesData<InfiniteData<ListTenantConversationsResponse>>(
    { queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId) },
    (old) => {
      if (!old?.pages?.length) return old;

      let existing: Record<string, unknown> | null = null;

      const pagesWithoutTarget = old.pages.map((page) => {
        const payload = extractPayloadFromConversationPage(page);
        if (!payload) return page;

        const nextPayload: Record<string, unknown>[] = [];
        for (const conversation of payload) {
          if (getConversationRecordId(conversation) === conversationId) {
            existing = conversation;
            continue;
          }
          nextPayload.push(conversation);
        }

        return setPayloadOnConversationPage(page, nextPayload);
      });

      const nextConversation = existing
        ? patchConversationRecordForMessageCreated(
            existing,
            rawMessage,
            isActiveConversation,
          )
        : buildConversationRecordFromMessageCreated(
            conversationId,
            rawMessage,
            isActiveConversation,
          );

      const firstPage = pagesWithoutTarget[0];
      const firstPayload = extractPayloadFromConversationPage(firstPage) ?? [];

      pagesWithoutTarget[0] = setPayloadOnConversationPage(firstPage, [
        nextConversation,
        ...firstPayload,
      ]);

      return { ...old, pages: pagesWithoutTarget };
    },
  );
}

export function applyConversationStatusToListCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  status: string,
) {
  updateConversationInListCache(
    queryClient,
    tenantId,
    conversationId,
    (conversation) => ({ ...conversation, status }),
    { remove: status === "resolved" || status === "snoozed" },
  );
}

export function applyConversationUpdatedToListCache(
  queryClient: QueryClient,
  tenantId: string,
  conversationId: string,
  payload: Record<string, unknown>,
) {
  updateConversationInListCache(
    queryClient,
    tenantId,
    conversationId,
    (conversation) => {
      const meta = (conversation.meta ?? {}) as Record<string, unknown>;
      const assignee = payload.assignee as Record<string, unknown> | undefined;

      return {
        ...conversation,
        meta: {
          ...meta,
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name,
                available_name: assignee.available_name,
                email: assignee.email,
                role: assignee.role,
                thumbnail: assignee.thumbnail,
                availability_status: assignee.availability_status,
              }
            : meta.assignee,
          assignee_type:
            typeof payload.meta === "object" &&
            payload.meta !== null &&
            typeof (payload.meta as Record<string, unknown>).assignee_type ===
              "string"
              ? (payload.meta as Record<string, unknown>).assignee_type
              : meta.assignee_type,
        },
      };
    },
  );
}
