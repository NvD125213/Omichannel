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

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser, isLoading: isLoadingUser } = useMe();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: roleDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  // Populate form logic
  useEffect(() => {
    if (role && open) {
      const formData = {
        id: role.id,
        name: role.name,
        description: role.description,
        role_order: role.role_order,
        tenant_id: role.tenant_id,
        is_active: role.is_active,
      };
      form.reset(formData);
    } else if (!role && open) {
      // Reset về default values khi tạo mới
      form.reset({
        ...roleDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [role, open, form, currentUser]);

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
