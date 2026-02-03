import { PERMISSIONS } from "./permission";

/**
 * Route permissions mapping
 * Định nghĩa permissions cần thiết cho từng route
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  // Dashboard
  "/dashboard": [],
  "/dashboard2": [],
  "/payment-dashboard": [],
  "/payment-transactions": [],

  // Users
  "/users": [PERMISSIONS.VIEW_USERS],

  // Departments
  "/departments": [PERMISSIONS.VIEW_DEPARTMENTS],

  // Roles & Permissions
  "/roles": [PERMISSIONS.VIEW_ROLES],
  "/permissions": [PERMISSIONS.VIEW_PERMISSIONS],

  // Tickets
  "/tickets": [PERMISSIONS.VIEW_TICKETS],
  "/tickets/flows": [PERMISSIONS.VIEW_TICKET_FLOWS],
  "/tickets/templates": [PERMISSIONS.VIEW_TICKET_TEMPLATES],

  // Groups
  "/groups": [PERMISSIONS.VIEW_GROUPS],

  // Levels
  "/levels": [PERMISSIONS.VIEW_LEVELS],

  // Tags
  "/tags": [PERMISSIONS.VIEW_TAGS],

  // Logs
  "/logs": [PERMISSIONS.VIEW_LOGS],

  // Mail, Tasks, Chats, Calendar - không yêu cầu permissions đặc biệt
  "/mail": [],
  "/tasks": [],
  "/chats": [],
  "/calendar": [],

  // Settings - không yêu cầu permissions
  "/settings": [],
  "/settings/account": [],
  "/settings/appearance": [],
  "/settings/notifications": [],
  "/settings/display": [],
};

/**
 * Helper function để lấy permissions cần thiết cho 1 route
 * @param pathname - Đường dẫn route
 * @returns Array of permission strings hoặc undefined nếu route không yêu cầu permissions
 */
export function getRequiredPermissions(pathname: string): string[] | undefined {
  // Exact match
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // Check for dynamic routes - tìm route pattern phù hợp nhất
  const matchedRoute = Object.keys(ROUTE_PERMISSIONS).find((route) => {
    // Check if pathname starts with route (for nested routes)
    if (pathname.startsWith(route + "/")) {
      return true;
    }
    return false;
  });

  if (matchedRoute) {
    return ROUTE_PERMISSIONS[matchedRoute];
  }

  // Không tìm thấy route config -> cho phép access (hoặc có thể return undefined)
  return undefined;
}

/**
 * Helper function để check xem route có yêu cầu permissions hay không
 * @param pathname - Đường dẫn route
 * @returns boolean
 */
export function isProtectedRoute(pathname: string): boolean {
  const permissions = getRequiredPermissions(pathname);
  return permissions !== undefined && permissions.length > 0;
}
