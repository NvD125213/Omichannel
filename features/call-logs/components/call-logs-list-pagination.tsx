"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Pagination } from "@/services/call-logs/service";

interface CallLogsListPaginationProps<TData> {
  table: Table<TData>;
  pagination?: Pagination;
  currentPage?: number;
  currentPageSize?: number;
  onPageChange?: (page: number | null | undefined) => void;
  onPageSizeChange?: (pageSize: number | null | undefined) => void;
}

export function CallLogsListPagination<TData>({
  table,
  pagination,
  currentPage = 1,
  currentPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: CallLogsListPaginationProps<TData>) {
  const totalPages = pagination?.total_pages || table.getPageCount() || 1;

  const canPreviousPage = pagination
    ? currentPage > 1
    : table.getCanPreviousPage();
  const canNextPage = pagination
    ? currentPage < totalPages
    : table.getCanNextPage();

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
      onPageChange?.(1);
      return;
    }
    table.setPageSize(newSize);
  };

  return (
    <div className="flex items-center justify-between px-1">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} cuộc gọi được chọn.
        {pagination?.total ? (
          <span className="ml-1">· Tổng {pagination.total}</span>
        ) : null}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label
            htmlFor="call-logs-rows-per-page"
            className="text-sm font-medium"
          >
            Số hàng trên mỗi trang
          </Label>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger
              size="sm"
              className="w-20 cursor-pointer bg-white dark:bg-transparent"
              id="call-logs-rows-per-page"
            >
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 50, 100].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Trang {currentPage} / {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="hidden size-8 cursor-pointer lg:flex"
            size="icon"
            onClick={() => onPageChange?.(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang đầu</span>
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang trước</span>
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang sau</span>
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 cursor-pointer lg:flex"
            size="icon"
            onClick={() => onPageChange?.(totalPages)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang cuối</span>
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
