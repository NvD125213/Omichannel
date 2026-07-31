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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  tenantDefaultValues,
  tenantFormSchema,
  type TenantFormValues,
  type Tenant,
} from "../utils/schema";
import {
  useCreateTenant,
  useUpdateTenant,
} from "@/hooks/tenant/use-get-tenant";

interface TenantFormDialogProps {
  tenant?: Tenant | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TenantFormDialog({
  tenant,
  open: controlledOpen,
  onOpenChange,
}: TenantFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!tenant;

  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: tenantDefaultValues,
  });

  useEffect(() => {
    if (tenant && open) {
      form.reset({
        id: tenant.id,
        name: tenant.name,
        description: tenant.description ?? "",
        is_active: tenant.is_active,
        chatbot_enabled: tenant.meta?.chatbot_enabled ?? true,
        default_responder: tenant.meta?.default_responder ?? "bot",
      });
    } else if (!tenant && open) {
      form.reset(tenantDefaultValues);
    }
  }, [tenant, open, form]);

  function onSubmit(data: TenantFormValues) {
    const description = data.description?.trim();
    const payload = {
      name: data.name.trim(),
      ...(description ? { description } : {}),
      is_active: data.is_active,
      meta: {
        chatbot_enabled: Boolean(data.chatbot_enabled),
        default_responder: data.default_responder,
      },
    };

    if (isEditMode && tenant?.id) {
      updateTenantMutation.mutate(
        { id: tenant.id, data: payload },
        {
          onSuccess: () => {
            form.reset(tenantDefaultValues);
            setOpen(false);
          },
        },
      );
    } else {
      createTenantMutation.mutate(payload, {
        onSuccess: () => {
          form.reset(tenantDefaultValues);
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
            Thêm doanh nghiệp
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa doanh nghiệp" : "Thêm doanh nghiệp"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin doanh nghiệp. Nhấn lưu khi hoàn tất."
              : "Tạo doanh nghiệp mới. Nhấn lưu khi hoàn tất."}
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
                    <FormLabel>Tên doanh nghiệp</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên doanh nghiệp" {...field} />
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
              <FormField
                control={form.control}
                name="default_responder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Người phản hồi mặc định</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Chọn người phản hồi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bot">Bot</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="chatbot_enabled"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-border/80 bg-muted/15 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                        field.value
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border/70 bg-background text-muted-foreground",
                      )}
                    >
                      <Bot className="size-4" />
                    </div>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <FormLabel className="text-sm font-semibold leading-none">
                          Kích hoạt chatbot
                        </FormLabel>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 border px-1.5 text-[10px] font-medium",
                            field.value
                              ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-border bg-background text-muted-foreground",
                          )}
                        >
                          {field.value ? "Đang bật" : "Đã tắt"}
                        </Badge>
                      </div>
                      <FormDescription className="text-xs leading-relaxed">
                        Bật hoặc tắt chatbot cho doanh nghiệp này.
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 shrink-0"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={
                  isEditMode
                    ? updateTenantMutation.isPending
                    : createTenantMutation.isPending
                }
              >
                {isEditMode
                  ? updateTenantMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật doanh nghiệp"
                  : createTenantMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu doanh nghiệp"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
