"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
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
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Sketch } from "@uiw/react-color";
import {
  useCreateTenantLabel,
  useDeleteTenantLabel,
} from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import {
  addLabelDefaultValues,
  addLabelFormSchema,
  type AddLabelFormValues,
} from "../utils/schema";

export type LabelItemPayload = {
  id?: string;
  title: string;
  description?: string;
  color?: string;
  show_on_sidebar?: boolean;
};

interface AddLabelDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editLabel?: LabelItemPayload | null;
}

export function AddLabelDialog({
  open: controlledOpen,
  onOpenChange,
  editLabel = null,
}: AddLabelDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const form = useForm<AddLabelFormValues>({
    resolver: zodResolver(addLabelFormSchema),
    defaultValues: addLabelDefaultValues,
    mode: "onChange",
  });

  const createLabelMutation = useCreateTenantLabel();
  const deleteLabelMutation = useDeleteTenantLabel();
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";
  const isEditMode = Boolean(editLabel?.title);

  useEffect(() => {
    if (!open) return;
    if (isEditMode && editLabel) {
      form.reset({
        title: editLabel.title,
        description: editLabel.description ?? "",
        color: editLabel.color ?? "#1D4ED8",
        show_on_sidebar: editLabel.show_on_sidebar ?? true,
      });
      return;
    }
    form.reset(addLabelDefaultValues);
  }, [open, form, isEditMode, editLabel]);

  function handleSubmit(values: AddLabelFormValues) {
    if (!tenantId) return;

    const payload = {
      label: values.title.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      color: values.color,
      show_on_sidebar: values.show_on_sidebar,
    };

    const createNew = () => {
      createLabelMutation.mutate(
        {
          tenantId,
          data: payload,
        },
        {
          onSuccess: () => {
            form.reset(addLabelDefaultValues);
            setOpen(false);
          },
        },
      );
    };

    // API label hiện chưa có endpoint update riêng -> đổi tên bằng delete + create.
    if (isEditMode && editLabel?.title && editLabel.title !== values.title.trim()) {
      deleteLabelMutation.mutate(
        {
          tenantId,
          label: editLabel.title,
        },
        {
          onSuccess: createNew,
        },
      );
      return;
    }

    createNew();
  }

  const isSubmitting =
    createLabelMutation.isPending || deleteLabelMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button type="button">Thêm label</Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="gap-6 rounded-xl sm:max-w-lg" showCloseButton>
        <DialogHeader className="gap-2 space-y-0">
          <DialogTitle>
            {isEditMode ? "Cập nhật label" : "Thêm label mới"}
          </DialogTitle>
          <DialogDescription>
            Thiết lập nhãn để phân loại ticket và hiển thị theo màu.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên label</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên label" {...field} />
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
                    <Input placeholder="Nhập mô tả ngắn" {...field} />
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
                    <div className="w-full">
                      <Sketch
                        color={field.value}
                        onChange={(color) => field.onChange(color.hex)}
                        style={{ width: "100%", boxShadow: "none" }}
                        disableAlpha
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="show_on_sidebar"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Hiển thị ở sidebar</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-2 sm:justify-end">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Hủy
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!tenantId || isSubmitting || !form.formState.isValid}
              >
                {isSubmitting
                  ? isEditMode
                    ? "Đang cập nhật..."
                    : "Đang thêm..."
                  : isEditMode
                    ? "Cập nhật"
                    : "Thêm label"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
