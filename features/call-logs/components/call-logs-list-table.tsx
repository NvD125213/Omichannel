"use client";

import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  ChevronDown,
  ClipboardList,
  EllipsisVertical,
  Eye,
  Phone,
  PhoneCall,
  TimerReset,
  User,
  UserRound,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { NumberParam, useQueryParam, withDefault } from "use-query-params";
import { IconMoodEmpty } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyData } from "@/components/empty-data";
import { TimelineCallLog } from "@/components/timeline-call-log";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetCallLogEvents } from "@/hooks/call-logs/use-call-logs";
import { cn } from "@/lib/utils";
import type { CallLog, Pagination } from "@/services/call-logs/service";
import { convertDateTime } from "@/utils/convert-time";
import { CallLogDetail } from "./call-log-detail";
import { CallLogsListPagination } from "./call-logs-list-pagination";

function CallLogRowTimeline({
  sipCallId,
  enabled,
}: {
  sipCallId: string;
  enabled: boolean;
}) {
  const { data, isLoading, isError } = useGetCallLogEvents(
    sipCallId,
    { page: 1, page_size: 50 },
    enabled && !!sipCallId,
  );
  const events = data?.data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-20 w-full rounded-lg sm:h-28 sm:rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-6 text-center text-sm text-red-600">
        Không tải được timeline cuộc gọi
      </p>
    );
  }

  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Cuộc gọi này chưa ghi nhận sự kiện để vẽ timeline.
      </p>
    );
  }

  return <TimelineCallLog events={events} />;
}

interface CallLogsListTableProps {
  callLogs: CallLog[];
  pagination?: Pagination;
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return null;
  }
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function getCallEndpoints(log: CallLog) {
  const direction = String(log.direction ?? "").toLowerCase();
  const phone = log.phone_number?.trim() || "";
  const from =
    log.from_number?.trim() || (direction === "outbound" ? "" : phone);
  const to = log.to_number?.trim() || (direction === "outbound" ? phone : "");

  return {
    from: from || "—",
    to: to || "—",
    highlightFrom: direction !== "outbound",
    highlightTo: direction === "outbound",
  };
}

function getDirectionMeta(direction: string | null | undefined) {
  const value = String(direction ?? "").toLowerCase();
  if (value === "inbound") {
    return {
      label: "Gọi vào",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
      icon: ArrowDownLeft,
    };
  }
  if (value === "outbound") {
    return {
      label: "Gọi ra",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
      icon: ArrowUpRight,
    };
  }
  return {
    label: direction || "Không rõ",
    className: "bg-muted text-muted-foreground",
    icon: Phone,
  };
}

function getStatusLabel(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  const labels: Record<string, string> = {
    created: "Đã tạo",
    ringing: "Đang đổ chuông",
    calling: "Đang đổ chuông",
    answered: "Đã nghe",
    completed: "Đã nghe",
    success: "Đã nghe",
    ended: "Kết thúc",
    hangup: "Kết thúc",
    missed: "Nhỡ máy",
    busy: "Máy bận",
    no_answer: "Không trả lời",
    failed: "Thất bại",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };
  return labels[value] || status || "Không rõ";
}

