"use client";

import {
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  EllipsisVertical,
  Menu,
  PenBox,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
  MessagesSquare,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  chatwootOmniKeys,
  useListTenantConversations,
  useInfiniteFilterConversations,
  useListAccountCustomFilters,
  useDeleteAccountCustomFilter,
} from "@/hooks/chatwoot/use-chatwoot";
import type {
  FilterConversationsRequest,
  ListTenantConversationsData,
  ListTenantConversationsParams,
  ListTenantConversationsResponse,
  TenantConversationsListMeta,
} from "@/services/chatwoot/interface";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type {
  ChatConversation,
  ChatUser,
  PendingMessage,
  ReplyDraft,
} from "../utils/types";
import { useChat } from "../utils/use-chat";
import { ChatConversationList } from "./chat-conversation-list";
import {
  ChatNotificationSidebar,
  type ConversationSidebarAssigneeFilter,
  type ConversationSidebarLabelFilter,
} from "./chat-notification-sidebar";
import { ChatHeader } from "./chat-header";
import { MessageInput } from "./message-input";
import { MessageList } from "./message-list";
import { EmptyData } from "@/components/empty-data";
import { StringParam, useQueryParams } from "use-query-params";
import { coerceToDate } from "@/helpers/format-message-time";
import { useChatUnreadStore } from "../utils/chat-unread-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { NavigationRailFilter } from "@/components/navigation-rail-filter";
import { ChatConversationFilterForm } from "./chat-conversation-filter-form";
import { ChatFilterCustomDialog } from "./chat-filter-custom-dialog";
import {
  buildFilterConversationsPayload,
  EMPTY_CHAT_CONVERSATION_FILTER,
  extractAccountCustomFilters,
  extractFilterConversationsMetaFromPages,
  extractFilterConversationsPayloadFromPages,
  customFilterQueryToDraft,
  customFilterQueryToRequest,
  parseCustomFilterId,
  CHAT_CONVERSATION_STATUS_OPTIONS,
  countActiveChatConversationFilters,
  hasActiveChatConversationFilter,
  type ChatConversationFilterDraft,
} from "../utils/conversation-filter";
import type { AccountCustomFilter } from "@/services/chatwoot/interface";

/** Params list conversations — GET `/api/v1/chatwoot/tenants/:tenant_id/conversations` */
const TENANT_CONVERSATION_LIST_BASE = {
  status: "open",
  assignee_type: "me",
  page: 1,
  sort_by: "last_activity_at_desc",
} as const satisfies Partial<ListTenantConversationsParams>;

/** Tuỳ chỉnh nền rail lọc chat — đổi class Tailwind tại đây (chỉ dark hoặc cả light) */
const CHAT_FILTER_RAIL_OVERLAY_SURFACE = "dark:bg-slate-950/50";

const CONVERSATION_STATUS_BADGE_STYLES: Record<
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
    dot: "bg-slate-400",
    bg: "bg-muted/80",
    text: "text-muted-foreground",
    border: "border-border/80",
  },
  pending: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-500/25",
  },
  snoozed: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-500/25",
  },
};

function ConversationListStatusBadge({ status }: { status: string }) {
  const style =
    CONVERSATION_STATUS_BADGE_STYLES[status] ??
    CONVERSATION_STATUS_BADGE_STYLES.open;
  const label =
    CHAT_CONVERSATION_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? status;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium leading-none",
        style.bg,
        style.text,
        style.border,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} aria-hidden />
      {label}
    </span>
  );
}

function ConversationListCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-2 text-[11px] font-semibold leading-none tabular-nums text-primary">
      {count}
      <span className="font-normal text-primary/75">cuộc</span>
    </span>
  );
}

type ChatFilterSearchButtonProps = {
  activeFilterCount: number;
  onClick: () => void;
  buttonClassName?: string;
  iconClassName?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

function ChatFilterSearchButton({
  activeFilterCount,
  onClick,
  buttonClassName,
  iconClassName = "size-4",
  tooltipSide = "top",
}: ChatFilterSearchButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn("relative shrink-0 cursor-pointer", buttonClassName)}
          aria-label={
            activeFilterCount > 0
              ? `Mở bộ lọc (${activeFilterCount} điều kiện)`
              : "Mở sidebar tìm kiếm"
          }
        >
          <Search className={iconClassName} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {activeFilterCount > 99 ? "99+" : activeFilterCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>
        {activeFilterCount > 0
          ? `Bộ lọc (${activeFilterCount} điều kiện)`
          : "Mở sidebar tìm kiếm"}
      </TooltipContent>
    </Tooltip>
  );
}

