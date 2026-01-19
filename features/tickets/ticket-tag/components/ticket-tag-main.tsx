"use client";

import { TicketTagDataTable } from "./ticket-tag-data-table";
import { TagFormDialog } from "./ticket-tag-form-data";
import type { TicketTag } from "../utils/schema";
import { useGetTags, useDeleteTag } from "@/hooks/tag/use-tag-ticket";
import {
  useQueryParams,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function TicketTagMain() {
  const [editingTag, setEditingTag] = useState<TicketTag | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTag, setDeletingTag] = useState<TicketTag | null>(null);

  const [query] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    search: StringParam,
  });

  const { data, isLoading } = useGetTags({
    page: query.page,
    page_size: query.page_size,
    search: query.search || undefined,
  });

  const tags: TicketTag[] = (data?.data.tags as unknown as TicketTag[]) || [];

  const { mutateAsync: deleteTag } = useDeleteTag();

  const handleDeleteTag = (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (tag) {
      setDeletingTag(tag);
      setDeleteDialogOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (deletingTag?.id) {
      await deleteTag(deletingTag.id);
      setDeleteDialogOpen(false);
      setDeletingTag(null);
    }
  };

  const handleEditTag = (tag: TicketTag) => {
    setEditingTag(tag);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) {
      setTimeout(() => setEditingTag(null), 150);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <TicketTagDataTable
          tags={tags}
          totalPages={data?.data.pagination.total_pages || 1}
          totalRecords={data?.data.pagination.total_count || 1}
          onDeleteTag={handleDeleteTag}
          onEditTag={handleEditTag}
          isLoading={isLoading}
        />
      </div>

      <TagFormDialog
        tag={editingTag}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa Tag"
        description={
          <span>
            Bạn có chắc chắn muốn xóa tag{" "}
            <span className="font-semibold text-red-500">
              {deletingTag?.name}
            </span>
            ? Hành động này không thể hoàn tác.
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </>
  );
}
