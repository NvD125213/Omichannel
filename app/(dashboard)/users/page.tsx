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
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home } from "lucide-react";
import { IconUsers } from "@tabler/icons-react";

export default function UsersPage() {
  // State để quản lý edit dialog
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  // Fetch users with query params
  const { data, isLoading } = useListUser({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
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

  return (
    <>
      <div className="p-4 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
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
    </>
  );
}
