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
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ticketTagDefaultValues,
  ticketTagFormSchema,
  type TicketTagFormValues,
  type TicketTag,
} from "../utils/schema";
import { useCreateTag, useUpdateTag } from "@/hooks/tag/use-tag-ticket";
import { useMe } from "@/hooks/user/use-me";
import { removeEmptyFields } from "@/utils/remove-field-empty";

interface TagFormDialogProps {
  tag?: TicketTag | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TagFormDialog({
  tag,
  open: controlledOpen,
  onOpenChange,
}: TagFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!tag;

  const createTagMutation = useCreateTag();
  const updateTagMutation = useUpdateTag();

  const { data: currentUser } = useMe();

  const form = useForm<TicketTagFormValues>({
    resolver: zodResolver(ticketTagFormSchema),
    defaultValues: ticketTagDefaultValues,
  });

  useEffect(() => {
    if (tag && open) {
      form.reset({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        tenant_id: tag.tenant_id,
        color: tag.color,
      });
    } else if (!tag && open) {
      form.reset({
        ...ticketTagDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [tag, open, form, currentUser]);

  function onSubmit(data: TicketTagFormValues) {
    const payload = removeEmptyFields(data);

    if (isEditMode && tag?.id) {
      updateTagMutation.mutate(
        { id: tag.id, payload: payload as TicketTagFormValues },
        {
          onSuccess: () => {
            form.reset();
            setOpen(false);
          },
        },
      );
    } else {
      createTagMutation.mutate(payload as TicketTagFormValues, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="size-4" />
            Thêm Tag
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Sửa Tag" : "Thêm Tag"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin tag. Nhấn lưu khi hoàn tất."
              : "Tạo tag mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Tag</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên tag" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Màu sắc</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="h-10 w-20 p-1 cursor-pointer"
                          {...field}
                          value={field.value || "#000000"}
                        />
                        <Input
                          placeholder="#000000"
                          {...field}
                          value={field.value || "#000000"}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    ? updateTagMutation.isPending
                    : createTagMutation.isPending
                }
              >
                {isEditMode
                  ? updateTagMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật Tag"
                  : createTagMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu Tag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
