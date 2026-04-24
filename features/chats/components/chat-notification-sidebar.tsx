"use client";

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  { name: "Tất cả", icon: CircleDot, assignee: "me" },
  { name: "Nhắn đến", icon: AtSignIcon, assignee: "mention" },
  { name: "Không giám sát", icon: ShieldAlert, assignee: "unattended" },
];

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
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">Hộp thư</TooltipContent>
            )}
          </Tooltip>

          <Collapsible defaultOpen>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "group flex h-9 w-full items-center rounded-md text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed
                      ? "justify-center px-0"
                      : "justify-between px-2",
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
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Cuộc trò chuyện</TooltipContent>
              )}
            </Tooltip>
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
                  <Tooltip key={subItem.name}>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        {subItem.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          <Collapsible defaultOpen>
            <Tooltip>
              <TooltipTrigger asChild>
                <CollapsibleTrigger
                  className={cn(
                    "group flex h-9 w-full items-center rounded-md px-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground",
                    isCollapsed
                      ? "justify-center px-0"
                      : "justify-between px-2",
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
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">Kênh</TooltipContent>
              )}
            </Tooltip>
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
                  <Tooltip key={String(inbox?.id ?? inboxName)}>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">{inboxName}</TooltipContent>
                    )}
                  </Tooltip>
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
