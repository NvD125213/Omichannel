"use client";

import { useState, useEffect } from "react";
import { Home, ArrowUpAZ, ArrowDownAZ, Clock } from "lucide-react";
import { IconUsers } from "@tabler/icons-react";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  NavigationRailFilter,
  type ColumnOption,
  type FilterOption,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import {
  useDeleteCustomer,
  useGetCustomers,
} from "@/hooks/customer/use-customer";
import { CustomerDataTable } from "@/features/customers/components/customer-data-table";
import { CustomerFormDialog } from "@/features/customers/components/customer-data-form";
import type { Customer } from "@/features/customers/utils/schema";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

// Sort options cho khách hàng
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

// Các cột có thể ẩn/hiện
const columnOptions: ColumnOption[] = [
  { id: "name", label: "Thông tin khách hàng" },
  { id: "phone", label: "Số điện thoại" },
  { id: "is_active", label: "Trạng thái" },
];

function CustomersPageContent() {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading } = useGetCustomers({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: query.sort_by || undefined,
  });

  const customers: Customer[] =
    ((data?.data.items as unknown) as Customer[]) || [];

  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

  const handleDeleteCustomer = (id: string) => {
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      setDeletingCustomer(customer);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingCustomer?.id) {
      await deleteCustomer(deletingCustomer.id);
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setTimeout(() => setEditingCustomer(null), 150);
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

  return (
    <div className="flex h-full bg-background">
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm khách hàng..."
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

      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý khách hàng",
                href: "/customers",
                icon: <IconUsers className="size-4" />,
              },
            ]}
          />
          <CustomerDataTable
            customers={customers}
            pagination={data?.data.pagination}
            onDeleteCustomer={handleDeleteCustomer}
            onEditCustomer={handleEditCustomer}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>

        <CustomerFormDialog
          customer={editingCustomer}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />

        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa khách hàng"
          description={
            <span>
              Bạn có chắc chắn muốn xóa khách hàng{" "}
              <span className="font-semibold">{deletingCustomer?.name}</span>?
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

export default function CustomersPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}>
      <CustomersPageContent />
    </ProtectedRoute>
  );
}
