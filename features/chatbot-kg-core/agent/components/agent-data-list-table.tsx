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
  Bot,
  EllipsisVertical,
  FileText,
  Home,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
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
import type { KgAgent } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";
import { AppBreadcrumb } from "@/components/breadcrumb";
import {
  SidebarDetail,
  SidebarDetailMain,
  SidebarDetailPanel,
} from "@/components/sidebar-detail";
import { useListAgents } from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import { DataTablePagination } from "@/features/chatbot-kg-core/document/components/document-data-pagination";
import { DocumentTableEmptyValue } from "@/features/chatbot-kg-core/document/components/document-table-empty-value";
import { AgentDataDetailPanel } from "./agent-data-detail-panel";
import { AgentDeleteDialog } from "./agent-data-action-dialog";
import { AgentDataTableToolbar } from "./agent-data-table-toolbar";

const headerButtonClass =
  "-ml-3 h-8 rounded-lg px-2 font-medium text-primary/80 transition-colors hover:bg-primary/10 hover:text-primary dark:text-primary/75 dark:hover:bg-primary/15 dark:hover:text-primary";

const tableHeadClass =
  "h-10 bg-primary/8 text-xs font-semibold tracking-wide text-primary/90 dark:bg-primary/10 dark:text-primary";

const tableHeaderRowClass =
  "border-b border-primary/15 bg-primary/5 hover:bg-transparent dark:border-primary/20 dark:bg-primary/8";

const tableRowClass =
  "border-b border-primary/8 bg-background transition-colors hover:bg-primary/[0.04] data-[state=selected]:bg-primary/10 dark:border-sidebar-border/25 dark:bg-transparent dark:hover:bg-primary/10 dark:data-[state=selected]:bg-primary/15";

const tableShellClass =
  "flex max-h-full flex-col overflow-hidden rounded-tl-lg border border-primary/20 bg-background shadow-sm ring-1 ring-primary/5 dark:border-primary/15 dark:bg-transparent dark:ring-primary/10";

const keyChipClass =
  "inline-flex max-w-full items-center rounded-md border border-violet-200/80 bg-violet-50 px-1.5 py-0.5 font-mono text-[11px] text-violet-700 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-300";

const enabledBadgeClass = {
  on: "border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-950/35 dark:text-emerald-400",
  off: "border border-slate-200/80 bg-slate-50 text-slate-600 dark:border-slate-700/50 dark:bg-slate-950/30 dark:text-slate-400",
};

const tableHeaderLabelClass = "text-primary/90 dark:text-primary";

const tableRowStaticClass =
  "border-b border-primary/8 bg-background hover:bg-background dark:border-sidebar-border/25 dark:bg-transparent dark:hover:bg-transparent";

const tableTextPrimaryClass = "text-foreground";

const tableScrollClass =
  "max-h-full overflow-x-auto overflow-y-auto overscroll-contain thin-scroll";

const tableActionButtonClass =
  "size-8 rounded-lg text-primary/70 transition-colors hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15 dark:hover:text-primary";

const tableDeleteButtonClass =
  "size-8 rounded-lg text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive";

function StatusPulseDot({ active }: { active: boolean }) {
  if (!active) {
    return (
      <span className="relative flex size-2 shrink-0" aria-hidden>
        <span className="inline-flex size-2 rounded-full bg-muted-foreground/35" />
      </span>
    );
  }

  return (
    <span className="relative flex size-2 shrink-0" aria-hidden>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/80" />
      <span className="relative inline-flex size-2 animate-pulse rounded-full bg-emerald-500" />
    </span>
  );
}

function AgentEnabledCell({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        enabled ? enabledBadgeClass.on : enabledBadgeClass.off,
      )}
    >
      <StatusPulseDot active={enabled} />
      {enabled ? "Đang bật" : "Đã tắt"}
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

