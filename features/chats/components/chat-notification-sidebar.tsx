"use client";

import type { FocusEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  CircleDot,
  FolderKanban,
  Inbox,
  MessageCircle,
  ShieldAlert,
  AtSignIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useListTenantInboxes } from "@/hooks/chatwoot/use-chatwoot";

/** Giá trị filter sẽ map vào query `conversation_type` */
export type ConversationSidebarAssigneeFilter = "me" | "mention" | "unattended";

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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

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
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
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
  isSwitchingMenu?: boolean;
  onSidebarConversationAssigneeChange: (
    value: ConversationSidebarAssigneeFilter,
  ) => void;
  onSidebarInboxChange: (inboxId: number | null) => void;
}

interface TenantInboxItem {
  id?: number | string;
  name?: string;
}

export function ChatNotificationSidebar({
  tenantId,
  isCollapsed,
  sidebarConversationAssignee,
  sidebarInboxId,
  isSwitchingMenu = false,
  onSidebarConversationAssigneeChange,
  onSidebarInboxChange,
}: ChatNotificationSidebarProps) {
  const { data: inboxData } = useListTenantInboxes(tenantId);
  const inboxPayload = (
    inboxData?.data as { chatwoot?: { payload?: unknown } } | undefined
  )?.chatwoot?.payload;
  const inboxes: TenantInboxItem[] = Array.isArray(inboxPayload)
    ? (inboxPayload as TenantInboxItem[])
    : [];

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r border-border bg-background text-foreground transition-all duration-200 overflow-visible w-full",
      )}
    >
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
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
                  sidebarConversationAssignee === subItem.assignee;
                return (
                  <SidebarTooltip key={subItem.name} title={subItem.name}>
                    <button
                      type="button"
                      onClick={() =>
                        onSidebarConversationAssigneeChange(subItem.assignee)
                      }
                      disabled={
                        isSwitchingMenu ||
                        sidebarConversationAssignee === subItem.assignee
                      }
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
                  Number.isFinite(inboxId) && sidebarInboxId === inboxId;

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
                      disabled={isSwitchingMenu || !Number.isFinite(inboxId)}
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
        </section>
      </div>
    </aside>
  );
}
