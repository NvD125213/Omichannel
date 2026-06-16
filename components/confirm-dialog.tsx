"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Yes, Delete",
  cancelText = "No, Cancel",
  confirmVariant = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-border bg-background px-10 py-8">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-center text-2xl font-bold text-foreground">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-center text-sm font-medium text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {confirmVariant === "destructive" && (
          <div className="flex gap-3 rounded-md border border-destructive/25 border-l-4 border-l-destructive bg-destructive/10 p-4 dark:border-destructive/40 dark:bg-destructive/15">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">Cảnh báo</p>
              <p className="text-sm text-destructive/90">
                Hành động này không thể hoàn tác sau khi thực hiện.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-8"
          >
            <X className="mr-2 h-4 w-4" />
            {cancelText}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            variant={confirmVariant === "destructive" ? "destructive" : "default"}
            disabled={loading}
            className={cn("px-8", confirmVariant === "default" && "min-w-[8rem]")}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
