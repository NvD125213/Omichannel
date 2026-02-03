"use client";

import { use, useState, useEffect } from "react";
import { DepartmentDetailCard } from "@/features/departments/components/department-detail-card";
import { useGetDepartmentDetail } from "@/hooks/department/use-get-department";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupDataTable } from "@/features/groups/components/group-data-table";
import { useDeleteGroup } from "@/hooks/group/use-action-group";
import { GroupFormDialog } from "@/features/groups/components/group-form-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { Group } from "@/features/groups/utils/schema";
import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  Home,
  Building2,
  Users,
  ArrowUpAZ,
  ArrowDownAZ,
  Clock,
} from "lucide-react";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

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
  { id: "name", label: "Tên nhóm" },
  { id: "description", label: "Mô tả" },
  { id: "is_active", label: "Trạng thái" },
];

/**
 * Component chứa logic và UI chính của trang chi tiết phòng ban
 * Chỉ được render khi đã qua lớp bảo mật
 */
function DepartmentDetailPageContent({
  departmentId,
}: {
  departmentId: string;
}) {
  const { data: department, isLoading } = useGetDepartmentDetail(departmentId);

  // States for Edit/Delete actions
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);

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

  const { mutateAsync: deleteGroup } = useDeleteGroup();

  // Handle Edit
  const handleEditGroup = (group: Group) => {
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
    const group = department?.groups?.find((g: any) => g.id === id);
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
    <div className="flex h-full bg-background">
      {/* Navigation Rail Filter */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm nhóm..."
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
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Phòng ban",
                href: "/departments",
                icon: <Building2 className="size-4" />,
              },
              {
                label: department.name || "Chi tiết phòng ban",
                icon: <Users className="size-4" />,
              },
            ]}
          />

          <GroupDataTable
            groups={department.groups || []}
            onDeleteGroup={handleDeleteGroup}
            onEditGroup={handleEditGroup}
            totalPages={1}
            totalRecords={department.groups?.length || 0}
            isLoading={isLoading}
            departmentId={department.id}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
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
    </div>
  );
}

/**
 * DepartmentDetailPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = use(params);

  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DEPARTMENT_BY_ID]}>
      <DepartmentDetailPageContent departmentId={departmentId} />
    </ProtectedRoute>
  );
}
