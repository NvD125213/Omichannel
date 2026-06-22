"use client";

import { FileUp, Loader2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useDeleteDocument,
  useUploadDocument,
} from "@/hooks/chatbot-kg-core/use-chatbot-kg-core";
import type { KgDocument } from "@/services/chatbot-kg-core/interfaces";
import { cn } from "@/lib/utils";

export interface DocumentUploadResult {
  documentId: string;
  status: string;
  filename: string;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
  onUploaded?: (result: DocumentUploadResult) => void;
}

function resolveUploadResult(
  response: KgDocument & { document_id?: string },
  fallbackFilename: string,
): DocumentUploadResult {
  return {
    documentId: response.document_id ?? response.id,
    status: response.status ?? "queued",
    filename: response.filename ?? fallbackFilename,
  };
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  graphId,
  onUploaded,
}: DocumentUploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { mutateAsync: uploadDocument, isPending } = useUploadDocument();

  const resetForm = useCallback(() => {
    setSelectedFile(null);
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      resetForm();
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0] ?? null;
    handleFileSelect(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !graphId) return;

    try {
      const response = await uploadDocument({
        graphId,
        data: { file: selectedFile },
      });

      const result = resolveUploadResult(
        response as KgDocument & { document_id?: string },
        selectedFile.name,
      );

      toast.success("Đã tải lên tài liệu", {
        description: `${result.filename} đang được xử lý.`,
      });

      onUploaded?.(result);
      handleOpenChange(false);
    } catch {
      // Error toast handled by mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>Tải lên tài liệu</DialogTitle>
          <DialogDescription>
            Thêm tệp vào kho tài liệu để agent học từ nội dung mới.
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/35",
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileUp className="size-5" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Kéo thả tệp hoặc bấm để chọn
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, TXT và các định dạng văn bản khác
            </p>
          </div>

          {selectedFile && (
            <p className="max-w-full truncate rounded-lg bg-background px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border/60">
              {selectedFile.name}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFile || isPending}
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Tải lên
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DocumentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  graphId: string;
  document: KgDocument | null;
  onDeleted?: () => void;
}

export function DocumentDeleteDialog({
  open,
  onOpenChange,
  graphId,
  document,
  onDeleted,
}: DocumentDeleteDialogProps) {
  const { mutateAsync: deleteDocument, isPending } = useDeleteDocument();

  const handleConfirm = async () => {
    if (!document?.id || !graphId) return;

    await deleteDocument({
      graphId,
      documentId: document.id,
    });

    toast.success("Đã xóa tài liệu");
    onDeleted?.();
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xóa tài liệu này?"
      description={
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground/90">
            {document?.filename}
          </span>{" "}
          sẽ bị gỡ khỏi kho tài liệu. Thao tác này không hoàn tác được.
        </span>
      }
      confirmText="Xóa"
      cancelText="Giữ lại"
      loading={isPending}
      onConfirm={handleConfirm}
      confirmVariant="destructive"
    />
  );
}
