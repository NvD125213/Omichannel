"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import {
  useCreateCustomerProvidedInfo,
  useUpdateCustomerProvidedInfo,
} from "@/hooks/customer/leads/use-leads-customer";
import type { CustomerProvidedInfo } from "@/services/customer/leads/service";
import {
  leadDefaultValues,
  leadFormSchema,
  type LeadFormValues,
} from "@/features/customers/utils/leads-schema";

interface LeadsFormDialogProps {
  lead?: CustomerProvidedInfo | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LeadsFormDialog({
  lead,
  open: controlledOpen,
  onOpenChange,
}: LeadsFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!lead;
  const { user } = useAuth();
  const createMutation = useCreateCustomerProvidedInfo();
  const updateMutation = useUpdateCustomerProvidedInfo();

  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: leadDefaultValues,
  });

  useEffect(() => {
    if (lead && open) {
      form.reset({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        description: lead.description ?? "",
        tenant_id: lead.tenant_id,
      });
      return;
    }

    if (!lead && open) {
      form.reset({
        ...leadDefaultValues,
        tenant_id: user?.tenant_id ?? "",
      });
    }
  }, [lead, open, form, user?.tenant_id]);

  const onSubmit = async (data: LeadFormValues) => {
    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      description: data.description ?? "",
      tenant_id: data.tenant_id,
    };

    if (isEditMode && data.id) {
      await updateMutation.mutateAsync({ id: data.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setOpen(false);
    form.reset({
      ...leadDefaultValues,
      tenant_id: user?.tenant_id ?? "",
    });
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled ? (
        <DialogTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="mr-2 size-4" />
            Thêm mới
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? "Cập nhật khách hàng tiềm năng"
              : "Thêm khách hàng tiềm năng"}
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin khách hàng cung cấp qua form hoặc kênh tiếp nhận.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Họ tên</FormLabel>
                  <FormControl>
                    <Input placeholder="Nguyễn Văn A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="0901234567" {...field} />
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
                    <Textarea
                      placeholder="Nhu cầu, ghi chú thêm..."
                      className="min-h-24 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 size-4" />
                    {isEditMode ? "Cập nhật" : "Tạo mới"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
