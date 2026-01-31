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
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import { IconBuilding, IconLock } from "@tabler/icons-react";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";

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
];

export default function RolesPage() {
  // State để quản lý edit dialog
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
  });

  // Set default query params in URL on mount
  useEffect(() => {
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch roles with query params
  const { data, isLoading } = useGetRoles({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
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

  const handleClearFilters = () => {
    setQuery({ search: undefined, sort_by: undefined, page: 1 });
  };

  // Column visibility handler
  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  return (
    <div className="flex h-full bg-background">
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
      />

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
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
