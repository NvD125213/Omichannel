import { NavGroup, NavItem } from "@/lib/types";

type NavAccessItem = {
  permissions?: string[];
  requirePlatformAdmin?: boolean;
};

function canSeeNavEntry(
  item: NavAccessItem,
  userPermissions: string[],
  isPlatformAdmin: boolean,
): boolean {
  if (item.requirePlatformAdmin && !isPlatformAdmin) {
    return false;
  }
  if (!item.permissions || item.permissions.length === 0) {
    return true;
  }
  return item.permissions.some((permission) =>
    userPermissions.includes(permission),
  );
}

/**
 * Filter nav items based on user permissions
 * @param items - Array of nav items
 * @param userPermissions - Array of user's permissions
 * @param isPlatformAdmin - `is_platform_admin` from `/user/current`
 * @returns Filtered array of nav items
 */
export function filterNavItemsByPermissions(
  items: NavItem[],
  userPermissions: string[],
  isPlatformAdmin = false,
): NavItem[] {
  return items
    .filter((item) => canSeeNavEntry(item, userPermissions, isPlatformAdmin))
    .map((item) => {
      if ("items" in item && item.items) {
        const filteredNestedItems = item.items.filter((nestedItem) =>
          canSeeNavEntry(nestedItem, userPermissions, isPlatformAdmin),
        );

        return {
          ...item,
          items: filteredNestedItems,
        } as NavItem;
      }
      return item;
    })
    .filter((item) => {
      if ("items" in item && item.items) {
        return item.items.length > 0;
      }
      return true;
    });
}

/**
 * Filter nav groups based on user permissions
 * @param navGroups - Array of nav groups
 * @param userPermissions - Array of user's permissions
 * @param isPlatformAdmin - `is_platform_admin` from `/user/current`
 * @returns Filtered array of nav groups
 */
export function filterNavGroupsByPermissions(
  navGroups: NavGroup[],
  userPermissions: string[],
  isPlatformAdmin = false,
): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: filterNavItemsByPermissions(
        group.items,
        userPermissions,
        isPlatformAdmin,
      ),
    }))
    .filter((group) => group.items.length > 0);
}

/**
 * Check if a single nav item should be visible
 * @param item - Nav item to check
 * @param userPermissions - Array of user's permissions
 * @param isPlatformAdmin - `is_platform_admin` from `/user/current`
 * @returns boolean
 */
export function canAccessNavItem(
  item: NavItem,
  userPermissions: string[],
  isPlatformAdmin = false,
): boolean {
  return canSeeNavEntry(item, userPermissions, isPlatformAdmin);
}
