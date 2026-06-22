"use client";

import { Home, MessageCircleQuestion } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NumberParam, useQueryParams, withDefault } from "use-query-params";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyData } from "@/components/empty-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarDetail,
  SidebarDetailMain,
  SidebarDetailPanel,
} from "@/components/sidebar-detail";
import {
  useDeleteFaq,
  useListFaqs,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type { KgFaq } from "@/services/chatbot-kg-core/interfaces";
import { IconMoodEmpty } from "@tabler/icons-react";
import { FaqDataListItem } from "./faq-data-list-item";
import { FaqDataPagination } from "./faq-data-pagination";
import { FaqDataToolbar } from "./faq-data-toolbar";
import {
  FaqFormDataPanel,
  FaqFormPanelFooter,
  faqFormPanelStateDefault,
  type FaqFormPanelState,
} from "./faq-form-data-panel";

export function FaqDataListTable() {
  const graphId = process.env.NEXT_PUBLIC_TEST_GRAPH_ID ?? "";
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingFaq, setDeletingFaq] = useState<KgFaq | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<KgFaq | null>(null);
  const [formPanelState, setFormPanelState] = useState<FaqFormPanelState>(
    faqFormPanelStateDefault,
  );

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
  });

  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 10;

  const listParams = useMemo(
    () => ({
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [page, pageSize],
  );

  const { data, isLoading, isFetching } = useListFaqs(graphId, listParams);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, total > 0 ? Math.ceil(total / pageSize) : 1);
  const faqs = data?.items ?? [];

  const pagination = useMemo(
    () => ({
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
    }),
    [total, page, pageSize, totalPages],
  );

  const isEditMode = Boolean(editingFaq?.id);

  const handlePageChange = useCallback(
    (newPage: number | null | undefined) => {
      if (!newPage) return;
      setQuery({ page: newPage });
    },
    [setQuery],
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number | null | undefined) => {
      if (!newPageSize) return;
      setQuery({ page: 1, page_size: newPageSize });
    },
    [setQuery],
  );

  useEffect(() => {
    if (isFetching || total === 0) return;
    if (page > totalPages) {
      setQuery({ page: totalPages });
    }
  }, [isFetching, total, page, totalPages, setQuery]);

  const { mutateAsync: deleteFaq } = useDeleteFaq();

  const handleOpenCreate = () => {
    setEditingFaq(null);
    setPanelOpen(true);
  };

  const handleOpenEdit = (faq: KgFaq) => {
    setEditingFaq(faq);
    setPanelOpen(true);
  };

  const handlePanelOpenChange = (open: boolean) => {
    setPanelOpen(open);
    if (!open) {
      setEditingFaq(null);
      setFormPanelState(faqFormPanelStateDefault);
    }
  };

  const handleFormSuccess = () => {
    setPanelOpen(false);
    setEditingFaq(null);
  };

  const handleDeleteFaq = (faq: KgFaq) => {
    setDeletingFaq(faq);
    setDeleteDialogOpen(true);
  };

  const handleRequestDeleteFromPanel = () => {
    if (!editingFaq) return;
    handleDeleteFaq(editingFaq);
  };

  const handleConfirmDelete = async () => {
    if (!deletingFaq?.id || !graphId) return;

    await deleteFaq({
      graphId,
      faqId: deletingFaq.id,
    });
    setDeleteDialogOpen(false);
    setDeletingFaq(null);

    if (editingFaq?.id === deletingFaq.id) {
      setPanelOpen(false);
      setEditingFaq(null);
    }
  };

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <AppBreadcrumb
          items={[
            {
              label: "Trang chủ",
              href: "/ai/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "FAQ",
              href: "/ai/faq",
              icon: <MessageCircleQuestion className="size-4" />,
            },
          ]}
        />
      </div>

      <SidebarDetail
        open={panelOpen}
        onOpenChange={handlePanelOpenChange}
        width={42}
        side="right"
        className="h-full max-h-full min-h-0 flex-1 overflow-hidden dark:bg-transparent"
      >
        <SidebarDetailMain className="h-full max-h-full min-h-0 overflow-hidden px-2 pb-4 lg:pb-4 dark:bg-transparent">
          <div className="flex h-full max-h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="shrink-0 px-2">
              <FaqDataToolbar
                title="FAQ"
                description="Theo dõi và quản lý câu hỏi thường gặp của agent"
                onAdd={handleOpenCreate}
              />
            </div>

            <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-2">
              <div className="h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain thin-scroll">
                {isLoading && !data ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className={`space-y-2 px-4 py-4 sm:px-5 ${
                        index % 2 === 0 ? "bg-muted/30" : "bg-background"
                      }`}
                    >
                      <Skeleton className="h-4 w-2/3 rounded-lg bg-muted/50" />
                      <Skeleton className="h-3 w-full rounded-lg bg-muted/40" />
                    </div>
                  ))
                ) : faqs.length > 0 ? (
                  faqs.map((faq, index) => (
                    <FaqDataListItem
                      key={faq.id}
                      faq={faq}
                      index={index}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteFaq}
                    />
                  ))
                ) : (
                  <div className="bg-transparent py-14">
                    <EmptyData
                      icon={IconMoodEmpty}
                      title="Chưa có FAQ"
                      description="Thêm câu hỏi đầu tiên để agent bắt đầu trả lời"
                      showButton={false}
                      buttonText=""
                      onButtonClick={() => {}}
                    />
                  </div>
                )}
                <div className="shrink-0 border-border/50 px-0 py-4 backdrop-blur-sm">
                  <FaqDataPagination
                    pagination={pagination}
                    currentPage={page}
                    currentPageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </SidebarDetailMain>

        <SidebarDetailPanel
          eyebrow={isEditMode ? "Chỉnh sửa" : "Thêm mới"}
          title={
            isEditMode
              ? (editingFaq?.question ?? "Chỉnh sửa FAQ")
              : "Thêm FAQ mới"
          }
          description={
            isEditMode
              ? "Cập nhật câu hỏi, câu trả lời và biến thể tương đương"
              : "Tạo câu hỏi thường gặp và gợi ý biến thể cho agent"
          }
          footer={
            panelOpen ? (
              <FaqFormPanelFooter
                state={formPanelState}
                onDelete={handleRequestDeleteFromPanel}
              />
            ) : null
          }
        >
          {panelOpen ? (
            <FaqFormDataPanel
              graphId={graphId}
              faq={editingFaq}
              onSuccess={handleFormSuccess}
              onFormStateChange={setFormPanelState}
            />
          ) : null}
        </SidebarDetailPanel>
      </SidebarDetail>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Xóa FAQ này?"
        description={
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground/90">
              {deletingFaq?.question}
            </span>{" "}
            sẽ bị gỡ khỏi danh sách. Thao tác này không hoàn tác được.
          </span>
        }
        confirmText="Xóa"
        cancelText="Giữ lại"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </div>
  );
}
