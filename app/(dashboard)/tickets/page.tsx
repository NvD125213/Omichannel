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
import { useGetTicketTemplates } from "@/hooks/ticket/ticket-templates/use-ticket-templates";
import { useGetTicketFlows } from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { useListUser } from "@/hooks/user/use-list-user";
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
  type ColumnOption,
  type TagItem,
} from "@/components/navigation-rail-filter";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

// Status options với icons
const statusOptions: FilterOption[] = [
  { value: "pending", label: "Đang chờ", icon: <Clock className="size-4" /> },
  { value: "open", label: "Đang mở", icon: <Play className="size-4" /> },
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

// Column options for visibility toggle
const columnOptions: ColumnOption[] = [
  { id: "code", label: "Mã Ticket" },
  { id: "title", label: "Tiêu đề" },
  { id: "priority", label: "Độ ưu tiên" },
  { id: "status", label: "Trạng thái" },
  { id: "created_at", label: "Ngày tạo" },
  { id: "created_by_name", label: "Người tạo" },
  { id: "assigned_to_name", label: "Người xử lý" },
];

/**
 * Component chứa logic và UI chính của trang Ticket List
 * Chỉ được render khi đã qua lớp bảo mật
 */
function TicketListPageContent() {
  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // State để quản lý edit sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Column visibility state
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

  // Fetch data for filter options
  // const { data: templatesData } = useGetTicketTemplates({
  //   page: 1,
  //   page_size: 100,
  // });
  // const { data: flowsData } = useGetTicketFlows({ page: 1, page_size: 100 });
  // const { data: usersData } = useListUser({ page: 1, page_size: 100 });
  const { data: tagsData } = useGetTags({ page: 1, page_size: 100 });

  // Build filter options from API data
  // const templateOptions: FilterOption[] = useMemo(() => {
  //   const templates = templatesData?.data?.templates || [];
  //   return templates.map((t: any) => ({
  //     value: t.id,
  //     label: t.name,
  //   }));
  // }, [templatesData]);

  // const flowOptions: FilterOption[] = useMemo(() => {
  //   const flows = flowsData?.data?.data?.flows || [];
  //   return flows.map((f: any) => ({
  //     value: f.id,
  //     label: f.name,
  //   }));
  // }, [flowsData]);

  // const userOptions: FilterOption[] = useMemo(() => {
  //   const users = usersData?.data?.items || [];
  //   return users.map((u: any) => ({
  //     value: u.id,
  //     label: u.fullname || u.username,
  //   }));
  // }, [usersData]);

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

  const tickets: Ticket[] = (data?.data?.items as unknown as Ticket[]) || [];

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

  // const handleTemplateChange = (values: string[]) => {
  //   setQuery({ template_id: values[0] || undefined, page: 1 });
  // };

  // const handleFlowChange = (values: string[]) => {
  //   setQuery({ flow_id: values[0] || undefined, page: 1 });
  // };

  // const handleCreatedByChange = (values: string[]) => {
  //   setQuery({ created_by: values[0] || undefined, page: 1 });
  // };

  // const handleAssignedToChange = (values: string[]) => {
  //   setQuery({ assigned_to: values[0] || undefined, page: 1 });
  // };

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

  // Column visibility handler
  // const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
  //   setColumnVisibility((prev) => ({
  //     ...prev,
  //     [columnId]: visible,
  //   }));
  // };

  return (
    <div className="flex h-full bg-background">
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
        select2Label="Độ ưu tiên"
        select2Placeholder="Chọn độ ưu tiên"
        select2Options={priorityOptions}
        select2Value={query.priority || undefined}
        onSelect2Change={handlePriorityChange}
        tags={tagItems}
        selectedTags={(query.tag_ids || []).filter(
          (id): id is string => id !== null,
        )}
        onTagSelect={handleTagSelect}
        onTagRemove={handleTagRemove}
        onClearAll={handleClearFilters}
        onApplyFilters={() => {}}
        // columnOptions={columnOptions}
        // columnVisibility={columnVisibility}
        // onColumnVisibilityChange={handleColumnVisibilityChange}
      />

      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
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
          <DataTable
            tickets={tickets}
            totalPages={data?.data?.total_pages || 1}
            totalRecords={data?.data?.total || 0}
            onDeleteTicket={handleDeleteTicket}
            onEditTicket={handleEditTicket}
            isLoading={isLoading}
          />
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
