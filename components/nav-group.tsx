"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NavCollapsible, NavItem, NavLink, type NavGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Badge } from "./ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "./ui/sidebar";

export function NavGroup({ title, items }: NavGroup) {
  const pathName = usePathname();
  const { state } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-sidebar-foreground/70">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const key = `${item.title}-${item.url}`;

          if (!item.items)
            return <SidebarMenuLink key={key} item={item} href={pathName} />;

          if (state === "collapsed")
            return (
              <SidebarMenuCollapsedDropdown
                key={key}
                item={item}
                href={pathName}
              />
            );

          return (
            <SidebarMenuCollapsible key={key} item={item} href={pathName} />
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

type NavBadgeColor =
  | "violet"
  | "green"
  | "teal"
  | "red"
  | "blue"
  | "yellow"
  | "purple"
  | "orange"
  | "pink"
  | "indigo"
  | "default";

const NAV_BADGE_COLORS: Record<NavBadgeColor, string> = {
  violet: "bg-sidebar-primary/15 text-sidebar-primary",
  green: "bg-green-500/15 text-green-400",
  teal: "bg-teal-500/15 text-teal-400",
  red: "bg-red-500/15 text-red-400",
  blue: "bg-blue-500/15 text-blue-400",
  yellow: "bg-amber-500/15 text-amber-400",
  purple: "bg-purple-500/15 text-purple-400",
  orange: "bg-orange-500/15 text-orange-400",
  pink: "bg-pink-500/15 text-pink-400",
  indigo: "bg-indigo-500/15 text-indigo-400",
  default: "bg-sidebar-foreground/15 text-sidebar-foreground",
};

const NavBadge = ({
  children,
  color = "violet",
}: {
  children: ReactNode;
  color?: NavBadgeColor;
}) => {
  const colorClasses = NAV_BADGE_COLORS[color] ?? NAV_BADGE_COLORS.violet;

  return (
    <Badge
      className={cn(
        "ml-auto rounded-full border-0 px-2 py-0.5 text-[10px] font-medium",
        colorClasses,
      )}
    >
      {children}
    </Badge>
  );
};

const SidebarMenuLink = ({ item, href }: { item: NavLink; href: string }) => {
  const { setOpenMobile } = useSidebar();
  const isActive = checkIsActive(href, item);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className={cn(
          "group/link relative transition-all duration-200",
          isActive && "bg-sidebar-primary/10 text-sidebar-primary",
        )}
      >
        <Link href={item.url} onClick={() => setOpenMobile(false)}>
          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
          )}
          {item.icon && (
            <item.icon
              className={cn(
                "transition-colors",
                isActive
                  ? "text-sidebar-primary"
                  : "text-sidebar-foreground/80 group-hover/link:text-sidebar-foreground",
              )}
            />
          )}
          <span className="font-medium">{item.title}</span>
          {item.badge && (
            <NavBadge color={item.badgeColor}>{item.badge}</NavBadge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const SidebarMenuCollapsible = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  const { setOpenMobile } = useSidebar();
  const isActive = checkIsActive(href, item, true);

  return (
    <Collapsible asChild defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(
              "group/link transition-all duration-200",
              isActive && "text-sidebar-primary",
            )}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/80 group-hover/link:text-sidebar-foreground",
                )}
              />
            )}
            <span className="font-medium">{item.title}</span>
            {item.badge && (
              <NavBadge color={item.badgeColor}>{item.badge}</NavBadge>
            )}
            <ChevronRight className="ml-auto size-4 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent">
          <SidebarMenuSub className="border-l-2 border-sidebar-primary/20 ml-3.5">
            {item.items.map((subItem) => {
              const isSubActive = checkIsActive(href, subItem);
              return (
                <SidebarMenuSubItem key={subItem.title}>
                  <SidebarMenuSubButton
                    asChild
                    isActive={isSubActive}
                    className={cn(
                      "transition-all duration-200",
                      isSubActive &&
                        "bg-sidebar-primary/10 text-sidebar-primary",
                    )}
                  >
                    <Link
                      href={subItem.url}
                      onClick={() => setOpenMobile(false)}
                    >
                      {subItem.icon && (
                        <subItem.icon className="size-4 text-white!" />
                      )}
                      <span>{subItem.title}</span>
                      {subItem.badge && (
                        <NavBadge color={subItem.badgeColor}>
                          {subItem.badge}
                        </NavBadge>
                      )}
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              );
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const SidebarMenuCollapsedDropdown = ({
  item,
  href,
}: {
  item: NavCollapsible;
  href: string;
}) => {
  const isActive = checkIsActive(href, item, true);

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(
              "transition-all duration-200",
              isActive && "bg-sidebar-primary/10 text-sidebar-primary",
            )}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/80",
                )}
              />
            )}
            <span className="font-medium">{item.title}</span>
            {item.badge && (
              <NavBadge color={item.badgeColor}>{item.badge}</NavBadge>
            )}
            <ChevronRight className="ml-auto size-4 text-sidebar-foreground/70 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={4}
          className="min-w-52 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-xl"
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            {item.title}
            {item.badge && (
              <span className="bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {item.badge}
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-border/50" />
          {item.items.map((sub) => {
            const isSubActive = checkIsActive(href, sub);
            return (
              <DropdownMenuItem
                key={`${sub.title}-${sub.url}`}
                asChild
                className="rounded-lg"
              >
                <Link
                  href={sub.url}
                  className={cn(
                    "flex items-center gap-2 px-2 py-2",
                    isSubActive &&
                      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                  )}
                >
                  {sub.icon && <sub.icon className="size-4" />}
                  <span className="max-w-52 text-wrap">{sub.title}</span>
                  {sub.badge && (
                    <span className="ml-auto text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">
                      {sub.badge}
                    </span>
                  )}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

function checkIsActive(href: string, item: NavItem, mainNav = false) {
  return (
    href === item.url ||
    href.split("?")[0] === item.url ||
    !!item?.items?.filter((i) => i.url === href).length ||
    (mainNav &&
      href.split("/")[1] !== "" &&
      href.split("/")[1] === item?.url?.toString().split("/")[1])
  );
}
