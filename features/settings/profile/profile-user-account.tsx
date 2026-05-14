"use client";

import { useEffect } from "react";
import { ContentSection } from "@/components/content-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import * as LucideIcons from "lucide-react";
import type { ElementType } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMe } from "@/hooks/user/use-me";
import { PERMISSIONS_META } from "@/constants/permission-with-icon";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." })
    .max(30, { message: "Username must not be longer than 30 characters." }),
  email: z
    .string({ message: "Please select an email to display." })
    .email({ message: "Please enter a valid email address." }),
  fullname: z.string().min(1, { message: "Fullname is required." }),
  is_active: z.string(),
  role: z.string().min(1, { message: "Role is required." }),
  permissions: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: Partial<ProfileFormValues> = {
  username: "",
  email: "",
  fullname: "",
  is_active: "",
  role: "",
  permissions: "",
};

export default function SettingsProfilePage() {
  const { data: userProfile } = useMe();

  const userPermissionMetas =
    userProfile && Array.isArray(userProfile.permissions)
      ? Object.values(PERMISSIONS_META).filter((meta) =>
          userProfile.permissions?.includes(meta.value),
        )
      : [];

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Đổ dữ liệu người dùng hiện tại vào form khi đã load được
  useEffect(() => {
    if (!userProfile) return;

    form.reset({
      username: userProfile.fullname || userProfile.username || "",
      email: userProfile.email || "",
      fullname: userProfile.fullname || "",
      is_active: String(userProfile.is_active ?? ""),
      role: userProfile.role || "",
      permissions: Array.isArray(userProfile.permissions)
        ? userProfile.permissions.join(", ")
        : "",
    });
  }, [userProfile, form]);

  function onSubmit(data: ProfileFormValues) {
    toast.message("Profile updated successfully!", {
      description: (
        <pre className="mt-2 overflow-x-auto rounded-md bg-slate-950 p-4">
          <code className="text-white text-xs">
            {JSON.stringify(data, null, 2)}
          </code>
        </pre>
      ),
    });
  }

  return (
    <ContentSection
      title="Hồ sơ người dùng"
      desc="Đây là các thông tin cá nhân trên hệ thống của bạn."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="shadcn" {...field} disabled={true} />
                </FormControl>
                <FormDescription>
                  Tên đăng nhập của bạn trên hệ thống.
                </FormDescription>
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
                    placeholder="you@example.com"
                    {...field}
                    disabled={true}
                  />
                </FormControl>
                <FormDescription>
                  Email hiện tại được lấy từ tài khoản của bạn.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fullname"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nguyễn Văn A"
                    {...field}
                    disabled={true}
                  />
                </FormControl>
                <FormDescription>
                  Họ tên đầy đủ hiển thị trên hệ thống.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={() => (
              <FormItem>
                <FormLabel>Trạng thái hoạt động</FormLabel>
                <div className="mt-1">
                  <Badge
                    variant={userProfile?.is_active ? "outline" : "destructive"}
                    className={
                      userProfile?.is_active
                        ? "border-green-500 text-green-600"
                        : ""
                    }
                  >
                    {userProfile?.is_active
                      ? "Đang hoạt động"
                      : "Ngừng hoạt động"}
                  </Badge>
                </div>
                <FormDescription>
                  Trạng thái được lấy từ hệ thống, không thể chỉnh sửa tại đây.
                </FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={() => (
              <FormItem>
                <FormLabel>Vai trò & quyền hạn</FormLabel>
                <div className="mt-1 space-y-2">
                  <div>
                    <Badge
                      variant="outline"
                      className="border-blue-500 text-blue-600"
                    >
                      <LucideIcons.ShieldCheck className="mr-1 size-3.5" />
                      {userProfile?.role || "N/A"}
                    </Badge>
                  </div>

                  {userPermissionMetas.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      {userPermissionMetas.map((meta) => {
                        const Icon =
                          (LucideIcons[
                            meta.icon as keyof typeof LucideIcons
                          ] as ElementType) ??
                          (LucideIcons.KeyRound as ElementType);

                        return (
                          <Badge
                            key={meta.value}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            <Icon className="size-3.5" />
                            <span>{meta.label}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Tài khoản hiện chưa được gán quyền cụ thể.
                    </p>
                  )}
                </div>
                <FormDescription>
                  Thông tin role và nhóm quyền được cấu hình bởi quản trị viên.
                </FormDescription>
              </FormItem>
            )}
          />
          {/* <Button type="submit">Update profile</Button> */}
        </form>
      </Form>
    </ContentSection>
  );
}
