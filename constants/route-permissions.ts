/**
 * Map đường dẫn `(dashboard)` → quyền bắt buộc (hasAnyPermission).
 * Đồng bộ resource VIEW/CREATE/EDIT/… với `constants/permission.ts`.
 */

import { PERMISSIONS, type Permission } from "@/constants/permission";

function normalizePath(pathname: string): string {
  const bare = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

function matches(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Trả về danh sách quyền cần có (any-of) cho route.
 * `null` = chỉ cần đăng nhập (không check permission).
 */
export function getRequiredPermissionsForPath(
  pathname: string,
): Permission[] | null {
  const path = normalizePath(pathname);

  // ── Tickets ──────────────────────────────────────────────────────────
  if (/^\/tickets\/flows\/[^/]+\/steps$/.test(path)) {
    return [PERMISSIONS.VIEW_TICKET_FLOW_STEPS];
  }
  if (matches(path, "/tickets/flows")) {
    return [PERMISSIONS.VIEW_TICKET_FLOWS, PERMISSIONS.VIEW_TICKET_FLOW_BY_ID];
  }
  if (matches(path, "/tickets/templates")) {
    return [PERMISSIONS.VIEW_TICKET_TEMPLATES];
  }
  if (matches(path, "/tickets/tags")) {
    return [PERMISSIONS.VIEW_TAGS];
  }
  if (matches(path, "/tickets")) {
    return [PERMISSIONS.VIEW_TICKETS];
  }

  // ── Customers ────────────────────────────────────────────────────────
  if (matches(path, "/customers/tags")) {
    return [PERMISSIONS.VIEW_TAGS, PERMISSIONS.VIEW_CUSTOMERS];
  }
  if (matches(path, "/customers/leads") || matches(path, "/lead")) {
    return [PERMISSIONS.VIEW_CUSTOMERS];
  }
  if (matches(path, "/customers")) {
    return [PERMISSIONS.VIEW_CUSTOMERS, PERMISSIONS.VIEW_CUSTOMER_BY_ID];
  }

  // ── Users / roles / permissions / tenants ────────────────────────────
  if (matches(path, "/users")) {
    return [PERMISSIONS.VIEW_USERS];
  }
  if (matches(path, "/roles")) {
    return [PERMISSIONS.VIEW_ROLES];
  }
  if (matches(path, "/permissions")) {
    return [
      PERMISSIONS.VIEW_PERMISSIONS,
      PERMISSIONS.VIEW_ROLE_PERMISSIONS_BY_ROLE_ID,
      PERMISSIONS.ASSIGN_PERMISSIONS_TO_ROLE,
    ];
  }
  if (matches(path, "/tenants")) {
    return [PERMISSIONS.VIEW_TENANTS];
  }

  // ── Departments & groups ─────────────────────────────────────────────
  if (matches(path, "/departments") && path.includes("/groups")) {
    return [
      PERMISSIONS.VIEW_GROUPS,
      PERMISSIONS.VIEW_GROUP_BY_ID,
      PERMISSIONS.VIEW_GROUP_DETAIL_BY_ID,
      PERMISSIONS.VIEW_DEPARTMENTS,
    ];
  }
  if (matches(path, "/departments")) {
    // /departments/[id] hiện hiển thị nhóm — cho phép VIEW_DEPARTMENTS hoặc VIEW_GROUPS
    return [
      PERMISSIONS.VIEW_DEPARTMENTS,
      PERMISSIONS.VIEW_DEPARTMENT_BY_ID,
      PERMISSIONS.VIEW_GROUPS,
    ];
  }

  // ── Messaging — chats ────────────────────────────────────────────────
  if (matches(path, "/chats")) {
    return [
      PERMISSIONS.VIEW_MESSAGING_CONVERSATIONS,
      PERMISSIONS.SEND_MESSAGING_MESSAGE,
      PERMISSIONS.BULK_MESSAGING_ACTIONS,
    ];
  }

  // ── Messaging — settings ─────────────────────────────────────────────
  if (matches(path, "/settings/channel/new")) {
    return [
      PERMISSIONS.CREATE_MESSAGING_INBOX,
      PERMISSIONS.VIEW_MESSAGING_INBOXES,
    ];
  }
  if (
    matches(path, "/settings/channel") &&
    (path.includes("/edit") || /\/settings\/channel\/[^/]+/.test(path))
  ) {
    return [
      PERMISSIONS.EDIT_MESSAGING_INBOX,
      PERMISSIONS.VIEW_MESSAGING_INBOXES,
      PERMISSIONS.MANAGE_MESSAGING_INBOX_MEMBERS,
    ];
  }
  if (matches(path, "/settings/channel")) {
    return [PERMISSIONS.VIEW_MESSAGING_INBOXES];
  }

  if (matches(path, "/settings/team/new")) {
    return [
      PERMISSIONS.CREATE_MESSAGING_TEAM,
      PERMISSIONS.VIEW_MESSAGING_TEAMS,
    ];
  }
  if (
    matches(path, "/settings/team") &&
    (path.includes("/edit") || /\/settings\/team\/[^/]+/.test(path))
  ) {
    return [
      PERMISSIONS.EDIT_MESSAGING_TEAM,
      PERMISSIONS.VIEW_MESSAGING_TEAMS,
      PERMISSIONS.MANAGE_MESSAGING_TEAM_MEMBERS,
    ];
  }
  if (matches(path, "/settings/team")) {
    return [PERMISSIONS.VIEW_MESSAGING_TEAMS];
  }

  if (matches(path, "/settings/agent")) {
    return [
      PERMISSIONS.VIEW_MESSAGING_AGENTS,
      PERMISSIONS.CREATE_MESSAGING_AGENT,
      PERMISSIONS.EDIT_MESSAGING_AGENT,
    ];
  }

  if (matches(path, "/settings/label")) {
    return [
      PERMISSIONS.VIEW_MESSAGING_LABELS,
      PERMISSIONS.CREATE_MESSAGING_LABEL,
      PERMISSIONS.DELETE_MESSAGING_LABEL,
    ];
  }

  if (
    matches(path, "/settings/agent-bot") ||
    matches(path, "/settings/agentbots")
  ) {
    return [
      PERMISSIONS.VIEW_MESSAGING_AGENT_BOTS,
      PERMISSIONS.CREATE_MESSAGING_AGENT_BOT,
      PERMISSIONS.EDIT_MESSAGING_AGENT_BOT,
    ];
  }

  // Settings cá nhân / theme — auth only
  if (matches(path, "/settings")) {
    return null;
  }

  // ── Logs / VoIP ──────────────────────────────────────────────────────
  if (matches(path, "/call-logs") || matches(path, "/3cx")) {
    return [PERMISSIONS.VIEW_LOGS];
  }

  // Dashboard overview & misc demo pages — auth only
  if (
    matches(path, "/dashboard") ||
    matches(path, "/dashboard2") ||
    matches(path, "/payment-dashboard") ||
    matches(path, "/payment-transactions") ||
    matches(path, "/calendar") ||
    matches(path, "/tasks") ||
    matches(path, "/kanban") ||
    matches(path, "/mail") ||
    matches(path, "/discord") ||
    matches(path, "/help-center") ||
    matches(path, "/pricing")
  ) {
    return null;
  }

  return null;
}

/** Toàn bộ permission key trong hệ thống (dùng audit / tooling). */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);
