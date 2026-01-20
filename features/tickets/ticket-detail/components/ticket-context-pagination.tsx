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
export function DataTablePagination<TData>({
  table,
  pagination,
  currentPage = 1,
  currentPageSize = 10,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const totalPages = pagination?.total_pages || table.getPageCount();

  const canPreviousPage = pagination
    ? currentPage > 1
    : table.getCanPreviousPage();
  const canNextPage = pagination
    ? currentPage < totalPages
    : table.getCanNextPage();

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);
    onPageSizeChange ? onPageSizeChange(newSize) : table.setPageSize(newSize);
    onPageChange?.(1);
  };

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      {/* Page size */}
      <Select value={`${currentPageSize}`} onValueChange={handlePageSizeChange}>
        <SelectTrigger className="h-8 w-[64px] text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent side="top">
          {[10, 20, 30, 40, 50].map((size) => (
            <SelectItem key={size} value={`${size}`}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Page info */}
      <span className="text-xs text-slate-600 shrink-0">
        Trang {currentPage} trên {totalPages}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange?.(1)}
          disabled={!canPreviousPage}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={!canPreviousPage}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={!canNextPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange?.(totalPages)}
          disabled={!canNextPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
