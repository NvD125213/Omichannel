"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  EllipsisVertical,
  FileText,
  Home,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";
import {
  NumberParam,
  StringParam,
  useQueryParams,
  withDefault,
} from "use-query-params";
import type { KgDocument } from "@/services/chatbot-kg-core/interfaces";
import { convertDateTime } from "@/utils/convert-time";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  SidebarDetail,
  SidebarDetailMain,
  SidebarDetailPanel,
} from "@/components/sidebar-detail";
import { useListDocuments } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { useGraphId } from "@/hooks/use-graph-id";

import {
  DocumentDeleteDialog,
  DocumentUploadDialog,
  type DocumentUploadResult,
} from "./document-action-diaglog";
import { DataTablePagination } from "./document-data-pagination";
import { DocumentDataDetailPanel } from "./document-data-detail-panel";
import { DocumentDataTableToolbar } from "./document-data-table-toolbar";
import { DocumentTableEmptyValue } from "./document-table-empty-value";
import { DocumentInteractiveProgress } from "./document-interactive-progress";
import { DocumentTableProgressCell } from "./document-table-progress-cell";
import {
  DocumentContentTypeBadge,
  DocumentSourceTypeBadge,
} from "./document-type-badge";
import {
  getStatusLabel,
  getStatusTone,
  isTerminalStatus,
  statusToneClass,
} from "../utils/document-status";
import { DOCUMENT_PROCESSING_POLL_INTERVAL_MS } from "../utils/document-polling";

const headerButtonClass =
  "-ml-3 h-8 rounded-lg px-2 font-medium text-accent-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary dark:text-sidebar-foreground/75 dark:hover:bg-sidebar-accent dark:hover:text-sidebar-foreground";

const tableHeadClass =
  "h-11 bg-accent text-xs font-semibold tracking-wide text-accent-foreground dark:bg-card dark:text-sidebar-primary-foreground";

const tableHeaderRowClass =
  "border-b border-primary/10 hover:bg-transparent dark:border-sidebar-border/40";

const tableHeaderLabelClass =
  "text-accent-foreground dark:text-sidebar-primary-foreground";

const tableRowClass =
  "border-b border-primary/8 bg-background transition-colors hover:bg-accent/45 data-[state=selected]:bg-primary/8 dark:border-sidebar-border/25 dark:hover:bg-primary/10 dark:data-[state=selected]:bg-primary/15";

const tableRowStaticClass =
  "border-b border-primary/8 bg-background hover:bg-background dark:border-sidebar-border/25 dark:bg-transparent dark:hover:bg-transparent";

const tableTextPrimaryClass = "text-foreground";

const tableTextSecondaryClass = "text-muted-foreground";

const tableShellClass =
  "flex max-h-full flex-col overflow-hidden rounded-tl-lg border border-primary/15 bg-background shadow-sm dark:border-sidebar-border/45";

const tableScrollClass =
  "max-h-full overflow-x-auto overflow-y-auto overscroll-contain thin-scroll";

const tableActionButtonClass =
  "size-8 rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-primary dark:hover:bg-primary/15 dark:hover:text-primary";

type ProcessingDocument = {
  documentId: string;
  filename: string;
  status: string;
};

function toProcessingDocumentStub(
  item: ProcessingDocument,
  graphId: string,
): KgDocument {
  return {
    id: item.documentId,
    graph_id: graphId,
    filename: item.filename,
    status: item.status,
    content_type: "",
    created_at: "",
  };
}

function DocumentStatusCell({ status }: { status: string }) {
  if (!status) {
    return <DocumentTableEmptyValue />;
  }

  const tone = getStatusTone(status);

  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide",
        statusToneClass[tone],
      )}
    >
      {getStatusLabel(status)}
    </Badge>
  );
}

function SortableHeader({
  label,
  column,
}: {
  label: string;
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      className={headerButtonClass}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1.5 size-3.5 opacity-60" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1.5 size-3.5 opacity-60" />
      ) : (
        <ArrowUpDown className="ml-1.5 size-3.5 opacity-40" />
      )}
    </Button>
  );
}

