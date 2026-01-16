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
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

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
    <>
      <div className="px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Danh sách phòng ban
          </h1>
          <p className="text-muted-foreground">Quản lý thông tin phòng ban</p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        {/* <UserStateCards /> */}

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
    </>
  );
}
