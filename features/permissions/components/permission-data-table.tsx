"use client";

import React, { useState, useMemo, useCallback } from "react";
import { FingerprintIcon, Home, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { PermissionTableToolbar } from "./permission-data-table-toolbar";
import { useGetRoles } from "@/hooks/role/use-get-role";
import {
  useGetPermissions,
  useGetPermissionsByRole,
} from "@/hooks/permission/use-get-permisison";
import { useAssignRolePermission } from "@/hooks/permission/use-action-permission";
import { useMe } from "@/hooks/user/use-me";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";
import {
  formatActionLabel,
  formatModelLabel,
  groupPermissionsForMatrix,
  sortMatrixActions,
  type PermissionItem,
} from "@/features/permissions/utils/permission-matrix";
import { cn } from "@/lib/utils";

/** Chờ hover 3s mới hiện tooltip trên ma trận */
const TOOLTIP_DELAY_MS = 3000;

/** Khung checkbox cố định — header / hàng / ô cùng size + căn giữa */
const CHECK_SLOT =
  "inline-flex size-4 shrink-0 items-center justify-center leading-none [&>button]:size-4";

/** Cột action: độ rộng đều, căn giữa */
const ACTION_COL =
  "w-[104px] min-w-[104px] max-w-[104px] p-0 align-middle text-center";

/** Cột tên resource (sticky) */
const MODEL_COL =
  "sticky left-0 z-10 w-[220px] min-w-[220px] max-w-[220px] p-0 align-middle";

type PermissionRow = {
  model: string;
  /** action → danh sách quyền (có thể >1 khi API trả view + view_by_id …) */
  cells: Record<string, PermissionItem[]>;
};

function collectPermissionIds(row: PermissionRow): string[] {
  const ids: string[] = [];
  Object.values(row.cells).forEach((perms) => {
    perms.forEach((p) => {
      if (p.id) ids.push(p.id);
    });
  });
  return ids;
}

function selectionState(
  ids: string[],
  selected: Set<string>,
): boolean | "indeterminate" {
  if (ids.length === 0) return false;
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === ids.length) return true;
  return "indeterminate";
}

