"use client";
import { TicketFlowDataTable } from "@/features/tickets/ticket-flow/components/ticket-flow-data-list";
import { TicketFlowFormDialog } from "@/features/tickets/ticket-flow/components/ticket-flow-form";
// import { UserStateCards } from "@/features/ticket/components/role-state-cards";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { useDeleteTicketFlow } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
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
import { IconBuilding, IconLock } from "@tabler/icons-react";
import { TicketFlow } from "@/features/tickets/ticket-flow/utils/ticket-flow-schema";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import {
  NavigationRailFilter,
  type FilterOption,
  type ColumnOption,
} from "@/components/navigation-rail-filter";

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
  { id: "name", label: "Tên luồng xử lý" },
  { id: "description", label: "Mô tả" },
  { id: "created_at", label: "Ngày tạo" },
  { id: "steps_count", label: "Số bước" },
  { id: "tickets_count", label: "Số ticket" },
];

/**
 * Component chứa logic và UI chính của trang Ticket Flows
 * Chỉ được render khi đã qua lớp bảo mật
 */
function TicketFlowsPageContent() {
  // State để quản lý edit dialog
  const [editingFlow, setEditingFlow] = useState<TicketFlow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicketFlow, setDeletingTicketFlow] =
    useState<TicketFlow | null>(null);

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

  // Fetch users with query params
  const { data, isLoading } = useGetTicketFlows({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: query.sort_by || undefined,
  });

  const ticketFlows = data?.data.data.flows || [];

  // Xử lý xóa user
  const { mutateAsync: deleteTicketFlow } = useDeleteTicketFlow();

  const handleDeleteRole = (id: string) => {
    const role = ticketFlows.find((u) => u.id === id);
    if (role) {
      setDeletingTicketFlow(role);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTicketFlow?.id) {
      await deleteTicketFlow(deletingTicketFlow.id);
      setDeleteDialogOpen(false);
      setDeletingTicketFlow(null);
    }
  };

  const handleEditRole = (flow: TicketFlow) => {
    setEditingFlow(flow);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    // Reset editingUser sau khi dialog đóng hoàn tất
    setTimeout(() => setEditingFlow(null), 150);
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
    <div className="flex h-full bg-background animate-in fade-in duration-500">
      {/* Navigation Rail Filter */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm luồng xử lý..."
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
      <div className="flex-1 space-y-8 text-foreground overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              {
                label: "Home",
                href: "/dashboard",
                icon: <Home className="size-4" />,
              },
              {
                label: "Tickets",
                href: "/tickets",
                icon: <IconLock className="size-4" />,
              },
              {
                label: "Danh sách luồng xử lý",
                href: "/tickets/flows",
                icon: <IconBuilding className="size-4" />,
              },
            ]}
          />

          <TicketFlowDataTable
            ticketFlows={ticketFlows}
            totalPages={data?.data.data.pagination.total_pages || 1}
            totalRecords={data?.data.data.pagination.total_count || 1}
            onDeleteFlow={handleDeleteRole}
            onEditFlow={handleEditRole}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa luồng xử lý"
          description={
            <span>
              Bạn có chắc chắn muốn xóa luồng xử lý{" "}
              <span className="font-semibold">{deletingTicketFlow?.name}</span>?
            </span>
          }
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          confirmVariant="destructive"
        />

        {/* Edit Flow Dialog */}
        <TicketFlowFormDialog
          ticketFlow={editingFlow}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />
      </div>
    </div>
  );
}

/**
 * TicketFlowsPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function TicketFlowsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TICKET_FLOWS]}>
      <TicketFlowsPageContent />
    </ProtectedRoute>
  );
}
