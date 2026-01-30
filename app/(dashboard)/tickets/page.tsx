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
import { IconReportMoney } from "@tabler/icons-react";
import { Home } from "lucide-react";
import { useState } from "react";
import {
  NumberParam,
  StringParam,
  ArrayParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

export default function TicketListPage() {
  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTicket, setDeletingTicket] = useState<Ticket | null>(null);

  // State để quản lý edit sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);

  // Sync query params with URL - with default values
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    status: StringParam,
    priority: StringParam,
    code: StringParam,
    tag_ids: ArrayParam,
  });

  // Fetch tickets with query params
  const { data, isLoading } = useGetTickets({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined, // Map 'search' param to 'keyword' if API expects it, or keep as search
    // Add other filters as API expects
    status: query.status,
    priority: query.priority,
    code: query.code,
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

  return (
    <>
      <div className="p-4 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
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
    </>
  );
}
