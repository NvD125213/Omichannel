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

interface LeadDataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  currentPage?: number;
  currentPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function LeadDataTablePagination<TData>({
  table,
  pagination,
  currentPage = 1,
  currentPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: LeadDataTablePaginationProps<TData>) {
  const totalPages = pagination?.total_pages || 1;
  const canPreviousPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    onPageSizeChange?.(newSize);
    onPageChange?.(1);
  };

  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {table.getFilteredSelectedRowModel().rows.length} lead được chọn.
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="lead-rows-per-page" className="text-sm font-medium">
            Số hàng trên mỗi trang
          </Label>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger
              size="sm"
              className="w-20 cursor-pointer bg-white dark:bg-transparent"
              id="lead-rows-per-page"
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
            onClick={() => onPageChange?.(1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang đầu tiên</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Trang trước</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8 cursor-pointer"
            size="icon"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={!canNextPage}
          >
            <span className="sr-only">Trang sau</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex cursor-pointer"
            size="icon"
            onClick={() => onPageChange?.(totalPages)}
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
