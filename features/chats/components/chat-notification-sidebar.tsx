"use client";

import type { FocusEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  CircleDot,
  FolderKanban,
  Inbox,
  MessageCircle,
  ShieldAlert,
  AtSignIcon,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  useListTenantInboxes,
  useListTenantLabels,
} from "@/hooks/chatwoot/use-chatwoot";

/** Giá trị filter sẽ map vào query `conversation_type` */
export type ConversationSidebarAssigneeFilter = "me" | "mention" | "unattended";
export type ConversationSidebarLabelFilter = string | null;

const menuItems = [
  {
    title: "Hộp thư",
    icon: Inbox,
    url: "#",
    isActive: true,
  },
  {
    title: "Cuộc trò chuyện",
    icon: MessageCircle,
    url: "#",
    isActive: false,
  },
  {
    title: "Kênh",
    icon: FolderKanban,
    url: "#",
    isActive: false,
  },
];

const conversationSubItems: {
  name: string;
  icon: LucideIcon;
  assignee: ConversationSidebarAssigneeFilter;
}[] = [
  {
    name: "All",
    icon: CircleDot,
    assignee: "me",
  },
  {
    name: "Mentioned",
    icon: AtSignIcon,
    assignee: "mention",
  },
  {
    name: "Unattended",
    icon: ShieldAlert,
    assignee: "unattended",
  },
];

interface TenantLabelItem {
  id: string;
  title: string;
  color: string;
  showOnSidebar: boolean;
}

const LABEL_FALLBACK_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

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

  const dataLabelObjects = coerceObjectArray(fromData?.labels);
  if (dataLabelObjects) return dataLabelObjects;

  const nestedPayloadObjects = coerceObjectArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayloadObjects) return nestedPayloadObjects;

  const nestedPayloadStrings = coerceStringArray(
    (fromData?.data as Record<string, unknown> | undefined)?.payload,
  );
  if (nestedPayloadStrings) return nestedPayloadStrings;

  return [];
}

function normalizeLabel(
  raw: string | Record<string, unknown>,
  index: number,
): TenantLabelItem | null {
  if (typeof raw === "string") {
    const title = raw.trim();
    return title
      ? {
          id: title,
          title,
          color: LABEL_FALLBACK_COLORS[index % LABEL_FALLBACK_COLORS.length],
          showOnSidebar: true,
        }
      : null;
  }

  const title = String(raw.title ?? raw.label ?? raw.name ?? "").trim();
  if (!title) return null;
  const color = String(raw.color ?? raw.colour ?? raw.hex_color ?? "").trim();

  return {
    id: String(raw.id ?? title),
    title,
    color: color || LABEL_FALLBACK_COLORS[index % LABEL_FALLBACK_COLORS.length],
    showOnSidebar: raw.show_on_sidebar !== false,
  };
}

