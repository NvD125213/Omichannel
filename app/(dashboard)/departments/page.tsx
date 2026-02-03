"use client";

import { DataTable } from "@/features/departments/components/department-data-table";
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
import { AppBreadcrumb } from "@/components/breadcrumb";
import { Home, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import { IconBuilding } from "@tabler/icons-react";
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
  { id: "name", label: "Tên phòng ban" },
  { id: "description", label: "Chú thích" },
  { id: "is_active", label: "Trạng thái" },
];

/**
 * Component chứa logic và UI chính của trang Departments
 * Chỉ được render khi đã qua lớp bảo mật
 */
function DepartmentsPageContent() {
  // State để quản lý edit dialog
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);

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

  // Fetch departments with query params
  const { data, isLoading } = useGetDepartments({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: query.sort_by || undefined,
  });

  const departments: Department[] =
    (data?.departments as unknown as Department[]) || [];

  // Xử lý xóa department
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
    setTimeout(() => setEditingDepartment(null), 150);
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
        searchPlaceholder="Tìm kiếm phòng ban..."
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
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>

        {/* Edit Department Dialog */}
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
    </div>
  );
}

/**
 * DepartmentsPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function DepartmentsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_DEPARTMENTS]}>
      <DepartmentsPageContent />
    </ProtectedRoute>
  );
}
