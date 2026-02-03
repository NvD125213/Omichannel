"use client";

import { DataTable } from "@/features/users/components/user-data-table";
import { UserFormDialog } from "@/features/users/components/user-form-modal";
import type { User } from "@/features/users/utils/schema";
import { useListUser } from "@/hooks/user/use-list-user";
import { useDeleteUser } from "@/hooks/user/use-action-user";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import { IconUsers } from "@tabler/icons-react";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

// Sort options
const sortOptions: FilterOption[] = [
  {
    value: "fullname_asc",
    label: "Tên A-Z",
    icon: <ArrowUpAZ className="size-4" />,
  },
  {
    value: "fullname_desc",
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
  { id: "username", label: "Thông tin tài khoản" },
  { id: "fullname", label: "Họ tên người dùng" },
  { id: "role", label: "Vai trò" },
  { id: "level", label: "Cấp bậc" },
  { id: "is_active", label: "Trạng thái" },
];

/**
 * Component chứa logic và UI chính của trang Users
 * Chỉ được render khi đã qua lớp bảo mật
 */
function UsersPageContent() {
  // State để quản lý edit dialog
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

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
    // Only set if not already in URL
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch users with query params
  const { data, isLoading } = useListUser({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: query.sort_by || undefined,
  });

  const users: User[] = (data?.data.items as unknown as User[]) || [];

  // Xử lý xóa user
  const { mutateAsync: deleteUser } = useDeleteUser();

  const handleDeleteUser = (id: string) => {
    const user = users.find((u) => u.id === id);
    if (user) {
      setDeletingUser(user);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingUser?.id) {
      await deleteUser(deletingUser.id);
      setDeleteDialogOpen(false);
      setDeletingUser(null);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    // Reset editingUser sau khi dialog đóng hoàn tất
    setTimeout(() => setEditingUser(null), 150);
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
        searchPlaceholder="Tìm kiếm người dùng..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        selectLabel="Sắp xếp"
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
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý người dùng",
                href: "/users",
                icon: <IconUsers className="size-4" />,
              },
            ]}
          />
          <DataTable
            users={users}
            pagination={data?.data.pagination}
            onDeleteUser={handleDeleteUser}
            onEditUser={handleEditUser}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>

        {/* Edit User Dialog */}
        <UserFormDialog
          user={editingUser}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa người dùng"
          description={
            <span>
              Bạn có chắc chắn muốn xóa người dùng{" "}
              <span className="font-semibold">{deletingUser?.fullname}</span>?
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
 * UsersPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function UsersPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_USERS]}>
      <UsersPageContent />
    </ProtectedRoute>
  );
}
