"use client";

import { Download, PlusCircle, Search, Settings2, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import debounce from "lodash/debounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { Table } from "@tanstack/react-table";
import { TagFormDialog } from "./ticket-tag-form-data";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  search?: string | null;
  onSearchChange?: (value: string | null | undefined) => void;
}

interface FilterOption {
  label: string;
  value: string;
}

interface FacetedFilterProps<TData> {
  table: Table<TData>;
  columnId: string;
  title: string;
  options: FilterOption[];
}

const columnLabels: Record<string, string> = {
  name: "Tên Tag",
  description: "Mô tả",
  color: "Màu sắc",
};

export function DataTableToolbar<TData>({
  table,
  search = "",
  onSearchChange,
}: DataTableToolbarProps<TData>) {
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm Tag..."
            value={localSearch}
            onChange={(event) => {
              const value = event.target.value;
              setLocalSearch(value);
              debouncedSearch(value);
            }}
            className="h-8 w-[200px] pl-8 lg:w-[280px]"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 cursor-pointer px-3"
          >
            Reset
            <X className="ml-1 size-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <TagFormDialog />
      </div>
    </div>
  );
}
