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
import clsx from "clsx";

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
      <DialogContent className="max-w-xl rounded-2xl px-10 py-8">
        {/* Header */}
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold text-center">
            {title}
          </DialogTitle>

          {description && (
            <DialogDescription className="text-sm font-medium text-muted-foreground text-center">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Warning box */}
        {confirmVariant === "destructive" && (
          <div className="flex gap-3 rounded-md border-l-4 border-red-500 bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-700">Cảnh báo</p>
              <p className="text-sm text-red-700">
                Hành động này không thể hoàn tác sau khi thực hiện.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="mt-2 flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
          {/* Cancel */}
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

          {/* Confirm */}
          <Button
            type="button"
            onClick={onConfirm}
            variant="destructive"
            disabled={loading}
            className={clsx(
              "px-8",
              confirmVariant === "default"
                ? "border-border bg-primary text-primary-foreground"
                : "bg-red-600 text-white hover:bg-red-700",
            )}
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
