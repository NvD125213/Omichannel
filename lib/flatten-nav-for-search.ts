import { IconLayoutDashboard } from "@tabler/icons-react";
import type { ElementType } from "react";
import type { LinkProps } from "next/link";
import type { NavGroup } from "@/lib/types";

export interface NavSearchItem {
  title: string;
  url: string;
  group: string;
  icon: ElementType;
}

const hrefToString = (url: LinkProps["href"]): string | null => {
  if (typeof url === "string") return url;
  return null;
};

/** Chuyển nav groups (sidebar) thành danh sách tìm kiếm — gồm cả mục con. */
export function flattenNavGroupsForSearch(
  navGroups: NavGroup[],
): NavSearchItem[] {
  const items: NavSearchItem[] = [];
  const seenUrls = new Set<string>();

  const pushItem = (
    groupTitle: string,
    title: string,
    url: LinkProps["href"],
    icon?: ElementType,
  ) => {
    const href = hrefToString(url);
    if (!href || seenUrls.has(href)) return;

    seenUrls.add(href);
    items.push({
      title,
      url: href,
      group: groupTitle,
      icon: icon ?? IconLayoutDashboard,
    });
  };

  for (const group of navGroups) {
    for (const item of group.items) {
      if ("url" in item && item.url) {
        pushItem(group.title, item.title, item.url, item.icon);
      }

      if ("items" in item && item.items) {
        for (const subItem of item.items) {
          pushItem(
            group.title,
            subItem.title,
            subItem.url,
            subItem.icon ?? item.icon,
          );
        }
      }
    }
  }

  return items;
}