export function DocumentDataListTable() {
  const graphId = useGraphId();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<KgDocument | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<KgDocument | null>(
    null,
  );
  const [processingDocuments, setProcessingDocuments] = useState<
    ProcessingDocument[]
  >([]);
  const [trackedDocumentId, setTrackedDocumentId] = useState<string | null>(
    null,
  );

  const [query, setQuery] = useQueryParams({
    page: withDefault(NumberParam, 1),
    page_size: withDefault(NumberParam, 10),
    sort_by: StringParam,
    sort_order: StringParam,
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

  const { data, isLoading, isFetching } = useListDocuments(
    graphId,
    listParams,
    {
      refetchInterval:
        processingDocuments.length > 0
          ? DOCUMENT_PROCESSING_POLL_INTERVAL_MS
          : false,
    },
  );

  const documents = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const processingDocumentIds = useMemo(
    () => new Set(processingDocuments.map((item) => item.documentId)),
    [processingDocuments],
  );

  const pendingUploads = useMemo(
    () =>
      processingDocuments.filter(
        (item) => !documents.some((doc) => doc.id === item.documentId),
      ),
    [processingDocuments, documents],
  );

  const detailDocument = useMemo((): KgDocument | null => {
    if (selectedDocument) return selectedDocument;

    const activeId = trackedDocumentId;
    if (!activeId) return null;

    const fromList = documents.find((doc) => doc.id === activeId);
    if (fromList) return fromList;

    const fromProcessing = processingDocuments.find(
      (item) => item.documentId === activeId,
    );
    if (fromProcessing) {
      return toProcessingDocumentStub(fromProcessing, graphId);
    }

    return null;
  }, [
    selectedDocument,
    trackedDocumentId,
    documents,
    processingDocuments,
    graphId,
  ]);

  const pagination = useMemo(() => {
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

    return {
      total,
      page,
      page_size: pageSize,
      total_pages: Math.max(1, totalPages),
    };
  }, [total, page, pageSize]);

  const handlePageChange = useCallback(
    (newPage: number | null | undefined) => {
      setQuery({ page: newPage ?? 1 });
    },
    [setQuery],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number | null | undefined) => {
      setQuery({ page_size: newSize ?? 10, page: 1 });
    },
    [setQuery],
  );

  useEffect(() => {
    if (isFetching || total === 0) return;

    if (page > pagination.total_pages) {
      setQuery({ page: pagination.total_pages });
    }
  }, [isFetching, total, page, pagination.total_pages, setQuery]);

  useEffect(() => {
    setProcessingDocuments((prev) => {
      if (prev.length === 0) return prev;

      const next = prev
        .map((item) => {
          const document = documents.find((doc) => doc.id === item.documentId);
          if (!document) return item;
          return { ...item, status: document.status };
        })
        .filter((item) => {
          const document = documents.find((doc) => doc.id === item.documentId);
          const status = document?.status ?? item.status;
          return !isTerminalStatus(status);
        });

      return next.length === prev.length ? prev : next;
    });
  }, [documents]);

  const handleDeleteDocument = (id: string) => {
    const document = documents.find((item) => item.id === id);
    if (document) {
      setDeletingDocument(document);
      setDeleteDialogOpen(true);
    }
  };

  const handleOpenDetail = (document: KgDocument) => {
    setSelectedDocument(document);
    setTrackedDocumentId(null);
    setDetailOpen(true);
  };

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedDocument(null);
      setTrackedDocumentId(null);
    }
  };

  const handleUploaded = useCallback(
    (result: DocumentUploadResult) => {
      setProcessingDocuments((prev) => [
        ...prev.filter((item) => item.documentId !== result.documentId),
        {
          documentId: result.documentId,
          filename: result.filename,
          status: result.status,
        },
      ]);
      setTrackedDocumentId(result.documentId);
      setSelectedDocument(
        toProcessingDocumentStub(
          {
            documentId: result.documentId,
            filename: result.filename,
            status: result.status,
          },
          graphId,
        ),
      );
      setDetailOpen(true);
    },
    [graphId],
  );

  const handleProcessingStatusChange = useCallback(
    (status: string) => {
      if (!trackedDocumentId) return;

      setProcessingDocuments((prev) =>
        prev.map((item) =>
          item.documentId === trackedDocumentId ? { ...item, status } : item,
        ),
      );

      setSelectedDocument((prev) =>
        prev?.id === trackedDocumentId ? { ...prev, status } : prev,
      );

      if (isTerminalStatus(status)) {
        setTrackedDocumentId(null);
      }
    },
    [trackedDocumentId],
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (query.sort_by && query.sort_order) {
      setSorting([{ id: query.sort_by, desc: query.sort_order === "desc" }]);
    } else {
      setSorting([]);
    }
  }, [query.sort_by, query.sort_order]);

  const handleSortingChange = (
    updaterOrValue: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const newSorting =
      typeof updaterOrValue === "function"
        ? updaterOrValue(sorting)
        : updaterOrValue;
    setSorting(newSorting);

    if (newSorting.length > 0) {
      const sort = newSorting[0];
      setQuery({
        sort_by: sort.id,
        sort_order: sort.desc ? "desc" : "asc",
      });
    } else {
      setQuery({ sort_by: undefined, sort_order: undefined });
    }
  };

  const columns: ColumnDef<KgDocument>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-1">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Chọn tất cả"
            className="rounded-md"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-1">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Chọn dòng"
            className="rounded-md"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 44,
    },
    {
      accessorKey: "filename",
      header: ({ column }) => (
        <SortableHeader label="Tài liệu" column={column} />
      ),
      cell: ({ row }) => {
        const document = row.original;
        if (!document.filename) {
          return <DocumentTableEmptyValue />;
        }

        return (
          <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
            <span className={cn("truncate font-medium", tableTextPrimaryClass)}>
              {document.filename}
            </span>
            {document.title && (
              <span className={cn("truncate text-xs", tableTextSecondaryClass)}>
                {document.title}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "content_type",
      header: ({ column }) => (
        <SortableHeader label="Định dạng" column={column} />
      ),
      cell: ({ row }) => (
        <DocumentContentTypeBadge contentType={row.original.content_type} />
      ),
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <SortableHeader label="Trạng thái" column={column} />
      ),
      cell: ({ row }) => <DocumentStatusCell status={row.original.status} />,
    },
    {
      accessorKey: "source_type",
      header: ({ column }) => <SortableHeader label="Nguồn" column={column} />,
      cell: ({ row }) => (
        <DocumentSourceTypeBadge sourceType={row.original.source_type} />
      ),
    },
    {
      id: "processing_progress",
      header: () => (
        <span
          className={cn(
            "rounded-lg px-2 text-sm font-medium",
            tableHeaderLabelClass,
          )}
        >
          Tiến trình
        </span>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const isTracked = processingDocumentIds.has(row.original.id);

        return (
          <DocumentTableProgressCell status={status} highlighted={isTracked} />
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <SortableHeader label="Thêm lúc" column={column} />
      ),
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        if (!createdAt) {
          return <DocumentTableEmptyValue />;
        }
        const { date, time } = convertDateTime(createdAt);
        return (
          <div
            className={cn(
              "flex flex-col gap-0.5 text-sm tabular-nums",
              tableTextSecondaryClass,
            )}
          >
            <span>{date}</span>
            <span className="text-xs">{time}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "quality_score",
      header: ({ column }) => (
        <SortableHeader label="Chất lượng" column={column} />
      ),
      cell: ({ row }) => {
        const score = row.original.quality_score;
        if (score == null) {
          return <DocumentTableEmptyValue />;
        }

        return (
          <span className={cn("text-sm tabular-nums", tableTextSecondaryClass)}>
            {score.toFixed(1)}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => (
        <span
          className={cn(" px-2 text-sm font-medium", tableHeaderLabelClass)}
        >
          Thao tác
        </span>
      ),
      cell: ({ row }) => {
        const document = row.original;
        return (
          <div className="px-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={tableActionButtonClass}
                >
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">Mở thao tác</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg"
                  onClick={() => handleOpenDetail(document)}
                >
                  <FileText className="size-4" />
                  Chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer rounded-lg"
                  onClick={() => handleDeleteDocument(document.id)}
                >
                  <Trash2 className="size-4" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  /* eslint-disable-next-line */
  const table = useReactTable({
    data: documents,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden p-4">
      <div className="shrink-0 px-4 pt-2 pb-3">
        <AppBreadcrumb
          items={[
            {
              label: "Trang chủ",
              href: "/ai/dashboard",
              icon: <Home className="size-4" />,
            },
            {
              label: "Tài liệu",
              href: "/ai/document",
              icon: <FileText className="size-4" />,
            },
          ]}
        />
      </div>

      <SidebarDetail
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        width={40}
        side="right"
        className="h-full max-h-full min-h-0 flex-1 overflow-hidden dark:bg-transparent"
      >
        <SidebarDetailMain className="h-full max-h-full min-h-0 overflow-hidden px-2 pb-4 lg:pb-4 dark:bg-transparent">
          <div className="flex h-full max-h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="shrink-0">
              <DocumentDataTableToolbar
                table={table}
                title="Tài liệu"
                description="Theo dõi và quản lý nguồn tri thức của agent"
                onAdd={() => setUploadDialogOpen(true)}
              />
            </div>

            {pendingUploads.length > 0 && (
              <div className="shrink-0 space-y-2">
                {pendingUploads.map((item) => (
                  <div
                    key={item.documentId}
                    className="rounded-xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-950/20"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {item.filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tài liệu vừa tải lên đang được xử lý
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          statusToneClass.pending,
                        )}
                      >
                        {getStatusLabel(item.status)}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <DocumentTableProgressCell
                        status={item.status}
                        highlighted
                        compact
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className={cn(tableShellClass, "w-full")}>
                  <div className={tableScrollClass}>
                    <Table containerClassName="overflow-visible">
                      <TableHeader className="[&_th:first-child]:overflow-hidden [&_th:first-child]:rounded-tl-lg [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:shadow-[0_1px_0_0_hsl(var(--primary)/0.12)] dark:[&_th]:shadow-[0_1px_0_0_hsl(var(--sidebar-border)/0.45)]">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className={tableHeaderRowClass}
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead
                                key={header.id}
                                colSpan={header.colSpan}
                                className={tableHeadClass}
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody className="[&_tr:last-child]:border-b [&_tr:last-child_td:first-child]:overflow-hidden [&_tr:last-child_td:first-child]:rounded-bl-lg">
                        {isLoading && !data ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow
                              key={index}
                              className={tableRowStaticClass}
                            >
                              {columns.map((_, cellIndex) => (
                                <TableCell key={cellIndex} className="py-4">
                                  <Skeleton className="h-5 w-full rounded-lg bg-muted/60" />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              className={tableRowClass}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-3.5">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow className={tableRowStaticClass}>
                            <TableCell colSpan={columns.length}>
                              <EmptyData
                                icon={IconMoodEmpty}
                                title="Chưa có tài liệu"
                                description="Tải lên tệp đầu tiên để agent bắt đầu học"
                                showButton={false}
                                buttonText=""
                                onButtonClick={() => {}}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-primary/10 pt-3 dark:border-sidebar-border/40">
                <DataTablePagination
                  table={table}
                  pagination={pagination}
                  currentPage={page}
                  currentPageSize={pageSize}
                  selectedCount={selectedCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </div>
          </div>
        </SidebarDetailMain>

        <SidebarDetailPanel
          contentKey={detailDocument?.id ?? "empty"}
          eyebrow={
            detailDocument && !isTerminalStatus(detailDocument.status)
              ? "Tiến trình"
              : "Chi tiết"
          }
          title={detailDocument?.filename ?? "Chi tiết tài liệu"}
          description={
            detailDocument && !isTerminalStatus(detailDocument.status)
              ? "Theo dõi trạng thái xử lý tài liệu"
              : "Thông tin mở rộng và metadata của tài liệu"
          }
        >
          {detailDocument ? (
            <>
              {!isTerminalStatus(detailDocument.status) && (
                <DocumentInteractiveProgress
                  graphId={graphId}
                  documentId={detailDocument.id}
                  filename={detailDocument.filename}
                  onStatusChange={
                    trackedDocumentId === detailDocument.id
                      ? handleProcessingStatusChange
                      : undefined
                  }
                />
              )}
              <DocumentDataDetailPanel
                graphId={graphId}
                document={detailDocument}
              />
            </>
          ) : null}
        </SidebarDetailPanel>
      </SidebarDetail>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        graphId={graphId}
        onUploaded={handleUploaded}
      />

      <DocumentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        graphId={graphId}
        document={deletingDocument}
        onDeleted={() => setDeletingDocument(null)}
      />
    </div>
  );
}
