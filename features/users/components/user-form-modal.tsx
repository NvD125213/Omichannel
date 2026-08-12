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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  userDefaultValues,
  userFormSchema,
  type UserFormValues,
} from "../utils/schema";
import { useCreateUser, useUpdateUser } from "@/hooks/user/use-action-user";
import { useGetRoles } from "@/hooks/role/use-get-role";
import { useGetLevels } from "@/hooks/level/use-get-level";
import { useMe } from "@/hooks/user/use-me";
import type { User } from "../utils/schema";
import { removeEmptyFields } from "@/utils/remove-field-empty";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import { PERMISSIONS } from "@/constants/permission";

interface UserFormDialogProps {
  user?: User | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UserFormDialog({
  user,
  open: controlledOpen,
  onOpenChange,
}: UserFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled =
    controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const isEditMode = !!user;

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  // Fetch roles từ API
  const { data: rolesData, isLoading: isLoadingRoles } = useGetRoles({});

  // Fetch levels từ API
  const { data: levelsData, isLoading: isLoadingLevels } = useGetLevels({});

  // Lấy thông tin user hiện tại để get tenant_id
  const { data: currentUser } = useMe();
  const canGetTenants =
    currentUser?.permissions?.includes(PERMISSIONS.VIEW_TENANTS) ||
    currentUser?.permissions?.includes("get_tenants");

  const tenantsQueryParams = useMemo(
    () => ({
      page: 1,
      page_size: 100,
      is_active: 1,
    }),
    [],
  );

  const { data: tenantsData, isLoading: isLoadingTenants } = useGetTenants(
    tenantsQueryParams,
    { enabled: open && Boolean(canGetTenants) },
  );

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: userDefaultValues,
  });

  // Auto-populate tenant_id từ current user
  useEffect(() => {
    if (currentUser?.tenant_id && !isEditMode && !form.getValues("tenant_id")) {
      form.setValue("tenant_id", currentUser.tenant_id);
    }
  }, [currentUser, form, isEditMode]);

  // Populate form khi edit mode
  useEffect(() => {
    if (user && open && rolesData && levelsData) {
      // Map role name to role_id if role_id doesn't exist
      let roleId = user.role_id || "";
      if (!roleId && user.role) {
        const roleObj = rolesData.roles?.find(
          (r) => r.name.toLowerCase() === user.role.toLowerCase(),
        );
        roleId = roleObj?.id || "";
      }

      // Map level name to level_id if level_id doesn't exist
      let levelId = user.level_id || "";
      if (!levelId && user.level) {
        const levelObj = levelsData.levels?.find(
          (l) => l.name.toLowerCase() === user.level.toLowerCase(),
        );
        levelId = levelObj?.id || "";
      }

      const formData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role_id: roleId,
        level_id: levelId,
        tenant_id: user.tenant_id,
        is_active: user.is_active,
        webphone_enabled: user.webphone_enabled ?? false,
        password: "", // Password không được populate khi edit
      };
      form.reset(formData);
    } else if (!user && open) {
      // Reset về default values khi tạo mới
      form.reset({
        ...userDefaultValues,
        tenant_id: currentUser?.tenant_id || "",
      });
    }
  }, [user, open, form, currentUser, rolesData, levelsData]);

  function onSubmit(data: UserFormValues) {
    const payload = removeEmptyFields(data);

    if (isEditMode) {
      updateUserMutation.mutate(payload as UserFormValues, {
        onSuccess: () => {
          form.reset();
          setOpen(false);
        },
      });
    } else {
      createUserMutation.mutate(payload as UserFormValues, {
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
            Thêm người dùng
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Sửa người dùng" : "Thêm người dùng"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Cập nhật thông tin người dùng. Nhấn lưu khi hoàn tất."
              : "Tạo tài khoản người dùng mới. Nhấn lưu khi hoàn tất."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="fullname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên người dùng</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập họ tên người dùng" {...field} />
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
                      <Input placeholder="Nhập địa chỉ email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên đăng nhập</FormLabel>
                    <FormControl>
                      <Input placeholder="Nhập tên đăng nhập" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Mật khẩu {isEditMode && "(Để trống nếu không đổi)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={isEditMode ? "password" : "text"}
                        placeholder={
                          isEditMode
                            ? "Nhập mật khẩu mới (nếu muốn đổi)"
                            : "Nhập mật khẩu"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Vai trò field - full width, trạng thái luôn là active khi tạo mới */}
              <FormField
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vai trò</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingRoles}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue
                            placeholder={
                              isLoadingRoles
                                ? "Đang tải vai trò..."
                                : "Chọn vai trò"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rolesData?.roles?.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Level field - select from API */}
              <FormField
                control={form.control}
                name="level_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cấp bậc</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoadingLevels}
                    >
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue
                            placeholder={
                              isLoadingLevels
                                ? "Đang tải cấp bậc..."
                                : "Chọn cấp bậc"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {levelsData?.levels?.map((level) => (
                          <SelectItem key={level.id} value={level.id}>
                            {level.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {canGetTenants && (
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
                        <SelectTrigger className="cursor-pointer w-full">
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
            )}

            <FormField
              control={form.control}
              name="webphone_enabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between gap-4 rounded-xl border border-border/80 bg-muted/15 px-4 py-3">
                  <div className="space-y-0.5">
                    <FormLabel>Bật webphone</FormLabel>
                    <FormDescription>
                      Cho phép người dùng sử dụng web call trên giao diện.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
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
                    ? updateUserMutation.isPending
                    : createUserMutation.isPending
                }
              >
                {isEditMode
                  ? updateUserMutation.isPending
                    ? "Đang cập nhật..."
                    : "Cập nhật người dùng"
                  : createUserMutation.isPending
                    ? "Đang lưu..."
                    : "Lưu người dùng"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
