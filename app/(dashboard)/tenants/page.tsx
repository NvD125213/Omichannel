"use client";

import { useEffect, useState } from "react";
import { Home, Building2, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";

import { TenantDataTable } from "@/features/tenants/components/tenant-data-table";
import type { Tenant } from "@/features/tenants/utils/schema";
import { useGetTenants, useDeleteTenant } from "@/hooks/tenant/use-get-tenant";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { TenantFormDialog } from "@/features/tenants/components/tenant-form-modal";

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

const columnOptions: ColumnOption[] = [
  { id: "name", label: "Tên doanh nghiệp" },
  { id: "is_active", label: "Trạng thái" },
];

function TenantsPageContent() {
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    sort_by: StringParam,
  });

  useEffect(() => {
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, isLoading } = useGetTenants({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
  });

  const tenants: Tenant[] = (data?.items as Tenant[]) || [];

  const deleteTenantMutation = useDeleteTenant();

  const handleDeleteTenant = (id: string) => {
    const tenant = tenants.find((t) => t.id === id);
    if (tenant) {
      setDeletingTenant(tenant);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTenant?.id) {
      await deleteTenantMutation.mutateAsync(deletingTenant.id);
      setDeleteDialogOpen(false);
      setDeletingTenant(null);
    }
  };

  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setTimeout(() => setEditingTenant(null), 150);
  };

  const handleSearchChange = (value: string) => {
    setQuery({ search: value || undefined, page: 1 });
  };

  const handleSortChange = (value: string) => {
    setQuery({ sort_by: value || undefined, page: 1 });
  };

  const handleClearFilters = () => {
    setQuery({ search: undefined, sort_by: undefined, page: 1 });
  };

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  const pagination = data
    ? {
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: data.total_pages,
      }
    : undefined;

  return (
    <div className="flex h-full bg-background">
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm doanh nghiệp..."
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

      <div className="flex-1 space-y-8 overflow-auto text-foreground animate-in fade-in duration-500">
        <div className="@container/main space-y-6 px-4 py-4 lg:px-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý doanh nghiệp",
                href: "/tenants",
                icon: <Building2 className="size-4" />,
              },
            ]}
          />
          <TenantDataTable
            tenants={tenants}
            pagination={pagination}
            onDeleteTenant={handleDeleteTenant}
            onEditTenant={handleEditTenant}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>

        <TenantFormDialog
          tenant={editingTenant}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa doanh nghiệp"
          description={
            <span>
              Bạn có chắc chắn muốn xóa doanh nghiệp{" "}
              <span className="font-semibold">{deletingTenant?.name}</span>?
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

export default function TenantsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TENANTS]}>
      <TenantsPageContent />
    </ProtectedRoute>
  );
}
