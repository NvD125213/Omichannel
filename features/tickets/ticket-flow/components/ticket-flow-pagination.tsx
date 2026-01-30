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

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  currentPage?: number;
  currentPageSize?: number;
  onPageChange?: (page: number | null | undefined) => void;
  onPageSizeChange?: (pageSize: number | null | undefined) => void;
}

export function TicketFlowDataTablePagination<TData>({
  table,
  pagination,
  currentPage = 1,
  currentPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  // Use server pagination if available, otherwise fall back to table pagination
  const totalPages = pagination?.total_pages || table.getPageCount();
  const pageIndex = pagination
    ? pagination.page - 1
    : table.getState().pagination.pageIndex;
  const pageSize =
    pagination?.page_size || table.getState().pagination.pageSize;

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
      // Reset to page 1 when changing page size
      onPageChange?.(1);
    } else {
      table.setPageSize(newSize);
    }
  };

  const handleFirstPage = () => {
    if (onPageChange) {
      onPageChange(1);
    } else {
      table.setPageIndex(0);
    }
  };

  const handlePreviousPage = () => {
    if (onPageChange) {
      onPageChange(currentPage - 1);
    } else {
      table.previousPage();
    }
  };

  const handleNextPage = () => {
    if (onPageChange) {
      onPageChange(currentPage + 1);
    } else {
      table.nextPage();
    }
  };

  const handleLastPage = () => {
    if (onPageChange) {
      onPageChange(totalPages);
    } else {
      table.setPageIndex(table.getPageCount() - 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} luồng xử lý được chọn.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Số hàng trên mỗi trang
          </Label>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger
              size="sm"
              className="w-20 cursor-pointer"
              id="rows-per-page"
            >
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={`${size}`}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Trang {currentPage} trên {totalPages}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex cursor-pointer"
            onClick={handleFirstPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang đầu tiên</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={handlePreviousPage}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang trước</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={handleNextPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang sau</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex cursor-pointer"
            size="icon"
            onClick={handleLastPage}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang cuối cùng</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
