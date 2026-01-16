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
  departmentDefaultValues,
  departmentFormSchema,
  DepartmentFormValues,
} from "../utils/schema";
import {
  useCreateDepartment,
  useUpdateDepartment,
} from "@/hooks/department/use-action-department";
import { useMe } from "@/hooks/user/use-me";
import type { Department } from "../utils/schema";
import { removeEmptyFields } from "@/utils/remove-field-empty";

interface DepartmentFormDialogProps {
  department?: Department | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function DepartmentFormDialog({
  department,
  open: controlledOpen,
  onOpenChange,
}: DepartmentFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!department;

  const createRoleMutation = useCreateDepartment();
  const updateRoleMutation = useUpdateDepartment();

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser, isLoading: isLoadingUser } = useMe();

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: departmentDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  // Populate form logic
  useEffect(() => {
    if (department && open) {
      const formData = {
        id: department.id,
        name: department.name,
        description: department.description,
        tenant_id: department.tenant_id,
        is_active: department.is_active,
      };
      form.reset(formData);
    } else if (!department && open) {
      // Reset về default values khi tạo mới
      form.reset({
        ...departmentDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [department, open, form, currentUser]);

  function onSubmit(data: DepartmentFormValues) {
    const payload = removeEmptyFields(data);

    if (isEditMode) {
      updateRoleMutation.mutate(payload as DepartmentFormValues, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    } else {
      createRoleMutation.mutate(payload as DepartmentFormValues, {
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
            Thêm phòng ban
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa phòng ban" : "Thêm phòng ban"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin phòng ban. Nhấn lưu khi hoàn tất."
              : "Tạo phòng ban mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Tên phòng ban */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên phòng ban</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên phòng ban" {...field} />
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
                    : "Cập nhật phòng ban"
                  : createRoleMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu phòng ban"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
