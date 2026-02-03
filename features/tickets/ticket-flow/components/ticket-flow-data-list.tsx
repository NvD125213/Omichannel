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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  EllipsisVertical,
  Pencil,
  Trash2,
  Workflow,
  StepForward,
} from "lucide-react";
import { IconCreditCard } from "@tabler/icons-react";
import { useState, useEffect } from "react";
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
import type { TicketFlow } from "../utils/ticket-flow-schema";
import { TicketFlowDataTablePagination } from "./ticket-flow-pagination";
import { TicketFlowDataTableToolbar } from "./ticket-flow-data-toolbar";
import {
  useQueryParam,
  NumberParam,
  StringParam,
  withDefault,
} from "use-query-params";
import { EmptyData } from "@/components/empty-data";
import { IconMoodEmpty } from "@tabler/icons-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { convertDateTime } from "@/utils/convert-time";
import Link from "next/link";
import { TicketFlowStepFormSheet } from "../../ticket-flow-step/components/ticket-flow-step-form";

interface DataTableProps {
  ticketFlows: TicketFlow[];
  onDeleteFlow: (id: string) => void;
  onEditFlow: (flow: TicketFlow) => void;
  totalPages: number;
  totalRecords: number;
  isLoading?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}

export function TicketFlowDataTable({
  ticketFlows,
  onDeleteFlow,
  onEditFlow,
  totalPages,
  totalRecords,
  isLoading,
  columnVisibility: propColumnVisibility,
  onColumnVisibilityChange: propOnColumnVisibilityChange,
}: DataTableProps) {
  // Query params của api
  const [page, setPage] = useQueryParam("page", withDefault(NumberParam, 1));
  const [pageSize, setPageSize] = useQueryParam(
    "page_size",
    withDefault(NumberParam, 10),
  );
  // Search and Sort params are now handled by parent via NavigationRailFilter,
  // but we still read sort for internal table state sync if needed,
  // or rely on the table state updating via props from parent re-render?
  // the table hooks into URL directly for sort.
  const [sortBy, setSortBy] = useQueryParam("sort_by", StringParam);
  const [sortOrder, setSortOrder] = useQueryParam("sort_order", StringParam);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const columnVisibility = propColumnVisibility ?? internalColumnVisibility;

  const setColumnVisibility = (
    updaterOrValue:
      | VisibilityState
      | ((old: VisibilityState) => VisibilityState),
  ) => {
    const newVisibility =
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnVisibility)
        : updaterOrValue;

    if (propOnColumnVisibilityChange) {
      propOnColumnVisibilityChange(newVisibility);
    } else {
      setInternalColumnVisibility(newVisibility);
    }
  };

  // Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);

  // Sorting theo flow
  useEffect(() => {
    if (sortBy && sortOrder) {
      setSorting([{ id: sortBy, desc: sortOrder === "desc" }]);
    } else {
      setSorting([]);
    }
  }, [sortBy, sortOrder]);

  // Update URL params when sorting changes
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
      setSortBy(sort.id);
      setSortOrder(sort.desc ? "desc" : "asc");
    } else {
      setSortBy(undefined);
      setSortOrder(undefined);
    }
  };

  const handleOpenStepForm = (flowId: string) => {
    setSelectedFlowId(flowId);
    setIsSheetOpen(true);
  };

  const columns: ColumnDef<TicketFlow>[] = [
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
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tên luồng xử lý
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const flow = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="font-medium">{flow.name}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mô tả
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Ngày tạo
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const createdAt = row.original.created_at;
        if (!createdAt) return <span className="text-muted-foreground">-</span>;

        const { date, time } = convertDateTime(createdAt, "text");
        return (
          <div className="flex flex-col text-sm">
            <span>{date}</span>
            <span className="text-muted-foreground text-xs">{time}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "steps_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Số bước
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const count = row.original.steps_count ?? 0;
        const getStepsBadgeColor = (count: number) => {
          if (count === 0) return "bg-red-100 text-red-700 border-red-200";
          if (count <= 3) return "bg-blue-100 text-blue-700 border-blue-200";
          if (count <= 6) return "bg-cyan-100 text-cyan-700 border-cyan-200";
          return "bg-indigo-100 text-indigo-700 border-indigo-200";
        };
        return (
          <Badge
            variant="outline"
            className={`font-mono gap-1.5 ${getStepsBadgeColor(count)}`}
          >
            <Workflow className="h-3 w-3" />
            {count}
          </Badge>
        );
      },
    },
    {
      accessorKey: "tickets_count",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="-ml-4 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Số ticket
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        );
      },
      cell: ({ row }) => {
        const count = row.original.tickets_count ?? 0;
        const getTicketsBadgeColor = (count: number) => {
          if (count === 0) return "bg-red-100 text-red-700 border-red-200";
          if (count <= 5) return "bg-green-100 text-green-700 border-green-200";
          if (count <= 15)
            return "bg-emerald-100 text-emerald-700 border-emerald-200";
          return "bg-teal-100 text-teal-700 border-teal-200";
        };
        return (
          <Badge
            variant="outline"
            className={`font-mono gap-1.5 ${getTicketsBadgeColor(count)}`}
          >
            <IconCreditCard className="h-3 w-3" />
            {count}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: "Hành động",
      cell: ({ row }) => {
        const flow = row.original;
        const hasSteps = (flow.steps_count ?? 0) > 0;

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onEditFlow(flow)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Sửa</span>
            </Button>
            <DropdownMenu>
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
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onDeleteFlow(flow.id)}
                >
                  <Trash2 className="size-4" />
                  Xóa
                </DropdownMenuItem>

                <DropdownMenuItem
                  variant="default"
                  className="cursor-pointer"
                  onClick={() => handleOpenStepForm(flow.id)}
                >
                  <StepForward className="size-4" />
                  {hasSteps ? "Chỉnh sửa bước" : "Tạo bước"}
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
    data: ticketFlows,
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

  // Tạo pagination object từ props
  const pagination = {
    total: totalRecords,
    page: page,
    page_size: pageSize,
    total_pages: totalPages,
  };

  return (
    <>
      <div className="space-y-4">
        <TicketFlowDataTableToolbar
          table={table}
          title="Danh sách luồng xử lý"
          // description="Quản lý các quy trình xử lý ticket của hệ thống"
        />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
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
                      title="Dữ liệu luồng xử lý trống."
                      description="Hãy thử thêm mới luồng xử lý hoặc thay đổi thông tin tìm kiếm"
                      showButton={false}
                      buttonText=""
                      onButtonClick={() => console.log("Upload clicked")}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <TicketFlowDataTablePagination
          table={table}
          pagination={pagination}
          currentPage={page}
          currentPageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Sheet Form */}
      {selectedFlowId && (
        <TicketFlowStepFormSheet
          flowId={selectedFlowId}
          flowName={
            ticketFlows.find((f) => f.id === selectedFlowId)?.name ||
            "Luồng xử lý"
          }
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
        />
      )}
    </>
  );
}
