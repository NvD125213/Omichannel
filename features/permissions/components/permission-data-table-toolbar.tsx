"use client";

import * as React from "react";
import { Check, PlusCircle, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FacetedFilterProps {
  title: string;
  options: FilterOption[];
  selectedValues: Set<string>;
  onSelect: (values: Set<string>) => void;
  onSearch?: (value: string) => void;
  singleSelect?: boolean; // If true, only one value can be selected at a time
}

export function FacetedFilter({
  title,
  options,
  selectedValues,
  onSelect,
  onSearch,
  singleSelect = false,
}: FacetedFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput placeholder={title} onValueChange={onSearch} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (singleSelect) {
                        // Single select mode: replace current selection or clear if same
                        const newSelected = isSelected
                          ? new Set<string>()
                          : new Set([option.value]);
                        onSelect(newSelected);
                      } else {
                        // Multi select mode: toggle selection
                        const newSelected = new Set(selectedValues);
                        if (isSelected) {
                          newSelected.delete(option.value);
                        } else {
                          newSelected.add(option.value);
                        }
                        onSelect(newSelected);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <Check className={cn("h-4 w-4")} />
                    </div>
                    {option.icon && (
                      <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onSelect(new Set())}
                    className="justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface TransactionsTableToolbarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  actionOptions: FilterOption[];
  roleOptions: FilterOption[];
  selectedActions: Set<string>;
  setSelectedActions: (values: Set<string>) => void;
  selectedRoles: Set<string>;
  setSelectedRoles: (values: Set<string>) => void;
  onRoleSearch?: (value: string) => void;
  onToggleAll: () => void;
  selectedCount: number;
  isAllSelected?: boolean;
  onSave?: () => void;
  isSaving?: boolean;
}

export function PermissionTableToolbar({
  searchTerm,
  setSearchTerm,
  actionOptions,
  roleOptions,
  selectedActions,
  setSelectedActions,
  selectedRoles,
  setSelectedRoles,
  onRoleSearch,
  onToggleAll,
  selectedCount,
  isAllSelected,
  onSave,
  isSaving = false,
}: TransactionsTableToolbarProps) {
  const isFiltered = selectedActions.size > 0 || searchTerm.length > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-1">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm tên quyền hạn..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>

        <FacetedFilter
          title="Vai trò"
          options={roleOptions}
          selectedValues={selectedRoles}
          onSelect={setSelectedRoles}
          onSearch={onRoleSearch}
          singleSelect={true}
        />

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("");
              setSelectedActions(new Set());
            }}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleAll}
          className="h-9 ml-auto sm:ml-0"
        >
          {selectedCount > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
        </Button>

        {selectedCount > 0 && (
          <Badge variant="secondary" className="h-7 px-2">
            {selectedCount}
          </Badge>
        )}

        <Button
          disabled={selectedCount === 0 || isSaving}
          size="sm"
          onClick={onSave}
        >
          {isSaving ? "Đang lưu..." : "Lưu"}
        </Button>
      </div>
    </div>
  );
}
