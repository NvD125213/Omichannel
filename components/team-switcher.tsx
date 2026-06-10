"use client";

import { Bot, Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRouter } from "nextjs-toploader/app";
import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { isChatbotPath } from "@/constants/chatbot-routes";
import { cn } from "@/lib/utils";

const APP_LOGO_SRC = "/logocon/logo_icon_1.png";

const DASHBOARD_WORKSPACE = {
  id: "dashboard",
  name: "OMNI HUB",
  plan: "Mặc định",
  href: "/dashboard",
} as const;

const CHATBOT_WORKSPACE = {
  id: "chatbot",
  name: "Hệ thống A.I Agent",
  plan: "A.I Agent",
  href: "/ai-dashboard",
} as const;

const WORKSPACES = [DASHBOARD_WORKSPACE, CHATBOT_WORKSPACE] as const;

type Workspace = (typeof WORKSPACES)[number];

function resolveWorkspace(pathname: string): Workspace {
  return isChatbotPath(pathname) ? CHATBOT_WORKSPACE : DASHBOARD_WORKSPACE;
}

function isWorkspaceActive(pathname: string, workspace: Workspace) {
  return workspace.id === "chatbot"
    ? isChatbotPath(pathname)
    : !isChatbotPath(pathname);
}

export function TeamSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const activeWorkspace = useMemo(() => resolveWorkspace(pathname), [pathname]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    if (pathname === workspace.href) return;
    router.push(workspace.href);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group/team relative overflow-hidden data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div
                className={cn(
                  "relative size-8 shrink-0 overflow-hidden rounded-lg transition-transform group-hover/team:scale-[1.02]",
                  activeWorkspace.id === "chatbot" &&
                    "flex items-center justify-center",
                )}
              >
                {activeWorkspace.id === "chatbot" ? (
                  <Bot className="size-5 text-violet-600 dark:text-violet-400" />
                ) : (
                  <Image
                    src={APP_LOGO_SRC}
                    alt={`Logo ${activeWorkspace.name}`}
                    fill
                    sizes="32px"
                    priority
                    className="object-contain"
                  />
                )}
              </div>

              {!isCollapsed && (
                <>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {activeWorkspace.name}
                    </span>
                    <span className="truncate text-xs text-white">
                      {activeWorkspace.plan}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 shrink-0 text-white" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-50"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Chuyển hệ thống
            </DropdownMenuLabel>
            {WORKSPACES.map((workspace) => {
              const isActive = isWorkspaceActive(pathname, workspace);

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className="gap-3 p-2.5 cursor-pointer rounded-lg transition-colors"
                >
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border",
                      workspace.id === "chatbot"
                        ? "border-violet-500/20 bg-linear-to-br from-violet-500/10 to-fuchsia-500/10"
                        : "border-border/60 bg-muted/30",
                    )}
                  >
                    {workspace.id === "chatbot" ? (
                      <Bot className="size-4 text-violet-600 dark:text-violet-400" />
                    ) : (
                      <div className="relative size-6">
                        <Image
                          src={APP_LOGO_SRC}
                          alt=""
                          fill
                          sizes="24px"
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{workspace.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {workspace.plan}
                    </div>
                  </div>
                  {isActive && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
