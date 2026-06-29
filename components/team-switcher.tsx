"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
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
import { useGraphAccess } from "@/hooks/use-graph-id";

const APP_LOGO_SRC = "/logocon/logo_icon_1.png";

const DASHBOARD_WORKSPACE = {
  id: "dashboard",
  name: "OMNI HUB",
  plan: "Mặc định",
  href: "/dashboard",
} as const;

const CHATBOT_WORKSPACE = {
  id: "chatbot",
  name: "Hệ thống Agent",
  plan: "A.I Agent",
  href: "/ai/dashboard",
} as const;

const WORKSPACES = [DASHBOARD_WORKSPACE, CHATBOT_WORKSPACE] as const;

type Workspace = (typeof WORKSPACES)[number];

function isWorkspaceActive(pathname: string, workspace: Workspace) {
  return workspace.id === "chatbot"
    ? isChatbotPath(pathname)
    : !isChatbotPath(pathname);
}

export function TeamSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, state } = useSidebar();
  const { hasGraphAccess } = useGraphAccess();
  const isCollapsed = state === "collapsed";

  const availableWorkspaces = useMemo(
    () =>
      hasGraphAccess
        ? [...WORKSPACES]
        : WORKSPACES.filter((workspace) => workspace.id !== "chatbot"),
    [hasGraphAccess],
  );

  const activeWorkspace = useMemo(() => {
    const matched = availableWorkspaces.find((workspace) =>
      isWorkspaceActive(pathname, workspace),
    );
    return matched ?? DASHBOARD_WORKSPACE;
  }, [availableWorkspaces, pathname]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    if (isWorkspaceActive(pathname, workspace)) return;
    router.push(workspace.href);
  };

  const workspaceButton = (
    <SidebarMenuButton
      size="lg"
      className="group/team relative overflow-hidden data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
    >
      <div className="relative size-8 shrink-0 overflow-hidden rounded-lg transition-transform group-hover/team:scale-[1.02]">
        <Image
          src={APP_LOGO_SRC}
          alt={`Logo ${activeWorkspace.name}`}
          fill
          sizes="32px"
          priority
          className="object-contain"
        />
      </div>

      {!isCollapsed && (
        <>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{activeWorkspace.name}</span>
            <span className="truncate text-xs text-white">
              {activeWorkspace.plan}
            </span>
          </div>
          {availableWorkspaces.length > 1 && (
            <ChevronsUpDown className="ml-auto size-4 shrink-0 text-white" />
          )}
        </>
      )}
    </SidebarMenuButton>
  );

  if (availableWorkspaces.length <= 1) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>{workspaceButton}</SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{workspaceButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-50"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
              Chuyển hệ thống
            </DropdownMenuLabel>
            {availableWorkspaces.map((workspace) => {
              const isActive = isWorkspaceActive(pathname, workspace);

              return (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  className="gap-3 p-2.5 cursor-pointer rounded-lg transition-colors"
                >
                  <div className="relative size-8 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted/30">
                    <Image
                      src={APP_LOGO_SRC}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-contain p-1"
                    />
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
