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
  roleDefaultValues,
  roleFormSchema,
  type RoleFormValues,
} from "../utils/schema";
import { useCreateRole, useUpdateRole } from "@/hooks/role/use-action-role";
import { useMe } from "@/hooks/user/use-me";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import type { Role } from "../utils/schema";
import { removeEmptyFields } from "@/utils/remove-field-empty";

interface RoleFormDialogProps {
  role?: Role | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RoleFormDialog({
  role,
  open: controlledOpen,
  onOpenChange,
}: RoleFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!role;

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const { data: currentUser } = useMe();
  const isPlatformAdmin = currentUser?.is_platform_admin === true;

  const { data: tenantsData, isLoading: isLoadingTenants } = useGetTenants(
    { page: 1, page_size: 100, is_active: 1 },
    { enabled: open && isPlatformAdmin },
  );

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: roleDefaultValues,
  });

  useEffect(() => {
    if (!open) return;

    if (role) {
      form.reset({
        id: role.id,
        name: role.name,
        description: role.description,
        role_order: role.role_order,
        tenant_id: role.tenant_id,
        is_active: role.is_active,
      });
      return;
    }

    form.reset({
      ...roleDefaultValues,
      tenant_id: isPlatformAdmin ? "" : currentUser?.tenant_id || "",
    });
  }, [role, open, form, currentUser, isPlatformAdmin]);

  function onSubmit(data: RoleFormValues) {
    const payload = removeEmptyFields(data);

    if (isEditMode) {
      updateRoleMutation.mutate(payload as RoleFormValues, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    } else {
      createRoleMutation.mutate(payload as RoleFormValues, {
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
            Thêm vai trò
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa vai trò" : "Thêm vai trò"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin vai trò. Nhấn lưu khi hoàn tất."
              : "Tạo vai trò mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {isPlatformAdmin ? (
                <FormField
                  control={form.control}
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doanh nghiệp</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingTenants}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue
                              placeholder={
                                isLoadingTenants
                                  ? "Đang tải danh sách doanh nghiệp..."
                                  : "Chọn doanh nghiệp"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tenantsData?.items?.map((tenant) => (
                            <SelectItem key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              {/* Tên vai trò */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên vai trò</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên vai trò" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Thứ tự vai trò */}
              <FormField
                control={form.control}
                name="role_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thứ tự</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Nhập thứ tự hiển thị"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                          )
                        }
                      />
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
                    ? updateRoleMutation.isPending
                    : createRoleMutation.isPending
                }
              >
                {isEditMode
                  ? updateRoleMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật vai trò"
                  : createRoleMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu vai trò"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
