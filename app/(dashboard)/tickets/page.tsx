"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/features/tickets/ticket-list/components/ticket-list-data-table";
import { TicketCreateSheet } from "@/features/tickets/ticket-list/components/ticket-sheet-sidebar";
import type { Ticket } from "@/features/tickets/ticket-list/utils/ticket-schema";
import {
  useDeleteTicket,
  useGetTickets,
} from "@/hooks/ticket/ticket-list/use-ticket-list";
import { useGetTags } from "@/hooks/tag/use-tag-ticket";
import { IconReportMoney } from "@tabler/icons-react";
import {
  Home,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Ban,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Flame,
  ListTodo,
  Signal,
  PlusCircle,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import {
  NumberParam,
  StringParam,
  ArrayParam,
  useQueryParams,
  withDefault,
} from "use-query-params";
import {
  NavigationRailFilter,
  type FilterOption,
  type TagItem,
  type ColumnOption,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { TicketKanbanBoard } from "@/features/tickets/ticket-list/components/ticket-kanban-board";
import { useUpdateTicket } from "@/hooks/ticket/ticket-list/use-ticket-list";
import type { ActionTicketRequest } from "@/services/ticket/tickets/action-tickets";
import { Button } from "@/components/ui/button";

export enum TicketStatus {
  PENDING = "pending",
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  RESOLVED = "resolved",
  CLOSED = "closed",
  CANCELLED = "cancelled",
}

export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
  CRITICAL = "critical",
}

// Status options với icons
const statusOptions: FilterOption[] = [
  {
    value: TicketStatus.PENDING,
    label: "Đang chờ",
    icon: <Clock className="size-4" />,
  },
  {
    value: TicketStatus.OPEN,
    label: "Đang mở",
    icon: <Play className="size-4" />,
  },
  {
    value: "in_progress",
    label: "Đang xử lý",
    icon: <AlertCircle className="size-4" />,
  },
  { value: "on_hold", label: "Tạm dừng", icon: <Pause className="size-4" /> },
  {
    value: "resolved",
    label: "Đã giải quyết",
    icon: <CheckCircle className="size-4" />,
  },
  { value: "closed", label: "Đã đóng", icon: <XCircle className="size-4" /> },
  { value: "cancelled", label: "Đã hủy", icon: <Ban className="size-4" /> },
];

// Priority options với icons
const priorityOptions: FilterOption[] = [
  { value: "low", label: "Thấp", icon: <ArrowDown className="size-4" /> },
  { value: "medium", label: "Trung bình", icon: <Minus className="size-4" /> },
  { value: "high", label: "Cao", icon: <ArrowUp className="size-4" /> },
  { value: "urgent", label: "Khẩn cấp", icon: <Zap className="size-4" /> },
  {
    value: "critical",
    label: "Rất khẩn cấp",
    icon: <Flame className="size-4" />,
  },
];

/**
 * Component chứa logic và UI chính của trang Ticket List
 * Chỉ được render khi đã qua lớp bảo mật
 */
function TicketListPageContent() {
  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const { mutateAsync: updateTicket } = useUpdateTicket();

  // State để quản lý edit sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    code: StringParam,
    status: StringParam,
    priority: StringParam,
    template_id: StringParam,
    flow_id: StringParam,
    created_by: StringParam,
    assigned_to: StringParam,
    tag_ids: ArrayParam,
  });

  // Set default query params in URL on mount
  useEffect(() => {
    // Only set if not already in URL
    if (query.page === 1 && query.page_size === 10) {
      setQuery({ page: 1, page_size: 10 }, "replaceIn");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { data: tagsData } = useGetTags({ page: 1, page_size: 100 });

  const tagItems: TagItem[] = useMemo(() => {
    const tags = tagsData?.data?.tags || [];
    return tags.map((tag: any) => ({
      id: tag.id,
      label: tag.name,
      color: tag.color || "default",
    }));
  }, [tagsData]);

  // Fetch tickets with query params
  const { data, isLoading } = useGetTickets({
    page: query.page,
    page_size: query.page_size,
    code: query.code || undefined,
    status: query.status || undefined,
    priority: query.priority || undefined,
    template_id: query.template_id || undefined,
    flow_id: query.flow_id || undefined,
    created_by: query.created_by || undefined,
    assigned_to: query.assigned_to || undefined,
    tag_ids: query.tag_ids || undefined,
  });

  const tickets: Ticket[] = useMemo(
    () => (data?.data?.items as unknown as Ticket[]) || [],
    [data],
  );

  // Xử lý xóa ticket
  const { mutateAsync: deleteTicket } = useDeleteTicket();

  const handleDeleteTicket = (id: string) => {
    const ticket = tickets.find((t) => t.code === id || t.id === id);
    if (ticket) {
      setDeletingTicket(ticket);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTicket?.id) {
      await deleteTicket(deletingTicket.id);
      setDeleteDialogOpen(false);
      setDeletingTicket(null);
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setEditSheetOpen(true);
  };

  const handleUpdateTicketStatus = async (
    ticket: Ticket,
    newStatus: string,
  ) => {
    if (!ticket.id) return;

    try {
      const payload: ActionTicketRequest = {
        assigned_to: ticket.assigned_to || "",
        description: ticket.description || "",
        extension_data: Array.isArray(ticket.extension_data)
          ? ticket.extension_data.reduce(
              (acc, item) => {
                if (item.key) acc[item.key] = item.value || "";
                return acc;
              },
              {} as Record<string, string>,
            )
          : {},
        priority: ticket.priority || "",
        status: newStatus,
        tag_ids: (ticket.tags || [])
          .map((t) => t.id)
          .filter((id): id is string => !!id),
        template_id: ticket.template_id || "",
        title: ticket.title,
      };
      await updateTicket({ id: ticket.id, payload });
    } catch (error) {
      console.error("Failed to update ticket priority", error);
    }
  };

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setQuery({ code: value || undefined, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setQuery({ status: value || undefined, page: 1 });
  };

  const handlePriorityChange = (value: string) => {
    setQuery({ priority: value || undefined, page: 1 });
  };

  const handleTagSelect = (tagId: string) => {
    const currentTags = (query.tag_ids || []).filter(
      (id): id is string => id !== null,
    );
    if (!currentTags.includes(tagId)) {
      setQuery({ tag_ids: [...currentTags, tagId], page: 1 });
    }
  };

  const handleTagRemove = (tagId: string) => {
    const currentTags = (query.tag_ids || []).filter(
      (id): id is string => id !== null,
    );
    setQuery({
      tag_ids: currentTags.filter((id) => id !== tagId),
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setQuery({
      code: undefined,
      status: undefined,
      priority: undefined,
      template_id: undefined,
      flow_id: undefined,
      created_by: undefined,
      assigned_to: undefined,
      tag_ids: undefined,
      page: 1,
    });
  };

  const statusColumnOptions: ColumnOption[] = [
    { id: TicketStatus.PENDING, label: "Đang chờ" },
    { id: TicketStatus.OPEN, label: "Đang mở" },
    { id: TicketStatus.IN_PROGRESS, label: "Đang xử lý" },
    { id: TicketStatus.ON_HOLD, label: "Tạm dừng" },
    { id: TicketStatus.RESOLVED, label: "Đã giải quyết" },
    { id: TicketStatus.CLOSED, label: "Đã đóng" },
    { id: TicketStatus.CANCELLED, label: "Đã hủy" },
  ];

  const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: visible,
    }));
  };

  return (
    <div className="flex h-full bg-background relative">
      {/* Navigation Rail Filter */}
      <NavigationRailFilter
        searchPlaceholder="Tìm kiếm theo mã ticket..."
        onSearchChange={handleSearchChange}
        searchDebounceMs={500}
        selectLabel="Trạng thái"
        selectPlaceholder="Chọn trạng thái"
        selectOptions={statusOptions}
        selectValue={query.status || undefined}
        onSelectChange={handleStatusChange}
        selectIcon={<ListTodo className="size-full" />}
        select2Label="Độ ưu tiên"
        select2Placeholder="Chọn độ ưu tiên"
        select2Options={priorityOptions}
        select2Value={query.priority || undefined}
        onSelect2Change={handlePriorityChange}
        select2Icon={<Signal className="size-full" />}
        tags={tagItems}
        selectedTags={(query.tag_ids || []).filter(
          (id): id is string => id !== null,
        )}
        onTagSelect={handleTagSelect}
        onTagRemove={handleTagRemove}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        orientation={"vertical"}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        columnOptions={viewMode == "kanban" ? statusColumnOptions : undefined}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        kanbanPage={query.page ?? 1}
        kanbanPageSize={query.page_size ?? 10}
        kanbanTotalPages={data?.data?.total_pages ?? 1}
        kanbanTotal={data?.data?.total ?? 0}
        onKanbanPageChange={(page) => setQuery({ page })}
        onKanbanPageSizeChange={(page_size) => setQuery({ page_size, page: 1 })}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6 h-full flex flex-col">
          <div className="flex items-center justify-between shrink-0">
            <AppBreadcrumb
              items={[
                { label: "Home", href: "/", icon: <Home className="size-4" /> },
                {
                  label: "Quản lý ticket",
                  href: "/tickets",
                  icon: <IconReportMoney className="size-4" />,
                },
              ]}
            />
          </div>

          {/* Data toolbar: hiển thị ở Kanban (List đã có toolbar bên trong DataTable) */}
          {viewMode === "kanban" && (
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <div className="flex flex-1 items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Quản lý Ticket
                </h2>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Button
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => {
                    setEditingTicket(null);
                    setEditSheetOpen(true);
                  }}
                >
                  <PlusCircle className="size-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Thêm mới
                  </span>
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {viewMode === "list" ? (
              <DataTable
                tickets={tickets}
                totalPages={data?.data?.total_pages || 1}
                totalRecords={data?.data?.total || 0}
                onDeleteTicket={handleDeleteTicket}
                onEditTicket={handleEditTicket}
                isLoading={isLoading}
              />
            ) : (
              <TicketKanbanBoard
                tickets={tickets}
                onTicketUpdate={handleUpdateTicketStatus}
                isLoading={isLoading}
                onDeleteTicket={handleDeleteTicket}
                onEditTicket={handleEditTicket}
                visibleStatuses={columnVisibility}
              />
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa Ticket"
          description={
            <span>
              Bạn có chắc chắn muốn xóa ticket{" "}
              <span className="font-semibold">{deletingTicket?.code}</span>?
            </span>
          }
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          confirmVariant="destructive"
        />

        {/* Edit Ticket Sheet */}
        <TicketCreateSheet
          ticket={editingTicket}
          open={editSheetOpen}
          onOpenChange={(open) => {
            setEditSheetOpen(open);
            if (!open) {
              setEditingTicket(null);
            }
          }}
        />
      </div>
    </div>
  );
}

/**
 * TicketListPage Wrapper
 * Đóng vai trò Guard: Check quyền -> Nếu OK mới render Content
 * Ngăn chặn việc execute hooks/api calls khi chưa có quyền
 */
export default function TicketListPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TICKETS]}>
      <TicketListPageContent />
    </ProtectedRoute>
  );
}
