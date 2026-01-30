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
import { IconCreditCard } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import TicketForm from "./ticket-form-data";
import TicketExtendedForm from "./ticket-extended-form";
import type { Ticket } from "../utils/ticket-schema";

import { motion, AnimatePresence } from "framer-motion";

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
  const [selectedFlowId, setSelectedFlowId] = useState<string>("");
  const [selectedStepId, setSelectedStepId] = useState<string>("");
  const [originalFlowId, setOriginalFlowId] = useState<string>("");

  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!ticket;

  // Sync selectedFlowId with ticket.flow_id when in edit mode
  useEffect(() => {
    if (ticket?.flow_id) {
      setSelectedFlowId(ticket.flow_id);
      setOriginalFlowId(ticket.flow_id); // Store original flow ID for comparison
      setSelectedStepId(""); // Reset step ID so it can be fetched from instance
      // Auto-expand panel if ticket has flow_id
      setShowExtended(true);
    } else if (!ticket) {
      // Reset when creating new ticket
      setSelectedFlowId("");
      setSelectedStepId("");
      setOriginalFlowId("");
    }
  }, [ticket]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Only show trigger button when not controlled */}
      {!isControlled && (
        <SheetTrigger asChild>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="size-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Thêm mới
            </span>
          </Button>
        </SheetTrigger>
      )}
      <SheetContent
        onExpand={() => setShowExtended(!showExtended)}
        className={`w-[90vw] overflow-hidden rounded-l-2xl border-l transition-[max-width] duration-500 ease-in-out ${
          showExtended ? "sm:max-w-5xl" : "sm:max-w-xl"
        }`}
      >
        <div className="flex flex-col h-full gap-4">
          <SheetHeader className="pb-2 shrink-0">
            <SheetTitle className="text-xl flex items-center gap-2.5">
              <div className="p-1.5 rounded-md bg-primary/10">
                <IconCreditCard className="size-5 text-primary" />
              </div>
              {isEditMode ? "Chỉnh sửa Ticket" : "Tạo Ticket Mới"}
            </SheetTitle>
            <SheetDescription>
              {isEditMode
                ? "Cập nhật thông tin ticket. Nhấn lưu khi hoàn tất."
                : "Tạo ticket mới. Nhấn lưu khi hoàn tất."}
            </SheetDescription>
          </SheetHeader>

          <div className="h-px bg-border w-full" />

          <div className="flex flex-1 flex-row min-h-0 overflow-hidden">
            <AnimatePresence initial={false}>
              {showExtended && (
                <motion.div
                  key="extended-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-1/2 border-r pr-8 flex flex-col overflow-y-auto shrink-0"
                >
                  <div className="min-w-[440px] pt-1">
                    <TicketExtendedForm
                      ticket={ticket}
                      selectedFlowId={selectedFlowId}
                      selectedStepId={selectedStepId}
                      onFlowChange={setSelectedFlowId}
                      onStepChange={setSelectedStepId}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              className={`flex flex-col gap-4 h-full overflow-y-auto transition-all duration-500 ${
                showExtended ? "w-1/2 pl-8" : "w-full px-1"
              }`}
            >
              <div className="px-1">
                <TicketForm
                  ticket={ticket}
                  selectedFlowId={selectedFlowId}
                  selectedStepId={selectedStepId}
                  originalFlowId={originalFlowId}
                  onSuccess={() => {
                    setOpen(false);
                    // Reset flow/step selection
                    setSelectedFlowId("");
                    setSelectedStepId("");
                    setOriginalFlowId("");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
