"use client";

import { DataTable } from "@/features/roles/components/role-data-table";
// import { UserStateCards } from "@/features/roles/components/role-state-cards";
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
import { Home } from "lucide-react";
import { IconBuilding, IconLock } from "@tabler/icons-react";

export default function RolesPage() {
  // State để quản lý edit dialog
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  // Fetch users with query params
  const { data, isLoading } = useGetRoles({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
  });

  const roles: Role[] = (data?.roles as unknown as Role[]) || [];

  // Xử lý xóa user
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
    // Reset editingUser sau khi dialog đóng hoàn tất
    setTimeout(() => setEditingRole(null), 150);
  };

  return (
    <>
      <div className="p-4 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
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
          />
        </div>

        {/* Edit User Dialog */}
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
    </>
  );
}
