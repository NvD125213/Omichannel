"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ticketFlowDefaultValues,
  ticketFlowFormSchema,
  type TicketFlowFormValues,
} from "../utils/ticket-flow-schema";
import {
  useCreateTicketFlow,
  useUpdateTicketFlow,
} from "@/hooks/ticket/ticket-flows/use-ticket-flow";
import { useMe } from "@/hooks/user/use-me";
import type { TicketFlow } from "../utils/ticket-flow-schema";
import { removeEmptyFields } from "@/utils/remove-field-empty";
import { CreateFlowRequest } from "@/services/ticket/ticket-flows/ticket-flow/services";

interface TicketFlowFormDialogProps {
  ticketFlow?: TicketFlow | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TicketFlowFormDialog({
  ticketFlow,
  open: controlledOpen,
  onOpenChange,
}: TicketFlowFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!ticketFlow;

  const createTicketFlowMutation = useCreateTicketFlow();
  const updateTicketFlowMutation = useUpdateTicketFlow();

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser, isLoading: isLoadingUser } = useMe();

  const form = useForm<TicketFlowFormValues>({
    resolver: zodResolver(ticketFlowFormSchema),
    defaultValues: ticketFlowDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  // Populate form logic
  useEffect(() => {
    if (ticketFlow && open) {
      const formData = {
        id: ticketFlow.id,
        name: ticketFlow.name,
        description: ticketFlow.description,
        tenant_id: ticketFlow.tenant_id,
      };
      form.reset(formData);
    } else if (!ticketFlow && open) {
      // Reset về default values khi tạo mới
      form.reset({
        ...ticketFlowDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [ticketFlow, open, form, currentUser]);

  function onSubmit(values: TicketFlowFormValues) {
    const payload = removeEmptyFields(values);

    if (isEditMode) {
      if (!payload.id) return;

      const { id, ...data } = payload;

      updateTicketFlowMutation.mutate(
        {
          id,
          data: data as CreateFlowRequest,
        },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
          },
        },
      );
    } else {
      createTicketFlowMutation.mutate(payload as CreateFlowRequest, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Only show trigger button when not controlled */}
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            Thêm luồng mới
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa luồng ticket" : "Thêm luồng ticket"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin luồng ticket. Nhấn lưu khi hoàn tất."
              : "Tạo luồng ticket mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Tên vai trò */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên luồng ticket</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên luồng ticket" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Mô tả */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập mô tả" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={
                  isEditMode
                    ? updateTicketFlowMutation.isPending
                    : createTicketFlowMutation.isPending
                }
              >
                {isEditMode
                  ? updateTicketFlowMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật luồng ticket"
                  : createTicketFlowMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu luồng ticket"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
