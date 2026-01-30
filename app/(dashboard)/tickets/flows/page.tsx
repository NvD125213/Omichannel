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
import { Home } from "lucide-react";
import { IconBuilding, IconLock } from "@tabler/icons-react";
import { TicketFlow } from "@/features/tickets/ticket-flow/utils/ticket-flow-schema";

export default function TicketFlowsPage() {
  // State để quản lý edit dialog
  const [editingFlow, setEditingFlow] = useState<TicketFlow | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicketFlow, setDeletingTicketFlow] =
    useState<TicketFlow | null>(null);

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  // Fetch users with query params
  const { data, isLoading } = useGetTicketFlows({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
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

  return (
    <>
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

        {/* Edit/Create Flow Dialog */}
        <TicketFlowFormDialog
          ticketFlow={editingFlow}
          open={editDialogOpen}
          onOpenChange={handleEditDialogClose}
        />
      </div>
    </>
  );
}
