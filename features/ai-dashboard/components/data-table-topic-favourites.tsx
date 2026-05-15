"use client";

import { userTrackingChatbotConstants } from "@/constants/dashboard/user-tracking-chatbot";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTablePagination } from "@/features/tasks/components/data-table-pagination";
import { DataTableViewOptions } from "@/features/tasks/components/data-table-view-options";
import { DataTableFacetedFilter } from "@/features/tasks/components/data-table-filtered";

type TrackingRecord = (typeof userTrackingChatbotConstants.records)[number];

function badgeForTag(tag: string) {
  switch (tag) {
    case "Success":
      return {
        variant: "outline" as const,
        className:
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300",
      };
    case "Process":
      return {
        variant: "outline" as const,
        className:
          "border-sky-500/40 bg-sky-500/10 text-sky-900 dark:border-sky-500/35 dark:text-sky-300",
      };
    case "Canceled":
      return { variant: "destructive" as const };
    case "Queued":
      return {
        variant: "outline" as const,
        className:
          "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:border-amber-500/30 dark:text-amber-300",
      };
    case "Review":
      return {
        variant: "outline" as const,
        className:
          "border-violet-500/40 bg-violet-500/10 text-violet-900 dark:border-violet-500/30 dark:text-violet-300",
      };
    case "Escalated":
      return {
        variant: "outline" as const,
        className:
          "border-rose-500/40 bg-rose-500/10 text-rose-900 dark:border-rose-500/30 dark:text-rose-300",
      };
    default:
      return { variant: "secondary" as const };
  }
}

export function DataTableTopicFavourites({
  className,
}: {
  className?: string;
}) {
  const data = userTrackingChatbotConstants.records;
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const tagOptions = useMemo(() => {
    const unique = Array.from(new Set(data.map((r) => r.tag)));
    return unique.map((t) => ({ label: t, value: t }));
  }, [data]);

  const columns = useMemo<ColumnDef<TrackingRecord>[]>(() => {
    return [
      {
        accessorKey: "trackingId",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.trackingId}
          </span>
        ),
      },
      {
        accessorKey: "topic",
        header: "Chủ đề",
        cell: ({ row }) => (
          <span className="max-w-[280px] truncate font-medium">
            {row.original.topic}
          </span>
        ),
      },
      {
        accessorKey: "time",
        header: "Thời gian",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {row.original.time}
          </span>
        ),
      },
      {
        accessorKey: "username",
        header: "Người dùng",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.username}</span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="max-w-[260px] truncate text-muted-foreground">
            {row.original.email}
          </span>
        ),
      },
      {
        accessorKey: "tag",
        header: "Trạng thái",
        filterFn: (row, id, value) => {
          const v = value as string[] | undefined;
          if (!v?.length) return true;
          return v.includes(String(row.getValue(id)));
        },
        cell: ({ row }) => {
          const b = badgeForTag(row.original.tag);
          return (
            <div className="flex justify-end">
              <Badge variant={b.variant} className={b.className}>
                {row.original.tag}
              </Badge>
            </div>
          );
        },
      },
    ];
  }, []);

  const table = useReactTable({
    data,
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <Card
      className={cn(
        "border-border/50 bg-linear-to-br from-violet-500/5 shadow-sm",
        className,
      )}
    >
      <CardHeader className="flex flex-col gap-3 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl sm:text-2xl">
            Theo dõi chatbot
          </CardTitle>
          <CardDescription>
            Lịch sử chủ đề và trạng thái xử lý ({data.length} bản ghi)
          </CardDescription>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative">
              <Input
                placeholder="Tìm theo chủ đề..."
                value={
                  (table.getColumn("topic")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table.getColumn("topic")?.setFilterValue(event.target.value)
                }
                className="h-9 w-[220px] lg:w-[320px]"
              />
            </div>
            {table.getColumn("tag") && tagOptions.length ? (
              <DataTableFacetedFilter
                column={table.getColumn("tag")}
                title="Tag"
                options={tagOptions}
              />
            ) : null}
            {isFiltered ? (
              <Button
                variant="ghost"
                onClick={() => table.resetColumnFilters()}
                className="h-9 px-3"
              >
                Reset
                <X className="ml-1 size-4" />
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <DataTableViewOptions table={table} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        "font-semibold",
                        header.column.id === "tag" && "text-right",
                        header.column.id === "trackingId" && "w-[110px]",
                        header.column.id === "time" && "w-[120px]",
                      )}
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(cell.column.id === "tag" && "text-right")}
                      >
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DataTablePagination table={table} />
      </CardContent>
    </Card>
  );
}
