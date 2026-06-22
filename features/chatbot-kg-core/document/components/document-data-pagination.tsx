"use client";

import type { Table } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckSquare,
  FileText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  selectedCount?: number;
  onPageChange?: (page: number | null | undefined) => void;
  onPageSizeChange?: (pageSize: number | null | undefined) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];

/** Đồng bộ palette modern-minimal (primary / accent / sidebar tokens) */
const controlClass =
  "h-8 cursor-pointer rounded-lg border-primary/15 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-primary dark:border-sidebar-border/40 dark:bg-card/80 dark:hover:bg-primary/15 dark:hover:text-primary";

const iconControlClass =
  "size-8 cursor-pointer rounded-lg border-primary/15 bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-primary disabled:opacity-40 dark:border-sidebar-border/40 dark:bg-card/80 dark:hover:bg-primary/15 dark:hover:text-primary";

const paginationSummaryClass =
  "inline-flex items-center gap-2 rounded-lg border border-primary/12 bg-accent/40 px-3 py-1.5 text-sm text-muted-foreground dark:border-sidebar-border/40 dark:bg-primary/10";

const paginationCountClass =
  "inline-flex mx-0.5 h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[11px] font-semibold tabular-nums text-primary-foreground ring-1 ring-primary/20 dark:ring-sidebar-border/30";

function getPageSizeOptions(currentPageSize: number) {
  if (DEFAULT_PAGE_SIZE_OPTIONS.includes(currentPageSize)) {
    return DEFAULT_PAGE_SIZE_OPTIONS;
  }

  return [...DEFAULT_PAGE_SIZE_OPTIONS, currentPageSize].sort((a, b) => a - b);
}

export function DataTablePagination<TData>({
  table,
  pagination,
  currentPage = 1,
  currentPageSize = 10,
  selectedCount,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  const totalPages = pagination?.total_pages || table.getPageCount();
  const resolvedSelectedCount =
    selectedCount ?? table.getFilteredSelectedRowModel().rows.length;

  const canPreviousPage = pagination
    ? currentPage > 1
    : table.getCanPreviousPage();
  const canNextPage = pagination
    ? currentPage < totalPages
    : table.getCanNextPage();

  const handlePageSizeChange = (value: string) => {
    const newSize = Number(value);

    queueMicrotask(() => {
      if (onPageSizeChange) {
        onPageSizeChange(newSize);
      } else {
        table.setPageSize(newSize);
      }
    });
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className={paginationSummaryClass}>
        {resolvedSelectedCount > 0 ? (
          <>
            <CheckSquare className="size-4 text-primary/70" />
            <span>
              Đã chọn{" "}
              <span className={cn(paginationCountClass)}>
                {resolvedSelectedCount}
              </span>{" "}
              mục
            </span>
          </>
        ) : pagination?.total != null ? (
          <>
            <FileText className="size-4 text-primary/60 dark:text-primary/70" />
            <span>
              Hiện có{" "}
              <span className={paginationCountClass}>{pagination.total}</span>{" "}
              tài liệu
            </span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            Hiển thị
          </Label>
          <Select
            value={`${currentPageSize}`}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger
              size="sm"
              className={cn("w-18", controlClass)}
              id="rows-per-page"
            >
              <SelectValue placeholder={currentPageSize} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {getPageSizeOptions(currentPageSize).map((size) => (
                <SelectItem key={size} value={`${size}`} className="rounded-lg">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="px-1 text-sm tabular-nums font-medium text-foreground">
          {currentPage}
          <span className="mx-1 text-muted-foreground/50">/</span>
          {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          className={`hidden lg:flex ${iconControlClass}`}
          onClick={handleFirstPage}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Về đầu</span>
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={iconControlClass}
          onClick={handlePreviousPage}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Trang trước</span>
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={iconControlClass}
          onClick={handleNextPage}
          disabled={!canNextPage}
        >
          <span className="sr-only">Trang sau</span>
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`hidden lg:flex ${iconControlClass}`}
          onClick={handleLastPage}
          disabled={!canNextPage}
        >
          <span className="sr-only">Về cuối</span>
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
