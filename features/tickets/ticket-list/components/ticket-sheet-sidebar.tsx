"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import TicketForm from "./ticket-form-data";
import type { Ticket } from "../utils/ticket-schema";

interface TicketCreateSheetProps {
  ticket?: Ticket | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketCreateSheet({
  ticket,
  open: controlledOpen,
  onOpenChange,
}: TicketCreateSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!ticket;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Only show trigger button when not controlled */}
      {!isControlled && (
        <SheetTrigger asChild>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Thêm mới
            </span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto rounded-l-2xl border-l">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-xl">
            {isEditMode ? "Chỉnh sửa Ticket" : "Tạo Ticket Mới"}
          </SheetTitle>
          <SheetDescription>
            {isEditMode
              ? "Cập nhật thông tin ticket. Nhấn lưu khi hoàn tất."
              : "Tạo ticket mới. Nhấn lưu khi hoàn tất."}
          </SheetDescription>
        </SheetHeader>
        <div className="px-1">
          <TicketForm ticket={ticket} onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
