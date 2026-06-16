"use client";

import { useEffect, useState } from "react";
import { Filter, Loader2, PencilLine, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateAccountCustomFilter,
  useUpdateAccountCustomFilter,
} from "@/hooks/chatwoot/use-chatwoot";
import {
  buildAccountCustomFilterRequest,
  type ChatConversationFilterDraft,
} from "../utils/conversation-filter";
import { ChatConversationFilterPreview } from "./chat-conversation-filter-preview";

export type ChatFilterCustomDialogMode = "create" | "update";

interface ChatFilterCustomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  mode: ChatFilterCustomDialogMode;
  filterId?: number;
  initialName?: string;
  filterType?: string | number;
  filterDraft: ChatConversationFilterDraft;
}

export function ChatFilterCustomDialog({
  open,
  onOpenChange,
  tenantId,
  mode,
  filterId,
  initialName = "",
  filterType,
  filterDraft,
}: ChatFilterCustomDialogProps) {
  const [name, setName] = useState(initialName);
  const [nameError, setNameError] = useState("");

  const { mutate: createFilter, isPending: isCreating } =
    useCreateAccountCustomFilter();
  const { mutate: updateFilter, isPending: isUpdating } =
    useUpdateAccountCustomFilter();

  const isSubmitting = isCreating || isUpdating;
  const isUpdateMode = mode === "update";
  const DialogModeIcon = isUpdateMode ? PencilLine : Filter;

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setNameError("");
  }, [open, initialName]);

  const handleClose = () => {
    if (isSubmitting) return;
    onOpenChange(false);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Vui lòng nhập tên bộ lọc");
      return;
    }

    const requestData = buildAccountCustomFilterRequest(
      trimmedName,
      filterDraft,
      filterType,
    );

    if (!requestData) {
      setNameError("Bộ lọc hiện tại không có điều kiện hợp lệ để lưu");
      return;
    }

    if (!tenantId) return;

    if (isUpdateMode) {
      if (filterId === undefined) {
        setNameError("Không xác định được bộ lọc cần cập nhật");
        return;
      }

      updateFilter(
        {
          tenantId,
          filterId,
          data: requestData,
        },
        {
          onSuccess: (res) => {
            if (res.status_code === 200) {
              onOpenChange(false);
            }
          },
        },
      );
      return;
    }

    createFilter(
      {
        tenantId,
        data: requestData,
      },
      {
        onSuccess: (res) => {
          if (res.status_code === 200 || res.status_code === 201) {
            onOpenChange(false);
          }
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b bg-muted/30 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  isUpdateMode ? "bg-amber-500/10" : "bg-primary/10",
                )}
              >
                <DialogModeIcon
                  className={cn(
                    "h-5 w-5",
                    isUpdateMode ? "text-amber-600" : "text-primary",
                  )}
                />
              </div>

              <div>
                <DialogTitle className="text-lg">
                  {isUpdateMode ? "Cập nhật bộ lọc" : "Lưu bộ lọc"}
                </DialogTitle>

                <DialogDescription className="mt-1">
                  {isUpdateMode
                    ? "Chỉnh sửa tên và điều kiện của bộ lọc."
                    : "Lưu bộ lọc để sử dụng lại nhanh chóng."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-xl border bg-muted/30 p-4">
              <Label
                htmlFor="custom-filter-name"
                className="mb-2 block text-sm font-medium"
              >
                Tên bộ lọc
              </Label>

              <Input
                id="custom-filter-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (nameError) setNameError("");
                }}
                placeholder="Ví dụ: Hội thoại đã giải quyết"
                disabled={isSubmitting}
                autoFocus
              />

              {nameError && (
                <p className="mt-2 text-sm text-destructive">{nameError}</p>
              )}
            </div>

            <div className="rounded-xl border border-dashed p-4">
              <div className="text-sm font-medium">Điều kiện đã chọn</div>
              <div className="mt-3">
                <ChatConversationFilterPreview
                  tenantId={tenantId}
                  filterDraft={filterDraft}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Hủy
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isUpdateMode ? "Cập nhật" : "Lưu bộ lọc"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
