"use client";

import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import debounce from "lodash/debounce";
import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";
import { CustomerFormDialog } from "./customer-data-form";

interface CustomerDataTableToolbarProps<TData> {
  table: Table<TData>;
  search?: string | null;
  onSearchChange?: (value: string | null | undefined) => void;
  title?: string;
  description?: string;
}

export function CustomerDataToolbar<TData>({
  table,
  search = "",
  onSearchChange,
  title = "Danh sách khách hàng",
  description,
}: CustomerDataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  // Gửi giá trị search lên cha với debounce giống toolbar người dùng
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string | null) => {
        onSearchChange?.(value || undefined);
      }, 500),
    [onSearchChange],
  );

  useEffect(() => {
    debouncedSearch(search ?? "");
  }, [search, debouncedSearch]);

  return (
    <div className="space-y-4">
      {/* Title Section */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <CustomerFormDialog />
        </div>
      </div>

      {/* Filters Section */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 cursor-pointer px-3"
          >
            Reset
            <X className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
