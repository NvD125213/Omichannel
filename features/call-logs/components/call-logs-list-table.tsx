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
  ArrowUpRight,
  ExternalLink,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  NumberParam,
  useQueryParam,
  withDefault,
} from "use-query-params";
import { IconMoodEmpty } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyData } from "@/components/empty-data";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CallLog, Pagination } from "@/services/call-logs/service";
import { convertDateTime } from "@/utils/convert-time";
import { CallLogsListPagination } from "./call-logs-list-pagination";

interface CallLogsListTableProps {
  callLogs: CallLog[];
  pagination?: Pagination;
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds === null || seconds === undefined || Number.isNaN(seconds)) {
    return "—";
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

function getStatusClassName(status: string | null | undefined) {
  const value = String(status ?? "").toLowerCase();
  if (["answered", "completed", "success", "ended"].includes(value)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (["ringing", "in_progress", "busy", "calling"].includes(value)) {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300";
  }
  if (["missed", "failed", "no_answer", "cancelled", "canceled"].includes(value)) {
    return "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";
  }
  return "bg-muted text-muted-foreground";
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
        accessorKey: "phone_number",
        header: "Số điện thoại",
        cell: ({ row }) => {
          const log = row.original;
          return (
            <div className="flex min-w-40 flex-col">
              <span className="font-medium">{log.phone_number || "—"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {log.sip_call_id || "Không có SIP ID"}
              </span>
            </div>
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
              className={cn("font-medium capitalize", getStatusClassName(status))}
            >
              {status || "Không rõ"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "duration",
        header: "Thời lượng",
        cell: ({ row }) => (
          <span className="tabular-nums text-sm">
            {formatDuration(row.original.duration)}
          </span>
        ),
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
        id: "links",
        header: "Liên kết",
        enableSorting: false,
        cell: ({ row }) => {
          const { ticket_id, customer_id, recording_url } = row.original;
          return (
            <div className="flex min-w-36 flex-col gap-1 text-xs">
              {ticket_id ? (
                <span className="truncate text-muted-foreground">
                  Ticket:{" "}
                  <span className="font-medium text-foreground">
                    {ticket_id.slice(0, 8)}…
                  </span>
                </span>
              ) : null}
              {customer_id ? (
                <span className="truncate text-muted-foreground">
                  KH:{" "}
                  <span className="font-medium text-foreground">
                    {customer_id.slice(0, 8)}…
                  </span>
                </span>
              ) : null}
              {recording_url ? (
                <Button
                  asChild
                  variant="link"
                  className="h-auto justify-start p-0 text-xs"
                >
                  <a
                    href={recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="size-3.5" />
                    Nghe ghi âm
                  </a>
                </Button>
              ) : !ticket_id && !customer_id ? (
                <span className="text-muted-foreground">—</span>
              ) : null}
            </div>
          );
        },
      },
    ],
    [],
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
          <h2 className="text-xl font-semibold tracking-tight">
            Lịch sử cuộc gọi
          </h2>
          <p className="text-sm text-muted-foreground">
            Theo dõi các cuộc gọi theo số điện thoại, chiều gọi và trạng thái.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
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
              table.getRowModel().rows.map((row: Row<CallLog>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <EmptyData
                    icon={IconMoodEmpty}
                    title="Chưa có lịch sử cuộc gọi."
                    description="Hãy thử đổi bộ lọc hoặc tìm theo số điện thoại / SIP call ID."
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
    </div>
  );
}