export function AgentDataListTable() {
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<KgAgent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAgent, setDeletingAgent] = useState<KgAgent | null>(null);

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

  const { data, isLoading, isFetching } = useListAgents(listParams);

  const agents = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;

  const enabledOnPage = useMemo(
    () => agents.filter((agent) => agent.enabled).length,
    [agents],
  );

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

  const handleOpenDetail = (agent: KgAgent) => {
    setSelectedAgent(agent);
    setDetailOpen(true);
  };

  const handleDeleteAgent = (agent: KgAgent) => {
    setDeletingAgent(agent);
    setDeleteDialogOpen(true);
  };

  const handleAgentDeleted = () => {
    if (selectedAgent?.id === deletingAgent?.id) {
      setDetailOpen(false);
      setSelectedAgent(null);
    }
    setDeletingAgent(null);
  };

  const handleDetailOpenChange = (open: boolean) => {
    setDetailOpen(open);
    if (!open) {
      setSelectedAgent(null);
    }
  };

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

  const columns: ColumnDef<KgAgent>[] = [
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
      accessorKey: "name",
      header: ({ column }) => <SortableHeader label="Agent" column={column} />,
      cell: ({ row }) => {
        const agent = row.original;

        return (
          <div className="flex min-w-0 items-center gap-2.5 py-0.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary dark:border-primary/25 dark:bg-primary/15">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0 space-y-1">
              {agent.name ? (
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    tableTextPrimaryClass,
                  )}
                >
                  {agent.name}
                </span>
              ) : (
                <DocumentTableEmptyValue />
              )}
              {agent.key ? (
                <span className={cn("truncate", keyChipClass)}>
                  {agent.key}
                </span>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "enabled",
      header: ({ column }) => (
        <SortableHeader label="Trạng thái" column={column} />
      ),
      cell: ({ row }) => <AgentEnabledCell enabled={row.original.enabled} />,
      size: 132,
    },

    {
      id: "actions",
      enableSorting: false,
      header: () => (
        <span className={cn("px-2 text-sm font-medium", tableHeaderLabelClass)}>
          Thao tác
        </span>
      ),
      cell: ({ row }) => {
        const agent = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={tableDeleteButtonClass}
              onClick={() => handleDeleteAgent(agent)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">Xóa</span>
            </Button>
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
                  onClick={() => handleOpenDetail(agent)}
                >
                  <FileText className="size-4" />
                  Chi tiết
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                  <Link
                    href={`/ai/agent/actions?agent_id=${agent.id}`}
                    className="flex items-center gap-2"
                  >
                    <Pencil className="size-4" />
                    Sửa
                  </Link>
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
    data: agents,
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

  const detailAgent = selectedAgent;

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
              label: "Agent",
              href: "/ai/agent",
              icon: <Bot className="size-4" />,
            },
          ]}
        />
      </div>

      <SidebarDetail
        open={detailOpen}
        onOpenChange={handleDetailOpenChange}
        width={42}
        side="right"
        className="h-full max-h-full min-h-0 flex-1 overflow-hidden dark:bg-transparent"
      >
        <SidebarDetailMain className="h-full max-h-full min-h-0 overflow-hidden px-2 pb-4 lg:pb-4 dark:bg-transparent">
          <div className="flex h-full max-h-full min-h-0 flex-col gap-3 overflow-hidden">
            <div className="shrink-0">
              <AgentDataTableToolbar
                title="Agent"
                description="Quản lý và xem cấu hình các agent tri thức"
                enabledCount={enabledOnPage}
                totalCount={agents.length}
              />
            </div>

            <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className={cn(tableShellClass, "w-full")}>
                  <div className={tableScrollClass}>
                    <Table containerClassName="overflow-visible">
                      <TableHeader className="[&_th:first-child]:overflow-hidden [&_th:first-child]:rounded-tl-lg [&_th:last-child]:rounded-tr-none [&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:shadow-[0_1px_0_0_hsl(var(--primary)/0.12)] dark:[&_th]:shadow-[0_1px_0_0_hsl(var(--sidebar-border)/0.45)]">
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
                      <TableBody className="[&_tr:last-child]:border-b [&_tr:last-child_td:first-child]:rounded-bl-none">
                        {isLoading && !data ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow
                              key={index}
                              className={tableRowStaticClass}
                            >
                              {columns.map((_, cellIndex) => (
                                <TableCell key={cellIndex} className="py-2.5">
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
                              className={cn(tableRowClass)}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="py-2.5">
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
                                title="Chưa có agent"
                                description="Tạo agent đầu tiên để bắt đầu tư vấn tự động"
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

              <div className="shrink-0 border-primary/15 pt-2 dark:border-primary/20">
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
          contentKey={detailAgent?.id ?? "empty"}
          eyebrow="Chi tiết"
          title={detailAgent?.name ?? detailAgent?.key ?? "Chi tiết agent"}
          description={
            detailAgent?.enabled
              ? "Agent đang bật — xem cấu hình vận hành"
              : "Agent đã tắt — xem cấu hình vận hành"
          }
        >
          {detailAgent ? <AgentDataDetailPanel agent={detailAgent} /> : null}
        </SidebarDetailPanel>
      </SidebarDetail>

      <AgentDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeletingAgent(null);
        }}
        agent={deletingAgent}
        onDeleted={handleAgentDeleted}
      />
    </div>
  );
}