function getStatusClassName(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "ended", "completed", "success", "hangup"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (["ringing", "created", "calling"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (
    ["missed", "failed", "no_answer", "busy", "cancelled", "canceled"].includes(
      value,
    )
  ) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-muted text-muted-foreground";
}

/** Ticket ưu tiên hơn customer; không có cả hai = cuộc gọi tự do */
function getCallSourceMeta(log: CallLog) {
  if (log.ticket_id) {
    return {
      label: "Ticket",
      className:
        "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300",
      icon: ClipboardList,
    };
  }
  if (log.customer_id) {
    return {
      label: "Khách hàng",
      className:
        "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300",
      icon: UserRound,
    };
  }
  return {
    label: "Tự do",
    className:
      "border-border bg-muted/60 text-muted-foreground dark:bg-muted/30",
    icon: PhoneCall,
  };
}

function getCallSourceChannel(source: string | null | undefined) {
  const value = String(source ?? "")
    .trim()
    .toLowerCase();
  if (!value) return "—";
  if (value === "web") return "Web";
  return value;
}

function formatDateTimeCell(value: string | null | undefined) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  try {
    const { date, time } = convertDateTime(value, "short");
    return (
      <div className="flex flex-col text-sm">
        <span>{date}</span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    );
  } catch {
    return <span className="text-sm">{value}</span>;
  }
}

export function CallLogsListTable({
  callLogs,
  pagination,
  isLoading,
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
}: CallLogsListTableProps) {
  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 1));
  const [pageSize, setPageSize] = useQueryParam(
    "page_size",
    withDefault(NumberParam, 10),
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);
  const [expandedSipCallIds, setExpandedSipCallIds] = useState<string[]>([]);

  const openDetail = (log: CallLog) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const toggleTimeline = (log: CallLog) => {
    const id = log.sip_call_id;
    if (!id) return;
    setExpandedSipCallIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const columnVisibility = externalColumnVisibility ?? internalColumnVisibility;
  const setColumnVisibility = (
    updater: VisibilityState | ((prev: VisibilityState) => VisibilityState),
  ) => {
    const next =
      typeof updater === "function" ? updater(columnVisibility) : updater;
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(next);
    } else {
      setInternalColumnVisibility(next);
    }
  };

  const columns = useMemo<ColumnDef<CallLog>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center px-2">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Chọn tất cả"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center px-2">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Chọn hàng"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
        size: 48,
      },
      {
        id: "phone_number",
        accessorFn: (log) =>
          [log.from_number, log.to_number, log.phone_number]
            .filter(Boolean)
            .join(" "),
        header: "Luồng gọi",
        cell: ({ row }) => {
          const { from, to, highlightFrom, highlightTo } = getCallEndpoints(
            row.original,
          );

          return (
            <div className="flex min-w-48 items-end gap-2">
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Số gọi đi</p>
                <p
                  className={cn(
                    "mt-0.5 tabular-nums",
                    highlightFrom
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {from}
                </p>
              </div>
              <ArrowRight
                className="mb-0.5 size-3.5 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">Số gọi đến</p>
                <p
                  className={cn(
                    "mt-0.5 tabular-nums",
                    highlightTo
                      ? "font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {to}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "hotline",
        header: "Hotline",
        cell: ({ row }) => {
          const hotline = row.original.hotline?.trim();
          return hotline ? (
            <span className="tabular-nums">{hotline}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "source",
        header: "Nguồn gọi",
        enableSorting: false,
        cell: ({ row }) => {
          const meta = getCallSourceMeta(row.original);
          const Icon = meta.icon;
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", meta.className)}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "tenant_name",
        header: "Doanh nghiệp",
        cell: ({ row }) => {
          const name = row.original.tenant_name?.trim();
          if (!name) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <Badge
              variant="outline"
              className="gap-1 font-medium border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800/50 dark:bg-slate-950/40 dark:text-slate-300"
            >
              <Building2 className="size-3.5" />
              {name}
            </Badge>
          );
        },
      },
      {
        accessorKey: "username_action_call",
        header: "Người thực hiện",
        cell: ({ row }) => {
          const name = row.original.username_action_call?.trim();
          if (!name) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <Badge
              variant="outline"
              className="gap-1 font-medium border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
            >
              <User className="size-3.5" />
              {name}
            </Badge>
          );
        },
      },
      {
        accessorKey: "direction",
        header: "Chiều gọi",
        cell: ({ row }) => {
          const meta = getDirectionMeta(row.original.direction);
          const Icon = meta.icon;
          return (
            <Badge
              variant="outline"
              className={cn("gap-1 font-medium", meta.className)}
            >
              <Icon className="size-3.5" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              variant="outline"
              className={cn("font-medium", getStatusClassName(status))}
            >
              {getStatusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "duration",
        header: "Thời lượng",
        cell: ({ row }) => {
          const label = formatDuration(row.original.duration);
          if (!label) {
            return <span className="text-sm text-muted-foreground">—</span>;
          }
          return (
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-border/60 bg-muted/40 px-2 py-1 text-sm font-medium tabular-nums text-foreground sm:min-w-20 sm:gap-2 sm:px-3">
              <TimerReset className="size-3.5 text-muted-foreground" />
              {label}
            </div>
          );
        },
      },
      {
        accessorKey: "started_at",
        header: "Bắt đầu",
        cell: ({ row }) => formatDateTimeCell(row.original.started_at),
      },
      {
        accessorKey: "ended_at",
        header: "Kết thúc",
        cell: ({ row }) => formatDateTimeCell(row.original.ended_at),
      },
      {
        accessorKey: "recording_url",
        header: "Ghi âm",
        enableSorting: false,
        cell: ({ row }) => {
          const url = row.original.recording_url?.trim();
          if (!url) {
            return (
              <span className="text-muted-foreground text-sm px-1 italic">
                Không có ghi âm
              </span>
            );
          }
          return (
            <audio
              controls
              preload="metadata"
              className="h-9 w-full min-w-48 sm:min-w-64"
              src={url}
            >
              Trình duyệt không hỗ trợ phát audio.
            </audio>
          );
        },
      },
      {
        id: "actions",
        header: "Hành động",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => {
          const sipCallId = row.original.sip_call_id;
          const isExpanded = expandedSipCallIds.includes(sipCallId);

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 cursor-pointer sm:size-8"
                onClick={() => toggleTimeline(row.original)}
                title={isExpanded ? "Thu gọn timeline" : "Xem timeline"}
                aria-expanded={isExpanded}
              >
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    isExpanded && "rotate-180",
                  )}
                />
                <span className="sr-only">
                  {isExpanded ? "Thu gọn timeline" : "Xem timeline"}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="size-10 cursor-pointer sm:size-8"
                onClick={() => openDetail(row.original)}
                title="Xem chi tiết"
              >
                <Eye className="size-4" />
                <span className="sr-only">Xem chi tiết</span>
              </Button>

              {/* <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                  >
                    <EllipsisVertical className="size-4" />
                    <span className="sr-only">Hành động</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleTimeline(row.original)}>
                    <ChevronDown className="size-3.5" />
                    Timeline cuộc gọi
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          );
        },
      },
    ],
    [expandedSipCallIds],
  );

  const table = useReactTable({
    data: callLogs,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination?.total_pages ?? -1,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
            Lịch sử cuộc gọi
          </h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi các cuộc gọi theo số điện thoại, chiều gọi và trạng thái.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-sm sm:rounded-2xl">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
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
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: Row<CallLog>) => {
                const sipCallId = row.original.sip_call_id;
                const isExpanded = expandedSipCallIds.includes(sipCallId);

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      data-state={
                        row.getIsSelected()
                          ? "selected"
                          : isExpanded
                            ? "open"
                            : undefined
                      }
                      className={cn(isExpanded && "border-b-0 bg-muted/20")}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={row.getVisibleCells().length}
                          className="max-w-0 bg-muted/20 p-2 whitespace-normal sm:px-4 sm:pt-0 sm:pb-4"
                        >
                          <div className="w-full min-w-0 overflow-x-auto">
                            <CallLogRowTimeline
                              sipCallId={sipCallId}
                              enabled={isExpanded}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyData
                    icon={IconMoodEmpty}
                    title="Chưa có lịch sử cuộc gọi."
                    description="Hãy thử đổi bộ lọc hoặc tìm theo số điện thoại."
                    showButton={false}
                    buttonText=""
                    onButtonClick={() => null}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CallLogsListPagination
        table={table}
        pagination={pagination}
        currentPage={page}
        currentPageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <CallLogDetail
        callLog={selectedLog}
        open={detailOpen}
        onOpenChange={(next) => {
          setDetailOpen(next);
          if (!next) setSelectedLog(null);
        }}
      />
    </div>
  );
}