export default function PermissionsMatrix() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string>>(
    new Set(),
  );

  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(),
  );

  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [debouncedRoleSearch, setDebouncedRoleSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRoleSearch(roleSearchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [roleSearchTerm]);

  const { data: currentUser } = useMe();
  const isPlatformAdmin = currentUser?.is_platform_admin === true;
  const effectiveTenantId = isPlatformAdmin
    ? selectedTenantId || undefined
    : currentUser?.tenant_id || undefined;

  React.useEffect(() => {
    if (selectedTenantId || !currentUser?.tenant_id) return;
    setSelectedTenantId(currentUser.tenant_id);
  }, [currentUser?.tenant_id, selectedTenantId]);

  const { data: tenantsData } = useGetTenants(
    { page: 1, page_size: 100, is_active: 1 },
    { enabled: isPlatformAdmin },
  );

  const { data: roles } = useGetRoles(
    {
      page: 1,
      page_size: 100,
      search: debouncedRoleSearch,
      tenant_id: effectiveTenantId,
    },
    { enabled: Boolean(effectiveTenantId) },
  );

  const { data: allPermissionsData } = useGetPermissions({
    for_assign: true,
  });
  const assignRolePermissionMutation = useAssignRolePermission();

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const roleList = roles?.roles ?? [];
    if (roleList.length === 0) {
      setSelectedRole(null);
      setSelectedRoles(new Set());
      return;
    }

    const stillValid = selectedRole
      ? roleList.some((role) => role.id === selectedRole)
      : false;
    if (stillValid) return;

    const firstRoleId = roleList[0].id;
    setSelectedRole(firstRoleId);
    setSelectedRoles(new Set([firstRoleId]));
  }, [roles, selectedRole]);

  React.useEffect(() => {
    const rolesArray = Array.from(selectedRoles);
    if (rolesArray.length > 0 && rolesArray[0] !== selectedRole) {
      setSelectedRole(rolesArray[0]);
    }
  }, [selectedRoles, selectedRole]);

  const { data: rolePermissionsData } = useGetPermissionsByRole(
    selectedRole || "",
  );

  /** Chỉ quyền tenant được phép gán (`for_assign=true`), ẩn quyền ngoài phạm vi. */
  const rawData = useMemo(() => {
    if (allPermissionsData == null) return {};
    return groupPermissionsForMatrix(allPermissionsData);
  }, [allPermissionsData]);

  const assignablePermissionIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(rawData).forEach((perms) => {
      perms.forEach((p) => {
        if (p.id) ids.add(p.id);
      });
    });
    return ids;
  }, [rawData]);

  const savedPermissionIds = useMemo(() => {
    const next = new Set<string>();
    if (!rolePermissionsData) return next;

    const grouped = groupPermissionsForMatrix(rolePermissionsData);
    Object.values(grouped).forEach((perms) => {
      perms.forEach((p) => {
        if (p.id && assignablePermissionIds.has(p.id)) next.add(p.id);
      });
    });
    return next;
  }, [rolePermissionsData, assignablePermissionIds]);

  React.useEffect(() => {
    if (!rolePermissionsData) return;
    setSelectedPermissions(new Set(savedPermissionIds));
  }, [rolePermissionsData, savedPermissionIds]);

  const isPermissionsDirty = useMemo(() => {
    if (selectedPermissions.size !== savedPermissionIds.size) return true;
    for (const id of selectedPermissions) {
      if (!savedPermissionIds.has(id)) return true;
    }
    return false;
  }, [selectedPermissions, savedPermissionIds]);

  const actions = useMemo(
    () => sortMatrixActions(Object.keys(rawData)),
    [rawData],
  );

  const actionOptions = useMemo(
    () =>
      actions.map((action) => ({
        label: formatActionLabel(action),
        value: action,
      })),
    [actions],
  );

  const models = useMemo(() => {
    const modelSet = new Set<string>();
    Object.values(rawData).forEach((perms) => {
      perms.forEach((p) => {
        if (p.model) modelSet.add(p.model);
      });
    });
    return Array.from(modelSet).sort((a, b) => a.localeCompare(b));
  }, [rawData]);

  const matrixData = useMemo<PermissionRow[]>(() => {
    return models.map((model) => {
      const cells: Record<string, PermissionItem[]> = {};
      actions.forEach((action) => {
        const actionPerms = rawData[action] || [];
        cells[action] = actionPerms.filter((p) => p.model === model);
      });
      return { model, cells };
    });
  }, [models, actions, rawData]);

  const filteredData = useMemo(() => {
    let filtered = matrixData;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.model.toLowerCase().includes(q) ||
          formatModelLabel(row.model).toLowerCase().includes(q),
      );
    }

    if (selectedActions.size > 0) {
      filtered = filtered.filter((row) =>
        Array.from(selectedActions).some(
          (action) => (row.cells[action]?.length ?? 0) > 0,
        ),
      );
    }

    return filtered;
  }, [matrixData, searchTerm, selectedActions]);

  const togglePermission = (permissionId: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(permissionId)) next.delete(permissionId);
    else next.add(permissionId);
    setSelectedPermissions(next);
  };

  /** Chọn / bỏ chọn 1 nhóm id (hàng hoặc cột). */
  const togglePermissionGroup = useCallback(
    (ids: string[], checked: boolean) => {
      if (ids.length === 0) return;
      setSelectedPermissions((prev) => {
        const next = new Set(prev);
        if (checked) {
          ids.forEach((id) => next.add(id));
        } else {
          ids.forEach((id) => next.delete(id));
        }
        return next;
      });
    },
    [],
  );

  const getColumnPermissionIds = useCallback(
    (action: string) => {
      const ids: string[] = [];
      filteredData.forEach((row) => {
        (row.cells[action] ?? []).forEach((p) => {
          if (p.id) ids.push(p.id);
        });
      });
      return ids;
    },
    [filteredData],
  );

  const allPermissionIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(rawData).forEach((perms) => {
      perms.forEach((p) => {
        if (p.id) ids.push(p.id);
      });
    });
    return ids;
  }, [rawData]);

  const allPermissionsState = selectionState(
    allPermissionIds,
    selectedPermissions,
  );

  const toggleAll = () => {
    if (allPermissionsState === true) {
      setSelectedPermissions(new Set());
      return;
    }
    setSelectedPermissions(new Set(allPermissionIds));
  };

  const roleOptions = useMemo(() => {
    return (
      roles?.roles?.map((role) => ({
        label: role.name,
        value: role.id,
      })) ?? []
    );
  }, [roles]);

  const tenantOptions = useMemo(
    () =>
      (tenantsData?.items ?? []).map((tenant) => ({
        label: tenant.name || tenant.id,
        value: tenant.id,
      })),
    [tenantsData],
  );

  const selectedTenantName = useMemo(
    () =>
      tenantOptions.find((option) => option.value === effectiveTenantId)
        ?.label,
    [tenantOptions, effectiveTenantId],
  );

  const handleTenantChange = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setSelectedRole(null);
    setSelectedRoles(new Set());
    setSelectedPermissions(new Set());
  };

  const handleSave = () => {
    const roleTenantId =
      roles?.roles?.find((role) => role.id === selectedRole)?.tenant_id ||
      effectiveTenantId;
    if (!selectedRole || !roleTenantId) return;

    assignRolePermissionMutation.mutate({
      role_id: selectedRole,
      permission_ids: Array.from(selectedPermissions),
      tenant_id: roleTenantId,
    });
  };

  const handleRestore = () => {
    setSelectedPermissions(new Set(savedPermissionIds));
  };

  return (
    <div className="@container/main space-y-6 px-4 py-4 lg:px-6">
      <AppBreadcrumb
        items={[
          {
            label: "Home",
            href: "/dashboard",
            icon: <Home className="size-4" />,
          },
          {
            label: "Phân quyền",
            href: "/permissions",
            icon: <FingerprintIcon className="size-4" />,
          },
        ]}
      />

      <PermissionTableToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        actionOptions={actionOptions}
        roleOptions={roleOptions}
        selectedActions={selectedActions}
        selectedRoles={selectedRoles}
        setSelectedActions={setSelectedActions}
        setSelectedRoles={setSelectedRoles}
        onRoleSearch={setRoleSearchTerm}
        onToggleAll={toggleAll}
        selectedCount={selectedPermissions.size}
        onSave={handleSave}
        onRestore={handleRestore}
        isSaving={assignRolePermissionMutation.isPending}
        isDirty={isPermissionsDirty}
        showTenantFilter={isPlatformAdmin}
        tenantOptions={tenantOptions}
        selectedTenantId={effectiveTenantId ?? ""}
        selectedTenantName={selectedTenantName}
        onTenantChange={handleTenantChange}
      />

      <div
        className={[
          "relative max-h-[calc(100vh-12rem)] overflow-auto rounded-md border",
          "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        ].join(" ")}
      >
        {filteredData.length === 0 ? (
          <EmptyData
            icon={IconMoodEmpty}
            title="Chưa có thông tin quyền hạn"
            description="Vui lòng kiểm tra lại thông tin người dùng hoặc liên hệ với quản trị viên để được hỗ trợ"
            showButton={false}
            buttonText=""
            className="m-4"
            onButtonClick={() => {}}
          />
        ) : (
          <TooltipProvider delayDuration={TOOLTIP_DELAY_MS}>
            <Table
              className="table-fixed border-collapse"
              containerClassName="overflow-visible"
            >
              <TableHeader className="sticky top-0 z-20">
                <TableRow className="border-b border-border bg-muted hover:bg-muted">
                  <TableHead
                    className={cn(
                      MODEL_COL,
                      "z-30 h-14 bg-muted font-semibold shadow-[1px_0_0_0_rgba(0,0,0,0.08)]",
                    )}
                  >
                    <div className="grid h-14 grid-cols-[1rem_minmax(0,1fr)] items-end gap-2.5 px-3 pb-2.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={CHECK_SLOT}>
                            <Checkbox
                              checked={allPermissionsState}
                              disabled={allPermissionIds.length === 0}
                              onCheckedChange={(value) =>
                                togglePermissionGroup(
                                  allPermissionIds,
                                  value === true,
                                )
                              }
                              aria-label="Chọn tất cả quyền hạn"
                              className="size-4 shadow-none"
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {allPermissionIds.length > 0
                            ? "Chọn/bỏ chọn toàn bộ quyền hạn"
                            : "Không có quyền để chọn"}
                        </TooltipContent>
                      </Tooltip>
                      <span className="pb-px text-left text-sm leading-none">
                        Danh sách quyền hạn
                      </span>
                    </div>
                  </TableHead>
                  {actions.map((action) => {
                    const colIds = getColumnPermissionIds(action);
                    const colState = selectionState(
                      colIds,
                      selectedPermissions,
                    );
                    const hasAny = colIds.length > 0;

                    return (
                      <TableHead
                        key={action}
                        className={cn(ACTION_COL, "h-14 bg-muted")}
                      >
                        <div className="flex h-14 w-full flex-col items-center justify-end gap-1.5 px-1 pb-2.5">
                          <span className="line-clamp-2 max-h-8 w-full text-center text-xs font-medium leading-tight">
                            {formatActionLabel(action)}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={CHECK_SLOT}>
                                <Checkbox
                                  checked={colState}
                                  disabled={!hasAny}
                                  onCheckedChange={(value) =>
                                    togglePermissionGroup(
                                      colIds,
                                      value === true,
                                    )
                                  }
                                  aria-label={`Chọn tất cả cột ${formatActionLabel(action)}`}
                                  className="size-4 shadow-none"
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {hasAny
                                ? `Chọn/bỏ chọn toàn cột «${formatActionLabel(action)}»`
                                : "Không có quyền trong cột này"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-background dark:bg-transparent">
                {filteredData.map((row) => {
                  const rowIds = collectPermissionIds(row);
                  const rowState = selectionState(rowIds, selectedPermissions);
                  const rowHasAny = rowIds.length > 0;

                  return (
                    <TableRow
                      key={row.model}
                      className="border-b last:border-0 bg-background hover:bg-background dark:bg-transparent dark:hover:bg-transparent"
                    >
                      <TableCell
                        className={cn(
                          MODEL_COL,
                          "h-11 bg-background font-medium shadow-[1px_0_0_0_rgba(0,0,0,0.08)] dark:bg-transparent dark:shadow-[1px_0_0_0_rgba(255,255,255,0.08)]",
                        )}
                      >
                        <div className="grid h-11 grid-cols-[1rem_minmax(0,1fr)] items-center gap-2.5 px-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={CHECK_SLOT}>
                                <Checkbox
                                  checked={rowState}
                                  disabled={!rowHasAny}
                                  onCheckedChange={(value) =>
                                    togglePermissionGroup(
                                      rowIds,
                                      value === true,
                                    )
                                  }
                                  aria-label={`Chọn tất cả hàng ${formatModelLabel(row.model)}`}
                                  className="size-4 shadow-none"
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {rowHasAny
                                ? `Chọn/bỏ chọn toàn hàng «${formatModelLabel(row.model)}»`
                                : "Không có quyền trong hàng này"}
                            </TooltipContent>
                          </Tooltip>
                          <span className="min-w-0 truncate text-left text-sm leading-none pb-0.5">
                            {formatModelLabel(row.model)}
                          </span>
                        </div>
                      </TableCell>

                      {actions.map((action) => {
                        const perms = row.cells[action] ?? [];

                        return (
                          <TableCell
                            key={action}
                            className={cn(ACTION_COL, "h-11")}
                          >
                            <div className="flex h-11 w-full items-center justify-center gap-1">
                              {perms.length === 0 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span
                                      className={cn(CHECK_SLOT, "relative")}
                                    >
                                      <Checkbox
                                        checked={false}
                                        disabled
                                        aria-label="Không áp dụng quyền này"
                                        className="size-4 border-muted-foreground/70 shadow-none disabled:cursor-default disabled:opacity-100"
                                      />
                                      <Minus
                                        aria-hidden
                                        className="pointer-events-none absolute size-2.5 text-muted-foreground"
                                        strokeWidth={2.75}
                                      />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>Không áp dụng</TooltipContent>
                                </Tooltip>
                              ) : (
                                perms.map((permission) => (
                                  <Tooltip key={permission.id}>
                                    <TooltipTrigger asChild>
                                      <span className={CHECK_SLOT}>
                                        <Checkbox
                                          checked={selectedPermissions.has(
                                            permission.id,
                                          )}
                                          onCheckedChange={() =>
                                            togglePermission(permission.id)
                                          }
                                          aria-label={permission.name}
                                          className="size-4 shadow-none"
                                        />
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="font-medium">
                                        {permission.name}
                                      </p>
                                      {permission.description ? (
                                        <p className="text-xs text-white/70 dark:text-black/70">
                                          {permission.description}
                                        </p>
                                      ) : null}
                                    </TooltipContent>
                                  </Tooltip>
                                ))
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
