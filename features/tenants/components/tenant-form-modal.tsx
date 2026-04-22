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
import { removeEmptyFields } from "@/utils/remove-field-empty";
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
      });
    } else if (!tenant && open) {
      form.reset(tenantDefaultValues);
    }
  }, [tenant, open, form]);

  function onSubmit(data: TenantFormValues) {
    const payload = removeEmptyFields(data) as TenantFormValues;

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
            </div>

            {/* <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trạng thái</FormLabel>
                    <FormControl>
                      <Select
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        <SelectTrigger className="cursor-pointer">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Hoạt động</SelectItem>
                          <SelectItem value="0">Không hoạt động</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */}

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
