"use client";

import { use, useState } from "react";
import { DepartmentDetailCard } from "@/features/departments/components/department-detail-card";
import { useGetDepartmentDetail } from "@/hooks/department/use-get-department";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupDataTable } from "@/features/groups/components/group-data-table";
import { useDeleteGroup } from "@/hooks/group/use-action-group";
import { GroupFormDialog } from "@/features/groups/components/group-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Group } from "@/features/groups/utils/schema";

export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = use(params);
  const { data: department, isLoading } = useGetDepartmentDetail(departmentId);

  // States for Edit/Delete actions
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

  const { mutateAsync: deleteGroup } = useDeleteGroup();

  // Handle Edit
  const handleEditGroup = (group: Group) => {
    // Fallback if fields are missing in list
    const fullGroup = {
      ...group,
      department_id: group.department_id || department?.id || "",
      tenant_id: group.tenant_id || department?.tenant_id || "",
    };
    setEditingGroup(fullGroup);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingGroup(null), 150);
    }
  };

  // Handle Delete
  const handleDeleteGroup = (id: string) => {
    const group = department?.groups?.find((g: any) => g.id === id); // department.groups type is a bit loose in response
    if (group) {
      // @ts-ignore
      setDeletingGroup(group);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingGroup?.id) {
      await deleteGroup(deletingGroup.id);
      setDeleteDialogOpen(false);
      setDeletingGroup(null);
    }
  };

  // Get dữ liệu từ tennant
  const { data: tenant, isLoading: isLoadingTenant } = useGetTenants(
    {
      id: department?.tenant_id,
    },
    {
      enabled: !!department?.tenant_id,
    },
  );

  const tenantName = tenant && "name" in tenant ? tenant.name : "";

  if (isLoading || isLoadingTenant) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (!department) {
    return <div>Department not found</div>;
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <DepartmentDetailCard
        name={department.name}
        description={department.description}
        tenant={tenantName}
      />

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Danh sách nhóm</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý các nhóm trong phòng ban này
          </p>
        </div>

        <GroupDataTable
          groups={department.groups || []}
          onDeleteGroup={handleDeleteGroup}
          onEditGroup={handleEditGroup}
          totalPages={1}
          totalRecords={department.groups?.length || 0}
          isLoading={isLoading}
          departmentId={department.id}
        />
      </div>

      {/* Edit Group Dialog */}
      <GroupFormDialog
        group={editingGroup}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        departmentId={department.id}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa nhóm"
        description={
          <span>
            Bạn có chắc chắn muốn xóa nhóm{" "}
            <span className="font-semibold">{deletingGroup?.name}</span>?
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
