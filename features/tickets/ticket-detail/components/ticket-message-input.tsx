import { Send, X, Plus } from "lucide-react";
import { useState, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DataTablePagination } from "./ticket-context-pagination";
import type { Table } from "@tanstack/react-table";

export interface TicketContextFormData {
  context_type: string;
  source_type: string;
  context_id: string;
  context_metadata: Record<string, string>;
  tenant_id: string;
}

interface TicketCreateFormProps {
  onSubmit: (data: TicketContextFormData) => void;
  disabled?: boolean;
  tenantId?: string;
  // Pagination props
  table: Table<any>;
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

interface MetadataTag {
  key: string;
  value: string;
}

export default function TicketMessageInput({
  onSubmit,
  disabled = false,
  tenantId = "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  table,
  pagination,
  currentPage,
  currentPageSize,
  onPageChange,
  onPageSizeChange,
}: TicketCreateFormProps) {
  const [metadataTags, setMetadataTags] = useState<MetadataTag[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [contextType, setContextType] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [contextId, setContextId] = useState("");
  const [metadataError, setMetadataError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setMetadataError("");
  };

  const addTag = () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;

    const colonIndex = trimmedInput.indexOf(":");
    if (colonIndex === -1) {
      setMetadataError("Định dạng phải là 'Key: Value'");
      return;
    }

    const key = trimmedInput.substring(0, colonIndex).trim();
    const value = trimmedInput.substring(colonIndex + 1).trim();

    if (!key || !value) {
      setMetadataError("Key và Value không được để trống");
      return;
    }

    setMetadataTags([...metadataTags, { key, value }]);
    setInputValue("");
    setMetadataError("");
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    const newTags = [...metadataTags];
    newTags.splice(index, 1);
    setMetadataTags(newTags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (
      e.key === "Backspace" &&
      !inputValue &&
      metadataTags.length > 0
    ) {
      removeTag(metadataTags.length - 1);
    }
  };

  const handleSubmit = () => {
    if (!contextType || !sourceType) {
      setMetadataError("Vui lòng chọn Context Type và Source Type");
      return;
    }

    const metadata: Record<string, string> = {};
    metadataTags.forEach((tag) => {
      metadata[tag.key] = tag.value;
    });

    if (inputValue.trim()) {
      if (inputValue.includes(":")) {
        setMetadataError("Vui lòng nhấn Enter để thêm metadata đang nhập dở");
        return;
      }
    }

    const formData: TicketContextFormData = {
      context_type: contextType,
      source_type: sourceType,
      context_id: contextId,
      context_metadata: metadata,
      tenant_id: tenantId,
    };

    onSubmit(formData);

    setMetadataTags([]);
    setInputValue("");
    setContextType("");
    setSourceType("");
    setContextId("");
    setMetadataError("");
  };

  return (
    <div className="border-t p-4 bg-white w-full">
      <div className="flex flex-col gap-3">
        {/* Pagination Row */}

        {/* Row 1: Metadata Input */}
        <div
          className={cn(
            "flex flex-wrap items-start gap-2 w-full min-h-[42px]",
            "rounded-md border px-3 py-2 text-sm",
            "focus-within:ring-2 focus-within:ring-ring",
            metadataError && "border-red-500",
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {metadataTags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="gap-1 pr-1">
              {tag.key}: {tag.value}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="ml-1 rounded-full p-0.5 hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-hidden placeholder:text-muted-foreground min-w-[200px]"
            placeholder={
              metadataTags.length === 0
                ? "Nhập metadata (Nhập dạng key:value) rồi Enter. Ví dụ 'Nguồn: Việt nam'"
                : "Nhập thêm..."
            }
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
          {inputValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                addTag();
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>

        {metadataError && (
          <p className="text-xs text-red-500 font-medium">{metadataError}</p>
        )}

        {/* Row 2: Controls */}
        <div className="flex items-center justify-between gap-2 whitespace-nowrap">
          {/* Pagination */}
          <div className="shrink-0">
            <DataTablePagination
              table={table}
              pagination={pagination}
              currentPage={currentPage}
              currentPageSize={currentPageSize}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Context type */}
            <Select
              value={contextType}
              onValueChange={setContextType}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-auto shrink-0 flex items-center gap-1">
                <span className="text-xs text-gray-400">Bối cảnh:</span>
                <SelectValue placeholder="Chọn bối cảnh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversation">Conversation</SelectItem>
                <SelectItem value="order">Order</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="support">Support</SelectItem>
              </SelectContent>
            </Select>

            {/* Context ID */}
            <Select
              value={contextId}
              onValueChange={setContextId}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-auto shrink-0 flex items-center gap-1">
                <span className="text-xs text-gray-400">Mã bối cảnh:</span>
                <SelectValue placeholder="Chọn ID" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ctx-001">Context 001</SelectItem>
                <SelectItem value="ctx-002">Context 002</SelectItem>
                <SelectItem value="ctx-003">Context 003</SelectItem>
              </SelectContent>
            </Select>

            {/* Source */}
            <Select
              value={sourceType}
              onValueChange={setSourceType}
              disabled={disabled}
            >
              <SelectTrigger className="h-9 w-auto shrink-0 flex items-center gap-1">
                <span className="text-xs text-gray-400">Nguồn:</span>
                <SelectValue placeholder="Chọn nguồn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facebook">Hệ thống trượt</SelectItem>
                <SelectItem value="zalo">ZNS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="website">Website</SelectItem>
              </SelectContent>
            </Select>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={disabled || !contextType || !sourceType}
              className="h-9 shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
