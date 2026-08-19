"use client";

import { DataTable } from "@/features/roles/components/role-data-table";
import { RoleFormDialog } from "@/features/roles/components/role-form-modal";
import type { Role } from "@/features/roles/utils/schema";
import { useGetRoles } from "@/hooks/role/use-get-role";
import { useDeleteRole } from "@/hooks/role/use-action-role";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  Home,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
  Building2,
  Check,
  ChevronDown,
} from "lucide-react";
import { IconBuilding, IconLock } from "@tabler/icons-react";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { useMe } from "@/hooks/user/use-me";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const ALL_VALUE = "__all__";

type TenantOption = { value: string; label: string };

function TenantSearchSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: TenantOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <Building2 className="size-4" />
        Doanh nghiệp
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-10 w-full justify-between bg-transparent font-normal"
          >
            <span className="truncate">
              {selected?.label || "Tất cả doanh nghiệp"}
            </span>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-(--radix-popover-trigger-width) p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Tìm doanh nghiệp..." />
            <CommandList>
              <CommandEmpty>Không tìm thấy doanh nghiệp.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value={`Tất cả doanh nghiệp ${ALL_VALUE}`}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      !value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Tất cả doanh nghiệp
                </CommandItem>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Sort options
const sortOptions: FilterOption[] = [
  {
    value: "name_asc",
    label: "Tên A-Z",
    icon: <ArrowUpAZ className="size-4" />,
  },
  {
    value: "name_desc",
    label: "Tên Z-A",
    icon: <ArrowDownAZ className="size-4" />,
  },
  {
    value: "created_at_desc",
    label: "Mới nhất",
    icon: <Clock className="size-4" />,
  },
  {
    value: "created_at_asc",
    label: "Cũ nhất",
    icon: <Clock className="size-4" />,
  },
];

// Column options for visibility toggle
const columnOptions: ColumnOption[] = [
  { id: "name", label: "Tên vai trò" },
  { id: "description", label: "Mô tả" },
  { id: "created_at", label: "Ngày tạo" },
  { id: "order", label: "Thứ tự" },
];

/**
 * Component chứa logic và UI chính của trang Roles
 * Chỉ được render khi đã qua lớp bảo mật
 */
function RolesPageContent() {
  // State để quản lý edit dialog
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { data: currentUser } = useMe();
  const isPlatformAdmin = currentUser?.is_platform_admin === true;
  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    sort_by: StringParam,
    sort_order: StringParam,
    tenant_id: StringParam,
  });

  // Set default query params in URL on mount
  useEffect(() => {
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: tenantsData } = useGetTenants(
    { page: 1, page_size: 100 },
    { enabled: isPlatformAdmin },
  );

  const tenantOptions = useMemo<TenantOption[]>(
    () =>
      (tenantsData?.items ?? []).map((tenant) => ({
        value: tenant.id,
        label: tenant.name || tenant.id,
      })),
    [tenantsData],
  );

  const selectedTenantName = useMemo(
    () =>
      tenantOptions.find((option) => option.value === query.tenant_id)?.label,
    [tenantOptions, query.tenant_id],
  );

  // Fetch roles with query params
  const { data, isLoading } = useGetRoles({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    tenant_id: isPlatformAdmin ? query.tenant_id || undefined : undefined,
  });

  const roles: Role[] = (data?.roles as unknown as Role[]) || [];

  // Xử lý xóa role
  const { mutateAsync: deleteRole } = useDeleteRole();

  const handleDeleteRole = (id: string) => {
    const role = roles.find((u) => u.id === id);
    if (role) {
      setDeletingRole(role);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingRole?.id) {
      await deleteRole(deletingRole.id);
      setDeleteDialogOpen(false);
      setDeletingRole(null);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setTimeout(() => setEditingRole(null), 150);
  };

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setQuery({ search: value || undefined, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setQuery({ sort_by: value || undefined, page: 1 });
  };

  const handleTenantChange = (value: string) => {
    setQuery({
      tenant_id: !value || value === ALL_VALUE ? undefined : value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setQuery({
      search: undefined,
      sort_by: undefined,
      tenant_id: undefined,
      page: 1,
    });
  };

  // Column visibility handler
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  return (
    <div className="flex h-full bg-transparent">
      {/* Navigation Rail Filter */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm vai trò..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        selectLabel="Sắp xếp"
        selectPlaceholder="Chọn cách sắp xếp"
        selectOptions={sortOptions}
        selectValue={query.sort_by || undefined}
        onSelectChange={handleSortChange}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        columnOptions={columnOptions}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        extraActiveFilterCount={isPlatformAdmin && query.tenant_id ? 1 : 0}
        extraPanelContent={
          isPlatformAdmin ? (
            <TenantSearchSelect
              value={query.tenant_id ?? ""}
              options={tenantOptions}
              onChange={handleTenantChange}
            />
          ) : null
        }
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              {
                label: "Home",
                href: "/dashboard",
                icon: <Home className="size-4" />,
              },
              {
                label: "Phân quyền",
                href: "/roles",
                icon: <IconLock className="size-4" />,
              },
              {
                label: "Danh sách vai trò",
                href: "/roles",
                icon: <IconBuilding className="size-4" />,
              },
            ]}
          />

          <DataTable
            roles={roles}
            totalPages={data?.total_pages || 1}
            totalRecords={data?.total_records || 1}
            onDeleteRole={handleDeleteRole}
            onEditRole={handleEditRole}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            selectedTenantName={selectedTenantName}
          />
        </div>

        {/* Edit Role Dialog */}
        <RoleFormDialog
          role={editingRole}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa vai trò"
          description={
            <span>
              Bạn có chắc chắn muốn xóa vai trò{" "}
              <span className="font-semibold">{deletingRole?.name}</span>?
            </span>
          }
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          confirmVariant="destructive"
        />
      </div>
    </div>
  );
}

/**
 * RolesPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function RolesPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_ROLES]}>
      <RolesPageContent />
    </ProtectedRoute>
  );
}
