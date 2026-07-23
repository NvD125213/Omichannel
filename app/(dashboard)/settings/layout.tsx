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
import { cn } from "@/lib/utils";
import {
  IconMessageCircle,
  IconSubtitles,
  IconTag,
  IconUsers,
} from "@tabler/icons-react";
import { Monitor, Palette, UserCog, Wrench } from "lucide-react";
import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type SettingsNavItem = {
  title: string;
  href: string;
  icon: ElementType<{ className?: string }>;
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
        title: "Nhân viên hỗ trợ",
        href: "/settings/agent",
        icon: IconSubtitles,
      },
      {
        title: "Quản lý nhãn",
        href: "/settings/label",
        icon: IconTag,
      },
      {
        title: "Quản lý đội nhóm",
        href: "/settings/team",
        icon: IconUsers,
      },
      {
        title: "Quản lý kênh",
        href: "/settings/channel",
        icon: IconMessageCircle,
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

const settingsNavItems = settingsNavGroups.flatMap((group) => group.items);

function isNavItemActive(pathname: string, href: string) {
  if (href === "/settings") return pathname === "/settings";
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SettingsNavProps {
  groups?: SettingsNavGroup[];
  items?: SettingsNavItem[];
  className?: string;
}

function SidebarNav({
  groups = settingsNavGroups,
  className,
}: SettingsNavProps) {
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

function SidebarNavMobile({ items = settingsNavItems }: SettingsNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentItem =
    items.find((item) => isNavItemActive(pathname, item.href)) ?? items[0];
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

function SidebarNavTabs({ items = settingsNavItems }: SettingsNavProps) {
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
  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col">
      <div className="shrink-0 border-b px-4 py-4 lg:px-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Cài đặt</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý hồ sơ, nhân sự và các thiết lập hiển thị của tài khoản.
          </p>
        </div>

        <div className="mt-4 md:hidden">
          <SidebarNavMobile />
        </div>
        <div className="mt-4 hidden md:block lg:hidden">
          <SidebarNavTabs />
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r px-4 py-5 lg:block xl:w-64 xl:px-5">
          <SidebarNav className="sticky top-0" />
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-6 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
