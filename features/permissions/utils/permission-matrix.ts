/**
 * Chuẩn hóa quyền cho ma trận action × model (resource).
 */

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  model?: string | null;
  belong_to?: string | null;
}

/** Prefix action dài trước — tránh bắt nhầm "delete" trong "delete_permission_from_role". */
const ACTION_PREFIXES = [
  "assign_permissions_to",
  "delete_permission_from",
  "view_role_permissions_by",
  "manage",
  "sync",
  "send",
  "bulk",
  "assign",
  "create",
  "edit",
  "delete",
  "view",
  "current",
] as const;

/** Cột action chính trong ma trận (thứ tự hiển thị). */
export const MATRIX_ACTION_ORDER = [
  "view",
  "create",
  "edit",
  "delete",
  "assign",
  "manage",
  "send",
  "sync",
  "bulk",
  "current",
  "other",
] as const;

export type MatrixAction = (typeof MATRIX_ACTION_ORDER)[number] | string;

export type GroupedPermissions = Record<string, PermissionItem[]>;

export function getPermissionModel(p: PermissionItem): string | null {
  return p.belong_to || p.model || null;
}

/**
 * Map tên quyền → action cột ma trận.
 * assign_permissions_to_role / delete_permission_from_role → assign / delete (giống FE cũ).
 */
export function getMatrixAction(name: string): string {
  const n = name.trim().toLowerCase();

  if (n.startsWith("assign_permissions_to")) return "assign";
  if (n.startsWith("delete_permission_from")) return "delete";
  if (n.startsWith("view_role_permissions_by")) return "view";

  for (const prefix of ACTION_PREFIXES) {
    if (n === prefix || n.startsWith(`${prefix}_`)) {
      return prefix;
    }
  }

  const head = n.split("_")[0];
  return head || "other";
}

/** Phần resource sau prefix action, dùng khi API không trả model. */
export function deriveModelFromName(name: string, action: string): string {
  const n = name.trim().toLowerCase();
  if (n.startsWith("assign_permissions_to_")) {
    return "role_permissions";
  }
  if (n.startsWith("delete_permission_from_")) {
    return "role_permissions";
  }
  if (n.startsWith("view_role_permissions_by_")) {
    return "role_permissions";
  }

  const prefix = `${action}_`;
  if (n.startsWith(prefix)) {
    const rest = n.slice(prefix.length);
    return rest || n;
  }

  return n;
}

function resolveModel(p: PermissionItem, action: string): string {
  return getPermissionModel(p) || deriveModelFromName(p.name, action);
}

function isGroupedPermissions(data: unknown): data is GroupedPermissions {
  if (!data || typeof data !== "object" || Array.isArray(data)) return false;
  const values = Object.values(data as Record<string, unknown>);
  if (values.length === 0) return false;
  return values.every(
    (v) =>
      Array.isArray(v) &&
      (v.length === 0 ||
        (typeof v[0] === "object" &&
          v[0] !== null &&
          "name" in (v[0] as object))),
  );
}

function flattenPermissions(data: unknown): PermissionItem[] {
  if (!data) return [];

  if (Array.isArray(data)) {
    return data.filter(
      (p): p is PermissionItem =>
        !!p &&
        typeof p === "object" &&
        typeof (p as PermissionItem).name === "string",
    );
  }

  if (isGroupedPermissions(data)) {
    return Object.values(data).flat();
  }

  // Một số API bọc { view: [], create: [] } trong data
  if (typeof data === "object" && data !== null && "data" in data) {
    return flattenPermissions((data as { data: unknown }).data);
  }

  return [];
}

/** Group theo action cột; gán model nếu thiếu. */
export function groupPermissionsForMatrix(data: unknown): GroupedPermissions {
  const list = flattenPermissions(data);
  const grouped: GroupedPermissions = {};

  for (const p of list) {
    if (!p?.id || !p?.name) continue;
    const action = getMatrixAction(p.name);
    const model = resolveModel(p, action);
    const item: PermissionItem = {
      ...p,
      model,
      description: p.description || `Permission to ${p.name}`,
    };
    if (!grouped[action]) grouped[action] = [];
    grouped[action].push(item);
  }

  // Sắp xếp key theo MATRIX_ACTION_ORDER rồi các action lạ
  const ordered: GroupedPermissions = {};
  for (const action of MATRIX_ACTION_ORDER) {
    if (grouped[action]?.length) ordered[action] = grouped[action];
  }
  for (const action of Object.keys(grouped).sort()) {
    if (!(action in ordered)) ordered[action] = grouped[action];
  }

  return ordered;
}

export function sortMatrixActions(actions: string[]): string[] {
  return [...actions].sort((a, b) => {
    const ia = MATRIX_ACTION_ORDER.indexOf(
      a as (typeof MATRIX_ACTION_ORDER)[number],
    );
    const ib = MATRIX_ACTION_ORDER.indexOf(
      b as (typeof MATRIX_ACTION_ORDER)[number],
    );
    const sa = ia === -1 ? 999 : ia;
    const sb = ib === -1 ? 999 : ib;
    if (sa !== sb) return sa - sb;
    return a.localeCompare(b);
  });
}

export function formatModelLabel(model: string): string {
  return model
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatActionLabel(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