function SidebarTooltip({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const openTimeoutRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const rect = triggerElement.getBoundingClientRect();
    setPosition({
      top: rect.top + rect.height / 2,
      left: rect.right + 6,
    });
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    updatePosition();

    const handleReposition = () => updatePosition();

    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isMounted, updatePosition]);

  const clearOpenTimeout = () => {
    if (openTimeoutRef.current !== null) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  };

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearOpenTimeout();
      clearCloseTimeout();
    };
  }, []);

  const handleOpen = () => {
    clearCloseTimeout();
    clearOpenTimeout();
    updatePosition();

    openTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    }, 180);
  };

  const handleClose = () => {
    clearOpenTimeout();
    clearCloseTimeout();
    setIsVisible(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      setIsMounted(false);
    }, 140);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null))
      return;
    handleClose();
  };

  return (
    <div
      ref={triggerRef}
      className="relative block"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocusCapture={handleOpen}
      onBlurCapture={handleBlur}
    >
      {children}
      {isMounted &&
        position &&
        createPortal(
          <div
            role="tooltip"
            className={cn(
              "pointer-events-none fixed z-1000 transition-all duration-150 ease-out",
              isVisible
                ? "translate-x-0 opacity-100 scale-100"
                : "translate-x-1 opacity-0 scale-95",
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
          >
            <div className="relative -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground pl-1.5 pr-2.5 py-1.5 text-[10px] font-medium leading-none text-background shadow-md">
              <span
                aria-hidden="true"
                className="absolute left-[2px] top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-foreground"
              />
              <span className="relative z-10">{title}</span>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface ChatNotificationSidebarProps {
  tenantId: string;
  isCollapsed: boolean;
  sidebarConversationAssignee: ConversationSidebarAssigneeFilter;
  sidebarInboxId: number | null;
  sidebarLabel: ConversationSidebarLabelFilter;
  isSwitchingMenu?: boolean;
  onSidebarConversationAssigneeChange: (
    value: ConversationSidebarAssigneeFilter,
  ) => void;
  onSidebarInboxChange: (inboxId: number | null) => void;
  onSidebarLabelChange: (label: ConversationSidebarLabelFilter) => void;
}

interface TenantInboxItem {
  id?: number | string;
  name?: string;
}

function CollapsedSidebarHoverMenu({
  title,
  icon,
  isActive = false,
  children,
}: {
  title: string;
  icon: ReactNode;
  isActive?: boolean;
  children: ReactNode;
}) {
  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={title}
          className={cn(
            "flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors",
            isActive
              ? "bg-accent text-accent-foreground"
              : "text-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {icon}
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        className="w-60 rounded-xl p-2"
      >
        <div className="px-2 pb-1 text-[11px] font-medium text-muted-foreground">
          {title}
        </div>
        <div className="space-y-1">{children}</div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function ChatNotificationSidebar({
  tenantId,
  isCollapsed,
  sidebarConversationAssignee,
  sidebarInboxId,
  sidebarLabel,
  isSwitchingMenu = false,
  onSidebarConversationAssigneeChange,
  onSidebarInboxChange,
  onSidebarLabelChange,
}: ChatNotificationSidebarProps) {
  const { data: inboxData } = useListTenantInboxes(tenantId);
  const { data: labelData } = useListTenantLabels(tenantId);
  const inboxPayload = (
    inboxData?.data as { chatwoot?: { payload?: unknown } } | undefined
  )?.chatwoot?.payload;
  const inboxes: TenantInboxItem[] = Array.isArray(inboxPayload)
    ? (inboxPayload as TenantInboxItem[])
    : [];
  const labels = useMemo(
    () =>
      extractRawLabels(labelData)
        .map((raw, index) => normalizeLabel(raw, index))
        .filter(
          (label): label is TenantLabelItem =>
            label !== null && label.showOnSidebar,
        ),
    [labelData],
  );
  const hasInboxSelection = typeof sidebarInboxId === "number";
  const hasLabelSelection = sidebarLabel !== null;
  const isConversationSelectionMode = !hasInboxSelection && !hasLabelSelection;

  if (isCollapsed) {
    return (
      <aside
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden border-r border-border bg-transparent text-foreground transition-all duration-200",
        )}
      >
        <div className="flex-1 space-y-2 overflow-x-hidden overflow-y-auto p-2">
          <section className="space-y-2" aria-label="Main Chat Menu">
            <SidebarTooltip title={menuItems[0].title}>
              <a
                href={menuItems[0].url}
                className="flex h-9 items-center justify-center rounded-md bg-accent text-sm font-medium text-accent-foreground transition-colors"
              >
                <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
              </a>
            </SidebarTooltip>

            <CollapsedSidebarHoverMenu
              title="Cuộc trò chuyện"
              isActive={isConversationSelectionMode}
              icon={
                <MessageCircle
                  className="h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              }
            >
              {conversationSubItems.map((subItem) => {
                const isActive =
                  isConversationSelectionMode &&
                  sidebarConversationAssignee === subItem.assignee;

                return (
                  <button
                    key={subItem.name}
                    type="button"
                    onClick={() =>
                      onSidebarConversationAssigneeChange(subItem.assignee)
                    }
                    disabled={isSwitchingMenu || isActive}
                    aria-pressed={isActive}
                    className={cn(
                      "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors disabled:pointer-events-none",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                      isSwitchingMenu && "opacity-80",
                    )}
                  >
                    <subItem.icon
                      className="h-3.5 w-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="truncate">{subItem.name}</span>
                  </button>
                );
              })}
            </CollapsedSidebarHoverMenu>

            <CollapsedSidebarHoverMenu
              title="Kênh"
              isActive={hasInboxSelection}
              icon={
                <FolderKanban className="h-4 w-4 shrink-0" aria-hidden="true" />
              }
            >
              {inboxes.length > 0 ? (
                inboxes.map((inbox) => {
                  const inboxId =
                    typeof inbox.id === "number"
                      ? inbox.id
                      : typeof inbox.id === "string"
                        ? Number(inbox.id)
                        : Number.NaN;
                  const inboxName =
                    typeof inbox?.name === "string" && inbox.name.length > 0
                      ? inbox.name
                      : "Kênh chưa đặt tên";
                  const isActive =
                    Number.isFinite(inboxId) &&
                    hasInboxSelection &&
                    sidebarInboxId === inboxId;

                  return (
                    <button
                      key={String(inbox?.id ?? inboxName)}
                      type="button"
                      onClick={() => {
                        if (Number.isFinite(inboxId)) {
                          onSidebarInboxChange(inboxId);
                        }
                      }}
                      disabled={
                        isSwitchingMenu || !Number.isFinite(inboxId) || isActive
                      }
                      aria-pressed={isActive}
                      className={cn(
                        "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors disabled:pointer-events-none",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isSwitchingMenu && "opacity-80",
                      )}
                    >
                      <MessageCircle
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{inboxName}</span>
                    </button>
                  );
                })
              ) : (
                <span
                  className={cn(
                    "block px-2 py-1 text-xs text-muted-foreground",
                    isSwitchingMenu && "opacity-80",
                  )}
                >
                  Chưa có kênh
                </span>
              )}
            </CollapsedSidebarHoverMenu>

            <CollapsedSidebarHoverMenu
              title="Theo nhãn"
              isActive={hasLabelSelection}
              icon={<Tag className="h-4 w-4 shrink-0" aria-hidden="true" />}
            >
              {labels.length > 0 ? (
                labels.map((label: TenantLabelItem) => {
                  const isActive = sidebarLabel === label.title;

                  return (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => onSidebarLabelChange(label.title)}
                      disabled={isSwitchingMenu || isActive}
                      aria-pressed={isActive}
                      className={cn(
                        "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors disabled:pointer-events-none",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isSwitchingMenu && "opacity-80",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-background/60"
                        style={{ backgroundColor: label.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{label.title}</span>
                    </button>
                  );
                })
              ) : (
                <span
                  className={cn(
                    "block px-2 py-1 text-xs text-muted-foreground",
                    isSwitchingMenu && "opacity-80",
                  )}
                >
                  Chưa có nhãn
                </span>
              )}
            </CollapsedSidebarHoverMenu>
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden border-r border-border bg-transparent text-foreground transition-all duration-200",
      )}
    >
      <div className="flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-2">
        <section className="space-y-1" aria-label="Main Chat Menu">
          <SidebarTooltip title={menuItems[0].title}>
            <a
              href={menuItems[0].url}
              className={cn(
                "flex h-9 items-center rounded-md text-sm transition-colors bg-accent text-accent-foreground font-medium",
                isCollapsed ? "justify-center px-0" : "gap-3 px-2",
              )}
            >
              <Inbox className="h-4 w-4 shrink-0" aria-hidden="true" />
              {!isCollapsed && <span className="truncate">Hộp thư</span>}
            </a>
          </SidebarTooltip>

          <Collapsible defaultOpen>
            <SidebarTooltip title="Cuộc trò chuyện">
              <CollapsibleTrigger
                className={cn(
                  "group flex h-9 w-full items-center rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed ? "justify-center px-0" : "justify-between px-2",
                )}
              >
                <span
                  className={cn(
                    "flex items-center truncate",
                    isCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  <MessageCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {!isCollapsed && "Cuộc trò chuyện"}
                </span>
                {!isCollapsed && (
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                )}
              </CollapsibleTrigger>
            </SidebarTooltip>
            <CollapsibleContent
              className={cn(
                "mt-1 space-y-1",
                !isCollapsed && "pl-4",
                isCollapsed && "hidden",
              )}
            >
              {conversationSubItems.map((subItem) => {
                const isActive =
                  isConversationSelectionMode &&
                  sidebarConversationAssignee === subItem.assignee;
                return (
                  <SidebarTooltip key={subItem.name} title={subItem.name}>
                    <button
                      type="button"
                      onClick={() =>
                        onSidebarConversationAssigneeChange(subItem.assignee)
                      }
                      disabled={isSwitchingMenu || isActive}
                      className={cn(
                        "relative flex h-8 w-full items-center rounded-md text-sm transition-colors text-left disabled:pointer-events-none",
                        isActive
                          ? "text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isSwitchingMenu && "opacity-80",
                        isCollapsed ? "justify-center px-0" : "gap-2 px-2",
                      )}
                      aria-pressed={isActive}
                      aria-label={subItem.name}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="conversation-sidebar-active-item"
                          transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 32,
                          }}
                          className="absolute inset-0 rounded-md bg-accent"
                          aria-hidden="true"
                        />
                      )}
                      <subItem.icon
                        className="relative z-10 h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <span className="relative z-10 truncate">
                          {subItem.name}
                        </span>
                      )}
                    </button>
                  </SidebarTooltip>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <SidebarTooltip title="Kênh">
              <CollapsibleTrigger
                className={cn(
                  "group flex h-9 w-full items-center rounded-md px-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed ? "justify-center px-0" : "justify-between px-2",
                )}
              >
                <span
                  className={cn(
                    "flex items-center truncate",
                    isCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  <FolderKanban
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {!isCollapsed && "Kênh"}
                </span>
                {!isCollapsed && (
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                )}
              </CollapsibleTrigger>
            </SidebarTooltip>
            <CollapsibleContent
              className={cn(
                "mt-1 space-y-1",
                !isCollapsed && "pl-4",
                isCollapsed && "hidden",
              )}
            >
              {inboxes.map((inbox) => {
                const inboxId =
                  typeof inbox.id === "number"
                    ? inbox.id
                    : typeof inbox.id === "string"
                      ? Number(inbox.id)
                      : Number.NaN;
                const inboxName =
                  typeof inbox?.name === "string" && inbox.name.length > 0
                    ? inbox.name
                    : "Kênh chưa đặt tên";
                const isActive =
                  Number.isFinite(inboxId) &&
                  hasInboxSelection &&
                  sidebarInboxId === inboxId;

                return (
                  <SidebarTooltip
                    key={String(inbox?.id ?? inboxName)}
                    title={inboxName}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (Number.isFinite(inboxId)) {
                          onSidebarInboxChange(inboxId);
                        }
                      }}
                      disabled={
                        isSwitchingMenu || !Number.isFinite(inboxId) || isActive
                      }
                      aria-pressed={isActive}
                      aria-label={inboxName}
                      className={cn(
                        "relative flex h-8 w-full items-center rounded-md text-sm transition-colors text-left disabled:pointer-events-none",
                        isActive
                          ? "text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isSwitchingMenu && "opacity-80",
                        isCollapsed ? "justify-center px-0" : "gap-2 px-2",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="channel-sidebar-active-item"
                          transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 32,
                          }}
                          className="absolute inset-0 rounded-md bg-accent"
                          aria-hidden="true"
                        />
                      )}
                      <MessageCircle
                        className="relative z-10 h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <span className="relative z-10 truncate">
                          {inboxName}
                        </span>
                      )}
                    </button>
                  </SidebarTooltip>
                );
              })}
              {inboxes.length === 0 && !isCollapsed && (
                <span
                  className={cn(
                    "block px-2 text-xs text-muted-foreground",
                    isSwitchingMenu && "opacity-80",
                  )}
                >
                  Chưa có kênh
                </span>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <SidebarTooltip title="Theo nhãn">
              <CollapsibleTrigger
                className={cn(
                  "group flex h-9 w-full items-center rounded-md px-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                  isCollapsed ? "justify-center px-0" : "justify-between px-2",
                )}
              >
                <span
                  className={cn(
                    "flex items-center truncate",
                    isCollapsed ? "justify-center" : "gap-3",
                  )}
                >
                  <Tag className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!isCollapsed && "Theo nhãn"}
                </span>
                {!isCollapsed && (
                  <ChevronDown
                    className="h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                )}
              </CollapsibleTrigger>
            </SidebarTooltip>
            <CollapsibleContent
              className={cn(
                "mt-1 space-y-1",
                !isCollapsed && "pl-4",
                isCollapsed && "hidden",
              )}
            >
              {labels.map((label: TenantLabelItem) => {
                const isActive = sidebarLabel === label.title;

                return (
                  <SidebarTooltip key={label.id} title={label.title}>
                    <button
                      type="button"
                      onClick={() => onSidebarLabelChange(label.title)}
                      disabled={isSwitchingMenu || isActive}
                      aria-pressed={isActive}
                      aria-label={label.title}
                      className={cn(
                        "relative flex h-8 w-full items-center rounded-md text-sm transition-colors text-left disabled:pointer-events-none",
                        isActive
                          ? "text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground",
                        isSwitchingMenu && "opacity-80",
                        isCollapsed ? "justify-center px-0" : "gap-2 px-2",
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="label-sidebar-active-item"
                          transition={{
                            type: "spring",
                            stiffness: 360,
                            damping: 32,
                          }}
                          className="absolute inset-0 rounded-md bg-accent"
                          aria-hidden="true"
                        />
                      )}
                      <span
                        className="relative z-10 h-3.5 w-3.5 shrink-0 rounded-full border border-background/60"
                        style={{ backgroundColor: label.color }}
                        aria-hidden="true"
                      />
                      {!isCollapsed && (
                        <span className="relative z-10 truncate">
                          {label.title}
                        </span>
                      )}
                    </button>
                  </SidebarTooltip>
                );
              })}

              {labels.length === 0 && !isCollapsed && (
                <span
                  className={cn(
                    "block px-2 text-xs text-muted-foreground",
                    isSwitchingMenu && "opacity-80",
                  )}
                >
                  Chưa có nhãn
                </span>
              )}
            </CollapsibleContent>
          </Collapsible>
        </section>
      </div>
    </aside>
  );
}