type ChatFilterSaveButtonProps = {
  mode: "create" | "update";
  disabled?: boolean;
  onClick: () => void;
  buttonClassName?: string;
  iconClassName?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

function ChatFilterSaveButton({
  mode,
  disabled = false,
  onClick,
  buttonClassName,
  iconClassName = "size-4",
  tooltipSide = "top",
}: ChatFilterSaveButtonProps) {
  const label = mode === "update" ? "Cập nhật bộ lọc" : "Lưu bộ lọc";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn("shrink-0 cursor-pointer", buttonClassName)}
          aria-label={label}
        >
          {mode === "update" ? (
            <PenBox className={iconClassName} />
          ) : (
            <Save className={iconClassName} />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}

type ChatFilterDeleteButtonProps = {
  onClick: () => void;
  buttonClassName?: string;
  iconClassName?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

function ChatFilterDeleteButton({
  onClick,
  buttonClassName,
  iconClassName = "size-4",
  tooltipSide = "top",
}: ChatFilterDeleteButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn(
            "shrink-0 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive",
            buttonClassName,
          )}
          aria-label="Xóa bộ lọc"
        >
          <Trash2 className={iconClassName} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>Xóa bộ lọc</TooltipContent>
    </Tooltip>
  );
}

type ChatSidebarFilterToolbarProps = {
  appliedFilterCount: number;
  customFilterDialogMode: "create" | "update";
  canSaveCustomFilter: boolean;
  canDeleteCustomFilter: boolean;
  onOpenFilterRail: () => void;
  onClearFilters: () => void;
  onOpenSaveDialog: () => void;
  onOpenDeleteDialog: () => void;
  compact?: boolean;
};

const FILTER_TOOLBAR_ICON_BUTTON_CLASS = "size-8";
const FILTER_TOOLBAR_ICON_CLASS = "size-3.5";
const CHAT_SPLIT_HEADER_CLASS =
  "flex h-16 shrink-0 items-center border-b border-border";

type FilterActionsMenuProps = Pick<
  ChatSidebarFilterToolbarProps,
  | "appliedFilterCount"
  | "customFilterDialogMode"
  | "canSaveCustomFilter"
  | "canDeleteCustomFilter"
  | "onClearFilters"
  | "onOpenSaveDialog"
  | "onOpenDeleteDialog"
> & {
  triggerClassName?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  menuSide?: "top" | "right" | "bottom" | "left";
};

function FilterActionsMenu({
  appliedFilterCount,
  customFilterDialogMode,
  canSaveCustomFilter,
  canDeleteCustomFilter,
  onClearFilters,
  onOpenSaveDialog,
  onOpenDeleteDialog,
  triggerClassName,
  tooltipSide = "top",
  menuSide = "bottom",
}: FilterActionsMenuProps) {
  const saveLabel =
    customFilterDialogMode === "update" ? "Cập nhật bộ lọc" : "Lưu bộ lọc";

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "shrink-0 cursor-pointer",
                FILTER_TOOLBAR_ICON_BUTTON_CLASS,
                triggerClassName,
              )}
              aria-label="Thao tác bộ lọc"
            >
              <EllipsisVertical className={FILTER_TOOLBAR_ICON_CLASS} />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>Thao tác bộ lọc</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" side={menuSide} className="w-48">
        <DropdownMenuItem
          onClick={onClearFilters}
          disabled={appliedFilterCount === 0}
        >
          <RotateCcw className="size-4" />
          Reset bộ lọc
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onOpenSaveDialog}
          disabled={!canSaveCustomFilter}
        >
          {customFilterDialogMode === "update" ? (
            <PenBox className="size-4" />
          ) : (
            <Save className="size-4" />
          )}
          {saveLabel}
        </DropdownMenuItem>
        {canDeleteCustomFilter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={onOpenDeleteDialog}
            >
              <Trash2 className="size-4" />
              Xóa bộ lọc
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ChatSidebarFilterToolbar({
  appliedFilterCount,
  customFilterDialogMode,
  canSaveCustomFilter,
  canDeleteCustomFilter,
  onOpenFilterRail,
  onClearFilters,
  onOpenSaveDialog,
  onOpenDeleteDialog,
  compact = false,
}: ChatSidebarFilterToolbarProps) {
  const sharedMenuProps: FilterActionsMenuProps = {
    appliedFilterCount,
    customFilterDialogMode,
    canSaveCustomFilter,
    canDeleteCustomFilter,
    onClearFilters,
    onOpenSaveDialog,
    onOpenDeleteDialog,
  };

  if (compact) {
    return (
      <div className="flex w-full items-center justify-center gap-0.5">
        <ChatFilterSearchButton
          activeFilterCount={appliedFilterCount}
          onClick={onOpenFilterRail}
          buttonClassName={FILTER_TOOLBAR_ICON_BUTTON_CLASS}
          iconClassName={FILTER_TOOLBAR_ICON_CLASS}
          tooltipSide="right"
        />
        <FilterActionsMenu
          {...sharedMenuProps}
          tooltipSide="right"
          menuSide="right"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/30 p-0.5 shadow-sm">
      <ChatFilterSearchButton
        activeFilterCount={appliedFilterCount}
        onClick={onOpenFilterRail}
        buttonClassName={FILTER_TOOLBAR_ICON_BUTTON_CLASS}
        iconClassName={FILTER_TOOLBAR_ICON_CLASS}
      />
      <div className="mx-0.5 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClearFilters}
            disabled={appliedFilterCount === 0}
            className={cn(
              "cursor-pointer shrink-0",
              FILTER_TOOLBAR_ICON_BUTTON_CLASS,
            )}
            aria-label="Reset bộ lọc"
          >
            <RotateCcw className={FILTER_TOOLBAR_ICON_CLASS} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Reset bộ lọc</TooltipContent>
      </Tooltip>
      <ChatFilterSaveButton
        mode={customFilterDialogMode}
        disabled={!canSaveCustomFilter}
        onClick={onOpenSaveDialog}
        buttonClassName={FILTER_TOOLBAR_ICON_BUTTON_CLASS}
        iconClassName={FILTER_TOOLBAR_ICON_CLASS}
      />
      {canDeleteCustomFilter && (
        <ChatFilterDeleteButton
          onClick={onOpenDeleteDialog}
          buttonClassName={FILTER_TOOLBAR_ICON_BUTTON_CLASS}
          iconClassName={FILTER_TOOLBAR_ICON_CLASS}
        />
      )}
    </div>
  );
}

type ChatSidebarCollapsedHeaderProps = {
  onExpand: () => void;
  filterToolbar: ChatSidebarFilterToolbarProps;
};

function ChatSidebarCollapsedHeader({
  onExpand,
  filterToolbar,
}: ChatSidebarCollapsedHeaderProps) {
  return (
    <div className="flex h-full w-full">
      <div className="flex w-16 shrink-0 items-center justify-center border-r px-1 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              onClick={onExpand}
              className={cn(
                "shrink-0 cursor-pointer shadow-sm",
                FILTER_TOOLBAR_ICON_BUTTON_CLASS,
              )}
              aria-label="Mở danh sách trò chuyện"
            >
              <ArrowRightCircleIcon className={FILTER_TOOLBAR_ICON_CLASS} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Mở danh sách trò chuyện</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex min-w-0 w-20 flex-1 items-center justify-center px-1 py-2">
        <ChatSidebarFilterToolbar compact {...filterToolbar} />
      </div>
    </div>
  );
}

const normalizeConversation = (
  conversation: Record<string, unknown>,
): ChatConversation => {
  const meta = (conversation["meta"] ?? {}) as Record<string, unknown>;
  const sender = (meta.sender ?? {}) as Record<string, unknown>;
  const assignee = (meta.assignee ?? {}) as Record<string, unknown>;
  const lastMessage = (conversation["last_non_activity_message"] ??
    {}) as Record<string, unknown>;

  const senderId =
    typeof sender.id === "number" || typeof sender.id === "string"
      ? String(sender.id)
      : typeof conversation.contact_id === "number"
        ? String(conversation.contact_id)
        : "unknown-user";

  const conversationId =
    typeof conversation.id === "number" || typeof conversation.id === "string"
      ? String(conversation.id)
      : typeof conversation.uuid === "string"
        ? conversation.uuid
        : `conversation-${Date.now()}`;

  const name =
    typeof sender.name === "string" && sender.name.length > 0
      ? sender.name
      : `Cuộc trò chuyện #${conversationId}`;

  const avatar =
    (typeof sender.thumbnail === "string" && sender.thumbnail) ||
    (typeof sender.avatar_url === "string" && sender.avatar_url) ||
    "";

  const unreadCount =
    typeof conversation["unread_count"] === "number"
      ? conversation["unread_count"]
      : 0;
  const labels = Array.isArray(conversation["labels"])
    ? conversation["labels"].filter(
        (label): label is string =>
          typeof label === "string" && label.trim().length > 0,
      )
    : [];

  const lastMessageContent =
    (typeof lastMessage.content === "string" && lastMessage.content) ||
    (typeof conversation["last_activity_message"] === "string" &&
      conversation["last_activity_message"]) ||
    "Chưa có tin nhắn";

  // Sort list by the latest conversation activity, not only by the last
  // non-activity message. Actions like adding labels update `last_activity_at`
  // while `last_non_activity_message` may still point to an older message.
  const lastMessageTimestamp = coerceToDate(
    conversation["last_activity_at"] ??
      conversation["timestamp"] ??
      conversation.updated_at ??
      lastMessage.created_at ??
      conversation.created_at,
  );

  const rawInboxId = conversation["inbox_id"];
  const inboxId =
    typeof rawInboxId === "number"
      ? rawInboxId
      : typeof rawInboxId === "string"
        ? Number(rawInboxId)
        : Number.NaN;

  return {
    id: conversationId,
    type: "direct",
    participants: [senderId],
    name,
    avatar,
    labels,
    lastMessage: {
      id:
        typeof lastMessage.id === "number" || typeof lastMessage.id === "string"
          ? String(lastMessage.id)
          : `last-${conversationId}`,
      content: lastMessageContent,
      timestamp: String(lastMessageTimestamp),
      senderId,
    },
    unreadCount,
    isPinned: false,
    isMuted: Boolean(conversation["muted"]),
    status:
      typeof conversation["status"] === "string"
        ? conversation["status"]
        : "open",
    inboxId: Number.isFinite(inboxId) ? inboxId : undefined,
    meta: {
      sender: {
        id:
          typeof sender.id === "number" || typeof sender.id === "string"
            ? String(sender.id)
            : undefined,
        name: typeof sender.name === "string" ? sender.name : undefined,
        identifier:
          typeof sender.identifier === "string" ? sender.identifier : undefined,
        thumbnail:
          typeof sender.thumbnail === "string" ? sender.thumbnail : undefined,
        availabilityStatus:
          typeof sender.availability_status === "string"
            ? sender.availability_status
            : undefined,
        lastActivityAt:
          typeof sender.last_activity_at === "number" ||
          typeof sender.last_activity_at === "string"
            ? String(sender.last_activity_at)
            : undefined,
        createdAt:
          typeof sender.created_at === "number" ||
          typeof sender.created_at === "string"
            ? String(sender.created_at)
            : undefined,
      },
      channel: typeof meta.channel === "string" ? meta.channel : undefined,
      assignee: {
        id:
          typeof assignee.id === "number" || typeof assignee.id === "string"
            ? String(assignee.id)
            : undefined,
        availableName:
          typeof assignee.available_name === "string"
            ? assignee.available_name
            : undefined,
        name: typeof assignee.name === "string" ? assignee.name : undefined,
        email: typeof assignee.email === "string" ? assignee.email : undefined,
        role: typeof assignee.role === "string" ? assignee.role : undefined,
        thumbnail:
          typeof assignee.thumbnail === "string"
            ? assignee.thumbnail
            : undefined,
        availabilityStatus:
          typeof assignee.availability_status === "string"
            ? assignee.availability_status
            : undefined,
      },
      assigneeType:
        typeof meta.assignee_type === "string" ? meta.assignee_type : undefined,
      hmacVerified:
        typeof meta.hmac_verified === "boolean"
          ? meta.hmac_verified
          : undefined,
    },
  };
};

const coerceConversationRecords = (
  value: unknown,
): Record<string, unknown>[] | null => {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
  return rows;
};

/** Lấy mảng hội thoại từ `ApiResponse.data` (nhiều dạng lồng backend). */
const extractTenantListPayload = (
  res: ListTenantConversationsResponse | null | undefined,
): Record<string, unknown>[] | null => {
  const data = res?.data as ListTenantConversationsData | undefined;
  if (!data) return null;
  const flat = coerceConversationRecords(data.payload);
  if (flat) return flat;
  const nested = coerceConversationRecords(data.data?.payload);
  if (nested) return nested;
  const viaChatwoot = coerceConversationRecords(data.chatwoot?.data?.payload);
  if (viaChatwoot) return viaChatwoot;
  return null;
};

const extractTenantListPayloadFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): Record<string, unknown>[] | null => {
  if (!pages || pages.length === 0) return null;

  const merged: Record<string, unknown>[] = [];
  let hasExtractablePayload = false;

  pages.forEach((page) => {
    const payload = extractTenantListPayload(page);
    if (payload !== null) {
      hasExtractablePayload = true;
      merged.push(...payload);
    }
  });

  return hasExtractablePayload ? merged : null;
};

const extractTenantListMeta = (
  res: ListTenantConversationsResponse | null | undefined,
): TenantConversationsListMeta | null => {
  const data = res?.data as ListTenantConversationsData | undefined;
  if (!data) return null;
  if (data.meta && typeof data.meta === "object") return data.meta;
  if (data.data?.meta && typeof data.data.meta === "object")
    return data.data.meta;
  if (
    data.chatwoot?.data?.meta &&
    typeof data.chatwoot.data.meta === "object"
  ) {
    return data.chatwoot.data.meta;
  }
  return null;
};

const extractTenantListMetaFromPages = (
  pages: (ListTenantConversationsResponse | undefined)[] | undefined,
): TenantConversationsListMeta | null => {
  if (!pages || pages.length === 0) return null;
  for (let i = pages.length - 1; i >= 0; i -= 1) {
    const meta = extractTenantListMeta(pages[i]);
    if (meta) return meta;
  }
  return null;
};

export function Chat() {
  const users: ChatUser[] = [];
  const [query, setQuery] = useQueryParams({
    conversation_id: StringParam,
  });
  const selectedConversationFromQuery = query.conversation_id ?? null;

  // Biến state để lọc danh sách hội thoại theo assignee
  const [sidebarConversationAssignee, setSidebarConversationAssignee] =
    useState<ConversationSidebarAssigneeFilter>("me");
  const [sidebarInboxId, setSidebarInboxId] = useState<number | null>(null);
  const [sidebarLabel, setSidebarLabel] =
    useState<ConversationSidebarLabelFilter>(null);
  const [sidebarCustomFilterId, setSidebarCustomFilterId] = useState<
    number | null
  >(null);

  const [isChatFilterRailOpen, setIsChatFilterRailOpen] = useState(false);
  const [chatFilterDraft, setChatFilterDraft] =
    useState<ChatConversationFilterDraft>(EMPTY_CHAT_CONVERSATION_FILTER);
  const [appliedChatFilter, setAppliedChatFilter] =
    useState<ChatConversationFilterDraft>(EMPTY_CHAT_CONVERSATION_FILTER);
  const [activeFilterRequest, setActiveFilterRequest] =
    useState<FilterConversationsRequest | null>(null);
  const [isChatFilterActive, setIsChatFilterActive] = useState(false);
  const [isCustomFilterDialogOpen, setIsCustomFilterDialogOpen] =
    useState(false);
  const [isCustomFilterDeleteDialogOpen, setIsCustomFilterDeleteDialogOpen] =
    useState(false);

  const exitChatFilterMode = useCallback(() => {
    setChatFilterDraft(EMPTY_CHAT_CONVERSATION_FILTER);
    setAppliedChatFilter(EMPTY_CHAT_CONVERSATION_FILTER);
    setActiveFilterRequest(null);
    setIsChatFilterActive(false);
    setIsChatFilterRailOpen(false);
    setSidebarCustomFilterId(null);
  }, []);

  const handleSidebarConversationAssigneeChange = useCallback(
    (value: ConversationSidebarAssigneeFilter) => {
      exitChatFilterMode();
      setSidebarConversationAssignee(value);
      setSidebarInboxId(null);
      setSidebarLabel(null);
    },
    [exitChatFilterMode],
  );

  const handleSidebarInboxChange = useCallback(
    (inboxId: number | null) => {
      exitChatFilterMode();
      setSidebarInboxId(inboxId);
      setSidebarLabel(null);
    },
    [exitChatFilterMode],
  );

  const handleSidebarLabelChange = useCallback(
    (label: ConversationSidebarLabelFilter) => {
      exitChatFilterMode();
      setSidebarLabel(label);
      setSidebarInboxId(null);
    },
    [exitChatFilterMode],
  );

  // Tham số query params cho API lấy danh sách hội thoại
  const conversationListQueryParams = useMemo(
    () =>
      ({
        ...TENANT_CONVERSATION_LIST_BASE,
        ...(typeof sidebarInboxId === "number"
          ? {}
          : { conversation_type: sidebarConversationAssignee }),
        ...(typeof sidebarInboxId === "number"
          ? { inbox_id: sidebarInboxId }
          : {}),
        ...(sidebarLabel ? { labels: [sidebarLabel] } : {}),
      }) satisfies ListTenantConversationsParams,
    [sidebarConversationAssignee, sidebarInboxId, sidebarLabel],
  );

  // Lấy thông tin user đang đăng nhập
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const queryClient = useQueryClient();

  const conversationListNavigationKey = useMemo(() => {
    if (isChatFilterActive) {
      if (sidebarCustomFilterId) {
        return `filter:${sidebarCustomFilterId}`;
      }
      return `rail-filter:${JSON.stringify(activeFilterRequest?.payload ?? [])}`;
    }
    if (typeof sidebarInboxId === "number") {
      return `inbox:${sidebarInboxId}`;
    }
    if (sidebarLabel) {
      return `label:${sidebarLabel}`;
    }
    return `assignee:${sidebarConversationAssignee}`;
  }, [
    isChatFilterActive,
    sidebarCustomFilterId,
    activeFilterRequest,
    sidebarInboxId,
    sidebarLabel,
    sidebarConversationAssignee,
  ]);

  const conversationListNavigationKeyRef = useRef(
    conversationListNavigationKey,
  );

  useEffect(() => {
    if (!tenantId) return;

    if (
      conversationListNavigationKeyRef.current === conversationListNavigationKey
    ) {
      return;
    }

    conversationListNavigationKeyRef.current = conversationListNavigationKey;

    void queryClient.resetQueries({
      queryKey: chatwootOmniKeys.tenantConversationsBase(tenantId),
    });
  }, [conversationListNavigationKey, tenantId, queryClient]);

  // Lấy danh sách conversations từ API
  const {
    data: chatwootConversationsList,
    isLoading: isChatwootLoading,
    isFetching: isChatwootFetching,
    isFetchingNextPage: isChatwootFetchingNextPage,
    fetchNextPage: fetchNextConversationPage,
    hasNextPage: hasNextConversationPage,
  } = useListTenantConversations(tenantId, conversationListQueryParams);

  const {
    data: filteredConversationsList,
    isLoading: isFilterLoading,
    isFetching: isFilterFetching,
    isFetchingNextPage: isFilterFetchingNextPage,
    fetchNextPage: fetchNextFilterPage,
    hasNextPage: hasNextFilterPage,
  } = useInfiniteFilterConversations(
    tenantId,
    activeFilterRequest,
    isChatFilterActive,
  );

  const chatwootConversationPages = chatwootConversationsList?.pages;
  const filteredConversationPages = filteredConversationsList?.pages;

  // Lấy payload từ data trả về (thành phần trong response là payload)
  const chatwootPayload = useMemo(
    () => extractTenantListPayloadFromPages(chatwootConversationPages),
    [chatwootConversationPages],
  );

  // Map payload thành dạng ChatConversation
  const mappedChatwootConversations = useMemo(
    () => (chatwootPayload ?? []).map(normalizeConversation),
    [chatwootPayload],
  );

  const filteredChatwootPayload = useMemo(
    () => extractFilterConversationsPayloadFromPages(filteredConversationPages),
    [filteredConversationPages],
  );

  const mappedFilteredConversations = useMemo(
    () => (filteredChatwootPayload ?? []).map(normalizeConversation),
    [filteredChatwootPayload],
  );

  const displayConversations = useMemo(
    () =>
      isChatFilterActive
        ? mappedFilteredConversations
        : mappedChatwootConversations,
    [
      isChatFilterActive,
      mappedFilteredConversations,
      mappedChatwootConversations,
    ],
  );

  const isConversationListLoading = isChatFilterActive
    ? isFilterLoading
    : isChatwootLoading;
  const isConversationListFetching = isChatFilterActive
    ? isFilterFetching
    : isChatwootFetching;
  const isApplyingChatFilter =
    isChatFilterActive && isFilterFetching && !isFilterFetchingNextPage;

  // Lấy meta từ data trả về (thành phần trong response là meta)
  const chatwootConversationsMeta = useMemo(() => {
    if (isChatFilterActive) {
      const filterMeta = extractFilterConversationsMetaFromPages(
        filteredConversationPages,
      );
      if (filterMeta) return filterMeta;
      if (filteredChatwootPayload !== null) {
        const total = mappedFilteredConversations.length;
        return {
          mine_count: total,
          assigned_count: total,
          unassigned_count: 0,
          all_count: total,
        } satisfies TenantConversationsListMeta;
      }
      return null;
    }

    const apiMeta = extractTenantListMetaFromPages(chatwootConversationPages);
    if (apiMeta) return apiMeta;

    // API có payload nhưng không trả meta -> tạo meta fallback để UI tab hiển thị đúng.
    if (chatwootPayload !== null) {
      const total = mappedChatwootConversations.length;
      return {
        mine_count: sidebarConversationAssignee === "me" ? total : 0,
        assigned_count: sidebarConversationAssignee === "me" ? total : 0,
        unassigned_count:
          sidebarConversationAssignee === "unattended" ? total : 0,
        all_count: total,
      } satisfies TenantConversationsListMeta;
    }

    return null;
  }, [
    isChatFilterActive,
    filteredConversationPages,
    filteredChatwootPayload,
    mappedFilteredConversations.length,
    chatwootConversationPages,
    chatwootPayload,
    mappedChatwootConversations.length,
    sidebarConversationAssignee,
  ]);

  const handleLoadMoreConversations = useCallback(() => {
    if (isChatFilterActive) {
      if (!hasNextFilterPage || isFilterFetchingNextPage) return;
      void fetchNextFilterPage();
      return;
    }

    if (!hasNextConversationPage || isChatwootFetchingNextPage) return;
    void fetchNextConversationPage();
  }, [
    fetchNextConversationPage,
    fetchNextFilterPage,
    hasNextConversationPage,
    hasNextFilterPage,
    isChatFilterActive,
    isChatwootFetchingNextPage,
    isFilterFetchingNextPage,
  ]);

  // Lấy store chat từ context
  const chatStore = useChat();
  const {
    selectedConversation: selectedConversationInStore,
    setSelectedConversation,
    setConversations,
    toggleMute,
  } = chatStore;
  const selectedConversation = selectedConversationFromQuery;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationSidebarCollapsed, setIsNotificationSidebarCollapsed] =
    useState(false);
  const [isConversationListCollapsed, setIsConversationListCollapsed] =
    useState(false);

  const openChatFilterRail = useCallback(() => {
    setChatFilterDraft(appliedChatFilter);
    setIsChatFilterRailOpen(true);
  }, [appliedChatFilter]);

  const handleClearChatFilters = useCallback(() => {
    exitChatFilterMode();
  }, [exitChatFilterMode]);

  const isFirstSidebarNavigationRender = useRef(true);

  useEffect(() => {
    if (isFirstSidebarNavigationRender.current) {
      isFirstSidebarNavigationRender.current = false;
      return;
    }

    handleClearChatFilters();
  }, [
    sidebarConversationAssignee,
    sidebarInboxId,
    sidebarLabel,
    handleClearChatFilters,
  ]);

  const handleApplyChatFilters = useCallback(() => {
    if (!tenantId || !hasActiveChatConversationFilter(chatFilterDraft)) {
      return;
    }

    setSidebarCustomFilterId(null);
    const requestData = buildFilterConversationsPayload(chatFilterDraft);
    setAppliedChatFilter(chatFilterDraft);
    setActiveFilterRequest(requestData);
    setIsChatFilterActive(true);
    setIsChatFilterRailOpen(false);
  }, [chatFilterDraft, tenantId]);

  const handleSidebarCustomFilterSelect = useCallback(
    (filter: AccountCustomFilter) => {
      if (!tenantId) return;

      const requestData = customFilterQueryToRequest(filter.query);
      if (!requestData) return;

      const filterId = parseCustomFilterId(filter.id);
      if (filterId === null) return;

      const nextDraft = customFilterQueryToDraft(filter.query);

      setSidebarCustomFilterId(filterId);
      setSidebarInboxId(null);
      setSidebarLabel(null);
      setChatFilterDraft(nextDraft);
      setAppliedChatFilter(nextDraft);
      setActiveFilterRequest(requestData);
      setIsChatFilterActive(true);
      setIsChatFilterRailOpen(false);
    },
    [tenantId],
  );

  const appliedChatFilterCount = useMemo(
    () =>
      isChatFilterActive
        ? countActiveChatConversationFilters(appliedChatFilter)
        : 0,
    [appliedChatFilter, isChatFilterActive],
  );

  const { data: customFiltersResponse } = useListAccountCustomFilters(tenantId);

  const savedCustomFilters = useMemo(
    () => extractAccountCustomFilters(customFiltersResponse),
    [customFiltersResponse],
  );

  const selectedSidebarCustomFilter = useMemo(
    () =>
      sidebarCustomFilterId
        ? (savedCustomFilters.find(
            (filter) =>
              parseCustomFilterId(filter.id) === sidebarCustomFilterId,
          ) ?? null)
        : null,
    [savedCustomFilters, sidebarCustomFilterId],
  );

  const customFilterDialogMode = sidebarCustomFilterId ? "update" : "create";
  const canSaveCustomFilter = isChatFilterActive && appliedChatFilterCount > 0;
  const canDeleteCustomFilter = sidebarCustomFilterId !== null;

  const { mutate: deleteCustomFilter, isPending: isDeletingCustomFilter } =
    useDeleteAccountCustomFilter();

  const handleConfirmDeleteCustomFilter = useCallback(() => {
    if (!tenantId || sidebarCustomFilterId === null) return;

    deleteCustomFilter(
      { tenantId, filterId: sidebarCustomFilterId },
      {
        onSuccess: (res) => {
          if (res.status_code === 200) {
            setIsCustomFilterDeleteDialogOpen(false);
            handleClearChatFilters();
          }
        },
      },
    );
  }, [
    tenantId,
    sidebarCustomFilterId,
    deleteCustomFilter,
    handleClearChatFilters,
  ]);

  const conversationListStatus =
    conversationListQueryParams.status ?? TENANT_CONVERSATION_LIST_BASE.status;

  const filteredConversationCount = useMemo(() => {
    if (!isChatFilterActive) return 0;
    return chatwootConversationsMeta?.all_count ?? displayConversations.length;
  }, [
    isChatFilterActive,
    chatwootConversationsMeta?.all_count,
    displayConversations.length,
  ]);

  const [replyDraft, setReplyDraft] = useState<ReplyDraft | null>(null);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

  useEffect(() => {
    setReplyDraft(null);
    setPendingMessages([]);
  }, [selectedConversation]);

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined" ? window.innerWidth : 0 >= 1024) {
        setIsSidebarOpen(false);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const conversationFromDisplayList = useMemo(
    () =>
      selectedConversation
        ? displayConversations.find((conv) => conv.id === selectedConversation)
        : undefined,
    [displayConversations, selectedConversation],
  );

  const [activeConversationSnapshot, setActiveConversationSnapshot] =
    useState<ChatConversation | null>(null);
  const previousSelectedConversationRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedConversation) {
      setActiveConversationSnapshot(null);
      previousSelectedConversationRef.current = null;
      return;
    }

    const selectionChanged =
      previousSelectedConversationRef.current !== selectedConversation;
    previousSelectedConversationRef.current = selectedConversation;

    if (conversationFromDisplayList) {
      setActiveConversationSnapshot(conversationFromDisplayList);
      return;
    }

    if (selectionChanged) {
      setActiveConversationSnapshot(null);
    }
  }, [selectedConversation, conversationFromDisplayList]);

  useEffect(() => {
    const nextConversations = [...displayConversations];

    if (selectedConversation) {
      const isSelectedVisible = displayConversations.some(
        (conv) => conv.id === selectedConversation,
      );

      if (!isSelectedVisible && activeConversationSnapshot) {
        nextConversations.push(activeConversationSnapshot);
      }
    }

    setConversations(nextConversations);
    useChatUnreadStore.getState().mergeFromConversations(displayConversations);
  }, [
    activeConversationSnapshot,
    displayConversations,
    selectedConversation,
    setConversations,
  ]);

  useEffect(() => {
    if (selectedConversationInStore !== selectedConversation) {
      setSelectedConversation(selectedConversation);
    }
  }, [
    selectedConversation,
    selectedConversationInStore,
    setSelectedConversation,
  ]);

  const storeConversation = useMemo(
    () =>
      selectedConversation
        ? chatStore.conversations.find(
            (conv) => conv.id === selectedConversation,
          )
        : undefined,
    [chatStore.conversations, selectedConversation],
  );

  const currentConversation = useMemo(() => {
    if (!activeConversationSnapshot) return undefined;

    if (
      !storeConversation ||
      storeConversation.id !== activeConversationSnapshot.id
    ) {
      return activeConversationSnapshot;
    }

    return {
      ...activeConversationSnapshot,
      isMuted: storeConversation.isMuted,
      isPinned: storeConversation.isPinned,
      unreadCount: storeConversation.unreadCount,
      status: storeConversation.status ?? activeConversationSnapshot.status,
      lastMessage:
        storeConversation.lastMessage ?? activeConversationSnapshot.lastMessage,
    };
  }, [activeConversationSnapshot, storeConversation]);

  const storeMessages = chatStore.messages;
  const currentMessages = useMemo(
    () =>
      selectedConversation ? (storeMessages[selectedConversation] ?? []) : [],
    [selectedConversation, storeMessages],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSendMessage = (_content: string) => {
    // Tin nhắn thực sẽ xuất hiện sau khi React Query invalidate và refetch
  };

  const handleBeforeSend = useCallback(
    (id: string, content: string, filesCount: number) => {
      if (!selectedConversation) return;
      setPendingMessages((prev) => [
        ...prev,
        {
          id,
          content,
          filesCount,
          created_at: new Date().toISOString(),
          status: "sending",
          conversationId: selectedConversation,
        },
      ]);
    },
    [selectedConversation],
  );

  const handleSendResult = useCallback(
    (id: string, succeeded: boolean, retry?: () => Promise<void>) => {
      if (succeeded) {
        // Xóa tin nhắn tạm sau khi query refetch xong (~1s)
        setTimeout(() => {
          setPendingMessages((prev) => prev.filter((m) => m.id !== id));
        }, 1200);
      } else {
        setPendingMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, status: "failed", retry } : m,
          ),
        );
      }
    },
    [],
  );

  const handleToggleMute = () => {
    if (selectedConversation) {
      toggleMute(selectedConversation);
    }
  };

  const isSidebarContentCollapsed =
    isNotificationSidebarCollapsed && isConversationListCollapsed;
  const isSidebarFullyExpanded =
    !isNotificationSidebarCollapsed && !isConversationListCollapsed;
  const sidebarDesktopWidthClass = isSidebarFullyExpanded
    ? "lg:w-[45%]"
    : !isNotificationSidebarCollapsed && isConversationListCollapsed
      ? "lg:w-[calc(18%+5rem)]"
      : isNotificationSidebarCollapsed && !isConversationListCollapsed
        ? "lg:w-[calc(27%+4rem)]"
        : "lg:w-36";

  const sidebarFilterToolbarProps: ChatSidebarFilterToolbarProps = {
    appliedFilterCount: appliedChatFilterCount,
    customFilterDialogMode,
    canSaveCustomFilter,
    canDeleteCustomFilter,
    onOpenFilterRail: openChatFilterRail,
    onClearFilters: handleClearChatFilters,
    onOpenSaveDialog: () => setIsCustomFilterDialogOpen(true),
    onOpenDeleteDialog: () => setIsCustomFilterDeleteDialogOpen(true),
  };

  const handleExpandSidebar = useCallback(() => {
    setIsNotificationSidebarCollapsed(false);
    setIsConversationListCollapsed(false);
  }, []);

  return (
    <TooltipProvider delayDuration={450} skipDelayDuration={200}>
      <div className="relative isolate flex h-full min-h-0 flex-1 w-full overflow-hidden pl-1 shadow-sm">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={cn(
            "max-lg:w-full border-r shrink-0 fixed inset-y-0 left-0 max-lg:z-50 flex h-full flex-col min-h-0 transition-[width,transform] duration-500 ease-in-out lg:relative lg:min-h-0",
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0",
            sidebarDesktopWidthClass,
          )}
        >
          <div className={CHAT_SPLIT_HEADER_CLASS}>
            {isSidebarContentCollapsed ? (
              <ChatSidebarCollapsedHeader
                onExpand={handleExpandSidebar}
                filterToolbar={sidebarFilterToolbarProps}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-between gap-2 overflow-hidden px-4">
                <h2 className="flex min-w-0 flex-1 items-center gap-2 text-lg font-semibold leading-none">
                  <MessagesSquare className="size-4 shrink-0" />
                  <span className="min-w-0 truncate whitespace-nowrap transition-opacity duration-300">
                    Danh sách trò chuyện
                  </span>
                  {isChatFilterActive ? (
                    <ConversationListCountBadge
                      count={filteredConversationCount}
                    />
                  ) : (
                    <ConversationListStatusBadge
                      status={conversationListStatus}
                    />
                  )}
                </h2>

                <div className="flex shrink-0 items-center gap-1">
                  <ChatSidebarFilterToolbar {...sidebarFilterToolbarProps} />

                  {isSidebarFullyExpanded ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsNotificationSidebarCollapsed(true);
                            setIsConversationListCollapsed(true);
                          }}
                          className="cursor-pointer shrink-0"
                          aria-label="Thu gọn danh sách trò chuyện"
                        >
                          <ArrowLeftCircleIcon className="size-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Thu gọn danh sách trò chuyện
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <div className="flex items-center rounded-md border p-1">
                      <Button
                        variant={
                          !isNotificationSidebarCollapsed
                            ? "secondary"
                            : "ghost"
                        }
                        size="sm"
                        onClick={() =>
                          setIsNotificationSidebarCollapsed((prev) => !prev)
                        }
                        className="h-7 px-2 text-xs"
                        aria-label={
                          isNotificationSidebarCollapsed
                            ? "Mở sidebar thông báo"
                            : "Đóng sidebar thông báo"
                        }
                      >
                        Sidebar
                      </Button>
                      <Button
                        variant={
                          !isConversationListCollapsed ? "secondary" : "ghost"
                        }
                        size="sm"
                        onClick={() =>
                          setIsConversationListCollapsed((prev) => !prev)
                        }
                        className="h-7 px-2 text-xs"
                        aria-label={
                          isConversationListCollapsed
                            ? "Mở danh sách trò chuyện"
                            : "Đóng danh sách trò chuyện"
                        }
                      >
                        Danh sách
                      </Button>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(false)}
                    className="cursor-pointer shrink-0 lg:hidden"
                    aria-label="Đóng danh sách trò chuyện"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {isSidebarContentCollapsed ? (
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <div className="w-16 shrink-0 border-r">
                <ChatNotificationSidebar
                  tenantId={tenantId}
                  isCollapsed
                  sidebarConversationAssignee={sidebarConversationAssignee}
                  sidebarInboxId={sidebarInboxId}
                  sidebarLabel={sidebarLabel}
                  sidebarCustomFilterId={sidebarCustomFilterId}
                  isSwitchingMenu={
                    isConversationListFetching && !isConversationListLoading
                  }
                  onSidebarConversationAssigneeChange={
                    handleSidebarConversationAssigneeChange
                  }
                  onSidebarInboxChange={handleSidebarInboxChange}
                  onSidebarLabelChange={handleSidebarLabelChange}
                  onSidebarCustomFilterSelect={handleSidebarCustomFilterSelect}
                />
              </div>
              <div className="min-h-0 min-w-0 w-20 flex-1">
                <ChatConversationList
                  tenantId={tenantId}
                  conversations={displayConversations}
                  users={users}
                  selectedConversation={selectedConversation}
                  isCollapsed
                  isLoading={isConversationListLoading}
                  hideTabs={isChatFilterActive}
                  listScrollResetKey={conversationListNavigationKey}
                  isLoadingMore={
                    isChatFilterActive
                      ? isFilterFetchingNextPage
                      : isChatwootFetchingNextPage
                  }
                  hasMore={
                    isChatFilterActive
                      ? Boolean(hasNextFilterPage)
                      : Boolean(hasNextConversationPage)
                  }
                  conversationsMeta={chatwootConversationsMeta}
                  onLoadMore={handleLoadMoreConversations}
                  onSelectConversation={(id: string) => {
                    setQuery({ conversation_id: id }, "replaceIn");
                    setIsSidebarOpen(false);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 overflow-hidden">
            <div
              className={cn(
                "shrink-0 transition-[width] duration-500 ease-in-out",
                isNotificationSidebarCollapsed
                  ? "w-16"
                  : isConversationListCollapsed
                    ? "w-[calc(100%-5rem)]"
                    : isSidebarFullyExpanded
                      ? "w-[38%]"
                      : "w-[35%]",
              )}
            >
              <ChatNotificationSidebar
                tenantId={tenantId}
                isCollapsed={isNotificationSidebarCollapsed}
                sidebarConversationAssignee={sidebarConversationAssignee}
                sidebarInboxId={sidebarInboxId}
                sidebarLabel={sidebarLabel}
                sidebarCustomFilterId={sidebarCustomFilterId}
                isSwitchingMenu={
                  isConversationListFetching && !isConversationListLoading
                }
                onSidebarConversationAssigneeChange={
                  handleSidebarConversationAssigneeChange
                }
                onSidebarInboxChange={handleSidebarInboxChange}
                onSidebarLabelChange={handleSidebarLabelChange}
                onSidebarCustomFilterSelect={handleSidebarCustomFilterSelect}
              />
            </div>
            <div
              className={cn(
                "min-w-0 transition-[width] duration-500 ease-in-out",
                isConversationListCollapsed
                  ? "w-20"
                  : isNotificationSidebarCollapsed
                    ? "w-[calc(100%-4rem)]"
                    : "min-w-0 flex-1",
              )}
            >
              <ChatConversationList
                tenantId={tenantId}
                conversations={displayConversations}
                users={users}
                selectedConversation={selectedConversation}
                isCollapsed={isConversationListCollapsed}
                isLoading={isConversationListLoading}
                hideTabs={isChatFilterActive}
                listScrollResetKey={conversationListNavigationKey}
                isLoadingMore={
                  isChatFilterActive
                    ? isFilterFetchingNextPage
                    : isChatwootFetchingNextPage
                }
                hasMore={
                  isChatFilterActive
                    ? Boolean(hasNextFilterPage)
                    : Boolean(hasNextConversationPage)
                }
                conversationsMeta={chatwootConversationsMeta}
                onLoadMore={handleLoadMoreConversations}
                onSelectConversation={(id: string) => {
                  setQuery({ conversation_id: id }, "replaceIn");
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden">
          <div className={cn(CHAT_SPLIT_HEADER_CLASS, "gap-2 px-4")}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(true)}
              className="cursor-pointer lg:hidden mr-2"
            >
              <Menu className="size-4" />
            </Button>

            <div className="flex-1">
              <ChatHeader
                conversation={currentConversation || null}
                users={users}
                onToggleMute={handleToggleMute}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {selectedConversation ? (
              <>
                <MessageList
                  messages={currentMessages}
                  users={users}
                  tenantId={tenantId}
                  conversationId={selectedConversation}
                  onReplyToMessage={setReplyDraft}
                  pendingMessages={pendingMessages}
                />

                <MessageInput
                  tenantId={tenantId}
                  conversationId={selectedConversation}
                  onSendMessage={handleSendMessage}
                  placeholder={`Message ${currentConversation?.name || ""}...`}
                  replyDraft={replyDraft}
                  onClearReply={() => setReplyDraft(null)}
                  onBeforeSend={handleBeforeSend}
                  onSendResult={handleSendResult}
                />
              </>
            ) : (
              <div className="flex-1 p-4">
                <EmptyData
                  icon={MessagesSquare}
                  title="Chưa chọn cuộc trò chuyện"
                  description="Vui lòng chọn một cuộc trò chuyện ở danh sách bên trái để bắt đầu."
                  showButton={false}
                  className="h-full"
                />
              </div>
            )}
          </div>
        </div>

        <NavigationRailFilter
          displayMode="overlay"
          hideDock
          open={isChatFilterRailOpen}
          onOpenChange={setIsChatFilterRailOpen}
          orientation="vertical"
          overlayPanelWidth={420}
          overlaySurfaceClassName={CHAT_FILTER_RAIL_OVERLAY_SURFACE}
          overlayContent={
            <ChatConversationFilterForm
              tenantId={tenantId}
              value={chatFilterDraft}
              onChange={setChatFilterDraft}
            />
          }
          overlayFooter={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9 flex-1"
                onClick={handleClearChatFilters}
                disabled={
                  !hasActiveChatConversationFilter(chatFilterDraft) &&
                  !isChatFilterActive
                }
              >
                Xóa bộ lọc{" "}
              </Button>
              <Button
                type="button"
                className="h-9 flex-1"
                onClick={handleApplyChatFilters}
                disabled={
                  !hasActiveChatConversationFilter(chatFilterDraft) ||
                  isApplyingChatFilter
                }
              >
                {isApplyingChatFilter ? "Đang lọc..." : "Áp dụng bộ lọc"}
              </Button>
            </div>
          }
        />

        <ChatFilterCustomDialog
          open={isCustomFilterDialogOpen}
          onOpenChange={setIsCustomFilterDialogOpen}
          tenantId={tenantId}
          mode={customFilterDialogMode}
          filterId={sidebarCustomFilterId ?? undefined}
          initialName={selectedSidebarCustomFilter?.name ?? ""}
          filterType={selectedSidebarCustomFilter?.filter_type}
          filterDraft={appliedChatFilter}
        />

        <ConfirmDialog
          open={isCustomFilterDeleteDialogOpen}
          onOpenChange={setIsCustomFilterDeleteDialogOpen}
          title="Xóa bộ lọc"
          description={
            <>
              Bạn có chắc muốn xóa bộ lọc{" "}
              <span className="font-medium text-foreground">
                {selectedSidebarCustomFilter?.name?.trim() || "bộ lọc này"}
              </span>
              ?
            </>
          }
          confirmText="Xóa bộ lọc"
          cancelText="Hủy"
          loading={isDeletingCustomFilter}
          onConfirm={handleConfirmDeleteCustomFilter}
        />
      </div>
    </TooltipProvider>
  );
}
