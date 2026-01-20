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
import { PlusCircle, Expand } from "lucide-react";
import { useState } from "react";
import TicketForm from "./ticket-form-data";
import TicketExtendedForm from "./ticket-extended-form";
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
  const [showExtended, setShowExtended] = useState(false);
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
      <SheetContent
        className={`w-[90vw] overflow-y-auto rounded-l-2xl border-l transition-[max-width] duration-300 ease-in-out ${
          showExtended ? "sm:max-w-[1200px]" : "sm:max-w-xl"
        }`}
      >
        <div className="flex h-full flex-row gap-6">
          {showExtended && (
            <div className="flex-1 border-r pr-6 pt-1 animate-in slide-in-from-left-5 fade-in duration-300">
              <TicketExtendedForm />
            </div>
          )}
          <div className="flex shrink-0 flex-col gap-4 w-full sm:w-[520px]">
            <SheetHeader className="pb-2">
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
