"use client";

import { DataTable } from "@/features/departments/components/department-data-table";
// import { UserStateCards } from "@/features/roles/components/role-state-cards";
import { DepartmentFormDialog } from "@/features/departments/components/department-form-modal";
import type { Department } from "@/features/departments/utils/schema";
import { useGetDepartments } from "@/hooks/department/use-get-department";
import { useDeleteDepartment } from "@/hooks/department/use-action-department";
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
import { IconBuilding } from "@tabler/icons-react";

export default function DepartmentsPage() {
  // State để quản lý edit dialog
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  // Fetch users with query params
  const { data, isLoading } = useGetDepartments({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
  });

  const departments: Department[] =
    (data?.departments as unknown as Department[]) || [];

  // Xử lý xóa user
  const { mutateAsync: deleteDepartment } = useDeleteDepartment();

  const handleDeleteDepartment = (id: string) => {
    const department = departments.find((u) => u.id === id);
    if (department) {
      setDeletingDepartment(department);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingDepartment?.id) {
      await deleteDepartment(deletingDepartment.id);
      setDeleteDialogOpen(false);
      setDeletingDepartment(null);
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    // Reset sau khi dialog đóng hoàn tất
    setTimeout(() => setEditingDepartment(null), 150);
  };

  return (
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
              label: "Danh sách phòng ban",
              href: "/departments",
              icon: <IconBuilding className="size-4" />,
            },
          ]}
        />

        <DataTable
          departments={departments}
          totalPages={data?.total_pages || 1}
          totalRecords={data?.total_records || 1}
          onDeleteDepartment={handleDeleteDepartment}
          onEditDepartment={handleEditDepartment}
          isLoading={isLoading}
        />
      </div>

      {/* Edit User Dialog */}
      <DepartmentFormDialog
        department={editingDepartment}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa phòng ban"
        description={
          <span>
            Bạn có chắc chắn muốn xóa phòng ban{" "}
            <span className="font-semibold">{deletingDepartment?.name}</span>?
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
