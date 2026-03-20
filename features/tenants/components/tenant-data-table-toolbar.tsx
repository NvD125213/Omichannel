"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import debounce from "lodash/debounce";
import { Button } from "@/components/ui/button";
import type { Table } from "@tanstack/react-table";
import { TenantFormDialog } from "./tenant-form-modal";

interface TenantTableToolbarProps<TData> {
  table: Table<TData>;
  search?: string | null;
  onSearchChange?: (value: string | null | undefined) => void;
  title?: string;
  description?: string;
}

export function TenantTableToolbar<TData>({
  table,
  search = "",
  onSearchChange,
  title = "Danh sách doanh nghiệp",
  description,
}: TenantTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  const [localSearch, setLocalSearch] = useState(search ?? "");

  useEffect(() => {
    setLocalSearch(search ?? "");
  }, [search]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        onSearchChange?.(value || undefined);
      }, 500),
    [onSearchChange],
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <TenantFormDialog />
        </div>
      </div>

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

