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
  groupDefaultValues,
  groupFormSchema,
  type GroupFormValues,
} from "../utils/schema";
import { useCreateGroup, useUpdateGroup } from "@/hooks/group/use-action-group";
import { useMe } from "@/hooks/user/use-me";
import type { Group } from "../utils/schema";
import { removeEmptyFields } from "@/utils/remove-field-empty";

interface GroupFormDialogProps {
  group?: Group | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  departmentId?: string;
}

export function GroupFormDialog({
  group,
  open: controlledOpen,
  onOpenChange,
  departmentId,
}: GroupFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!group;

  const createGroupMutation = useCreateGroup();
  const updateGroupMutation = useUpdateGroup();

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser, isLoading: isLoadingUser } = useMe();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: groupDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  useEffect(() => {
    if (group && open) {
      const formData = {
        id: group.id,
        name: group.name,
        description: group.description,
        tenant_id: group.tenant_id,
        is_active: group.is_active,
        department_id: group.department_id,
      };
      form.reset(formData);
    } else if (!group && open) {
      // Reset về default values khi tạo mới
      form.reset({
        ...groupDefaultValues,
        department_id: departmentId || "",
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [group, open, form, currentUser, departmentId]);

  function onSubmit(data: GroupFormValues) {
    let payload = removeEmptyFields(data);

    if (isEditMode && group) {
      payload = { ...payload, id: group.id };
      updateGroupMutation.mutate(payload as GroupFormValues, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    } else {
      createGroupMutation.mutate(payload as GroupFormValues, {
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
            Thêm nhóm
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Sửa nhóm" : "Thêm nhóm"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin nhóm. Nhấn lưu khi hoàn tất."
              : "Tạo nhóm mới. Nhấn lưu khi hoàn tất."}
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
                    <FormLabel>Tên nhóm</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên nhóm" {...field} />
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
                    ? updateGroupMutation.isPending
                    : createGroupMutation.isPending
                }
              >
                {isEditMode
                  ? updateGroupMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật nhóm"
                  : createGroupMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu nhóm"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
