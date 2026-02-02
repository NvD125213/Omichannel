"use client";

import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DataTable } from "@/features/tickets/ticket-template/components/template-data-table";
import { TemplateFormDialog } from "@/features/tickets/ticket-template/components/template-form-modal";
import type { TicketTemplate } from "@/features/tickets/ticket-template/utils/schema";
import {
  useDeleteTicketTemplate,
  useGetTicketTemplates,
} from "@/hooks/ticket/ticket-templates/use-ticket-templates";
import { IconTemplate } from "@tabler/icons-react";
import { Home } from "lucide-react";
import { useState } from "react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";

export default function TicketTemplatesPage() {
  // State để quản lý delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] =
    useState<TicketTemplate | null>(null);

  // State để quản lý edit sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(
    null,
  );

  // Sync query params with URL
  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
    sort_by: StringParam,
    sort_order: StringParam,
  });

  // Fetch templates with query params
  const { data, isLoading } = useGetTicketTemplates({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
    sort_by: query.sort_by || undefined,
    sort_order: (query.sort_order as "asc" | "desc") || undefined,
  });

  const templates: TicketTemplate[] =
    (data?.data?.templates as unknown as TicketTemplate[]) || [];

  const pagination = data?.data?.pagination
    ? {
        total: data.data.pagination.total_count,
        page: data.data.pagination.current_page,
        page_size: data.data.pagination.page_size,
        total_pages: data.data.pagination.total_pages,
      }
    : undefined;

  // Xử lý xóa template
  const { mutateAsync: deleteTemplate } = useDeleteTicketTemplate();

  const handleDeleteTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setDeletingTemplate(template);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTemplate?.id) {
      await deleteTemplate(deletingTemplate.id);
      setDeleteDialogOpen(false);
      setDeletingTemplate(null);
    }
  };

  const handleEditTemplate = (template: TicketTemplate) => {
    setEditingTemplate(template);
    setEditSheetOpen(true);
  };

  return (
    <div className="flex h-full bg-background">
      {/* Main Content */}
      <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
        <div className="@container/main px-4 py-4 lg:px-6 space-y-6">
          <AppBreadcrumb
            items={[
              { label: "Home", href: "/", icon: <Home className="size-4" /> },
              {
                label: "Quản lý ticket",
                href: "/tickets",
              },
              {
                label: "Template",
                href: "/tickets/templates",
                icon: <IconTemplate className="size-4" />,
              },
            ]}
          />
          <DataTable
            templates={templates}
            onDeleteTemplate={handleDeleteTemplate}
            onEditTemplate={handleEditTemplate}
            pagination={pagination}
            isLoading={isLoading}
          />
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Xóa Template"
          description={
            <span>
              Bạn có chắc chắn muốn xóa template{" "}
              <span className="font-semibold">{deletingTemplate?.name}</span>?
            </span>
          }
          confirmText="Xóa"
          cancelText="Hủy"
          onConfirm={handleConfirmDelete}
          confirmVariant="destructive"
        />

        {/* Edit Template Dialog */}
        <TemplateFormDialog
          template={editingTemplate}
          open={editSheetOpen}
          onOpenChange={(open) => {
            setEditSheetOpen(open);
            if (!open) {
              setEditingTemplate(null);
            }
          }}
        />
      </div>
    </div>
  );
}
