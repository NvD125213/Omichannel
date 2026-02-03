import { NavGroup, NavItem } from "@/lib/types";

/**
 * Filter nav items based on user permissions
 * @param items - Array of nav items
 * @param userPermissions - Array of user's permissions
 * @returns Filtered array of nav items
 */
export function filterNavItemsByPermissions(
  items: NavItem[],
  userPermissions: string[],
): NavItem[] {
  return items
    .filter((item) => {
      // Nếu item không có permissions requirement -> show
      if (!item.permissions || item.permissions.length === 0) {
        return true;
      }

      // Check nếu user có ít nhất 1 permission trong danh sách required
      return item.permissions.some((permission) =>
        userPermissions.includes(permission),
      );
    })
    .map((item) => {
      // Nếu item có nested items (collapsible), filter nested items
      if ("items" in item && item.items) {
        const filteredNestedItems = item.items.filter((nestedItem) => {
          if (!nestedItem.permissions || nestedItem.permissions.length === 0) {
            return true;
          }
          return nestedItem.permissions.some((permission) =>
            userPermissions.includes(permission),
          );
        });

        return {
          ...item,
          items: filteredNestedItems,
        } as NavItem;
      }
      return item;
    })
    .filter((item) => {
      // Remove collapsible items nếu không còn nested items nào sau khi filter
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
 * @returns Filtered array of nav groups
 */
export function filterNavGroupsByPermissions(
  navGroups: NavGroup[],
  userPermissions: string[],
): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: filterNavItemsByPermissions(group.items, userPermissions),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
}

/**
 * Check if a single nav item should be visible
 * @param item - Nav item to check
 * @param userPermissions - Array of user's permissions
 * @returns boolean
 */
export function canAccessNavItem(
  item: NavItem,
  userPermissions: string[],
): boolean {
  if (!item.permissions || item.permissions.length === 0) {
    return true;
  }

  return item.permissions.some((permission) =>
    userPermissions.includes(permission),
  );
}
