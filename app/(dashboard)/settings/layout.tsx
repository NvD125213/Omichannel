"use client";

import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS, type Permission } from "@/constants/permission";
import { cn } from "@/lib/utils";
import {
  IconMessageCircle,
  IconSubtitles,
  IconTag,
  IconUsers,
} from "@tabler/icons-react";
import { Building2, Monitor, Palette, UserCog } from "lucide-react";
import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";

type SettingsNavItem = {
  title: string;
  href: string;
  icon: ElementType<{ className?: string }>;
  /** hasAny — empty/undefined = luôn hiện (đã đăng nhập) */
  permissions?: Permission[];
  /** Ẩn với platform admin (`is_platform_admin === true`). */
  hideForPlatformAdmin?: boolean;
};

type SettingsNavGroup = {
  title: string;
  items: SettingsNavItem[];
};

const settingsNavGroups: SettingsNavGroup[] = [
  {
    title: "Tài khoản",
    items: [
      {
        title: "Hồ sơ cá nhân",
        href: "/settings",
        icon: UserCog,
      },
    ],
  },
  {
    title: "Vận hành",
    items: [
      {
        title: "Trạng thái doanh nghiệp",
        href: "/settings/tenant",
        icon: Building2,
        hideForPlatformAdmin: true,
        permissions: [
          PERMISSIONS.VIEW_OWN_TENANT_SETTINGS,
          PERMISSIONS.EDIT_OWN_TENANT_SETTINGS,
        ],
      },
      {
        title: "Nhân viên hỗ trợ",
        href: "/settings/agent",
        icon: IconSubtitles,
        permissions: [
          PERMISSIONS.VIEW_MESSAGING_AGENTS,
          PERMISSIONS.CREATE_MESSAGING_AGENT,
          PERMISSIONS.EDIT_MESSAGING_AGENT,
        ],
      },
      {
        title: "Quản lý nhãn",
        href: "/settings/label",
        icon: IconTag,
        permissions: [
          PERMISSIONS.VIEW_MESSAGING_LABELS,
          PERMISSIONS.CREATE_MESSAGING_LABEL,
        ],
      },
      {
        title: "Quản lý đội nhóm",
        href: "/settings/team",
        icon: IconUsers,
        permissions: [
          PERMISSIONS.VIEW_MESSAGING_TEAMS,
          PERMISSIONS.CREATE_MESSAGING_TEAM,
        ],
      },
      {
        title: "Quản lý kênh",
        href: "/settings/channel",
        icon: IconMessageCircle,
        permissions: [
          PERMISSIONS.VIEW_MESSAGING_INBOXES,
          PERMISSIONS.CREATE_MESSAGING_INBOX,
        ],
      },
    ],
  },
  {
    title: "Giao diện",
    items: [
      {
        title: "Giao diện",
        href: "/settings/appearance",
        icon: Palette,
      },
      {
        title: "Hiển thị",
        href: "/settings/display",
        icon: Monitor,
      },
    ],
  },
];

function isNavItemActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function filterSettingsGroups(
  groups: SettingsNavGroup[],
  userPermissions: string[],
  isPlatformAdmin: boolean,
): SettingsNavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.hideForPlatformAdmin && isPlatformAdmin) return false;
        if (!item.permissions?.length) return true;
        return item.permissions.some((p) => userPermissions.includes(p));
      }),
    }))
    .filter((group) => group.items.length > 0);
}

interface SettingsNavProps {
  groups: SettingsNavGroup[];
  items: SettingsNavItem[];
  className?: string;
}

function SidebarNav({ groups, className }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-5", className)}>
      {groups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = isNavItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-9 w-full justify-start gap-2 px-3 text-sm font-normal",
                    isActive
                      ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarNavMobile({ items }: SettingsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentItem =
    items.find((item) => isNavItemActive(pathname, item.href)) ?? items[0];
  if (!currentItem) return null;
  const CurrentIcon = currentItem.icon;

  return (
    <Select
      value={currentItem.href}
      onValueChange={(value) => router.push(value)}
    >
      <SelectTrigger className="h-10 w-full">
        <SelectValue>
          <span className="flex items-center gap-2">
            <CurrentIcon className="size-4 shrink-0" />
            <span className="truncate">{currentItem.title}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <SelectItem
              key={item.href}
              value={item.href}
              className={cn(
                "cursor-pointer",
                isActive &&
                  "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary",
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" />
                {item.title}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function SidebarNavTabs({ items }: SettingsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeItem =
    items.find((item) => isNavItemActive(pathname, item.href))?.href ??
    "/settings";

  return (
    <Tabs value={activeItem} onValueChange={(value) => router.push(value)}>
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto bg-muted/50 p-1">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <TabsTrigger
              key={item.href}
              value={item.href}
              className={cn(
                "shrink-0 gap-1.5 px-3 py-1.5 text-muted-foreground",
                "data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="whitespace-nowrap">{item.title}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { permissions, isPlatformAdmin } = useAuth();

  const filteredGroups = useMemo(
    () =>
      filterSettingsGroups(
        settingsNavGroups,
        permissions ?? [],
        isPlatformAdmin,
      ),
    [permissions, isPlatformAdmin],
  );
  const filteredItems = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups],
  );

  const navProps: SettingsNavProps = {
    groups: filteredGroups,
    items: filteredItems,
  };

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 lg:mx-6">
        <div className="mt-4 md:hidden">
          <SidebarNavMobile {...navProps} />
        </div>
        <div className="mt-4 hidden md:block lg:hidden">
          <SidebarNavTabs {...navProps} />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r px-4 py-5 lg:block xl:w-64 xl:px-5">
          <SidebarNav className="sticky top-0" {...navProps} />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
