"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ContentSection } from "@/components/content-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { getTenantMeta } from "@/features/tenants/utils/schema";
import { useGetTenants, useUpdateTenant } from "@/hooks/tenant/use-get-tenant";
import { useMe } from "@/hooks/user/use-me";
import { cn } from "@/lib/utils";

const settingsTenantSchema = z.object({
  name: z.string(),
  description: z.string(),
  chatbot_enabled: z.boolean(),
  default_responder: z.enum(["bot", "agent"]),
});

type SettingsTenantValues = z.infer<typeof settingsTenantSchema>;

export default function SettingsTenantPage() {
  const router = useRouter();
  const { data: user, isPending: isUserPending } = useMe();
  const isPlatformAdmin = user?.is_platform_admin === true;
  const tenantId = user?.tenant_id ?? "";

  const { data: tenant, isLoading: isTenantLoading } = useGetTenants(
    {
      id: tenantId,
    },
    { enabled: !!tenantId && !isPlatformAdmin },
  );

  const updateTenant = useUpdateTenant();

  const form = useForm<SettingsTenantValues>({
    resolver: zodResolver(settingsTenantSchema),
    defaultValues: {
      name: "",
      description: "",
      chatbot_enabled: true,
      default_responder: "bot",
    },
  });

  useEffect(() => {
    if (isUserPending) return;
    if (isPlatformAdmin) {
      router.replace("/settings");
    }
  }, [isPlatformAdmin, isUserPending, router]);

  useEffect(() => {
    if (!tenant) return;
    const meta = getTenantMeta(tenant);
    form.reset({
      name: tenant.name || "",
      description: tenant.description || "",
      chatbot_enabled: meta.chatbot_enabled,
      default_responder: meta.default_responder,
    });
  }, [tenant, form]);

  function onSubmit(values: SettingsTenantValues) {
    if (!tenant?.id) return;
    const meta = {
      chatbot_enabled: values.chatbot_enabled,
      default_responder: values.default_responder,
    };
    updateTenant.mutate({
      id: tenant.id,
      data: {
        name: tenant.name,
        description: tenant.description || undefined,
        is_active: tenant.is_active,
        meta,
        meta_data: meta,
      },
    });
  }

  if (isUserPending || isPlatformAdmin) {
    return (
      <ContentSection
        title="Trạng thái doanh nghiệp"
        desc="Thông tin doanh nghiệp hiện tại của bạn."
      >
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </ContentSection>
    );
  }

  return (
    <ContentSection
      title="Trạng thái doanh nghiệp"
      desc="Xem thông tin doanh nghiệp. Chỉ có thể chỉnh chatbot và người phản hồi mặc định."
      innerClassName="lg:max-w-4xl"
    >
      {isTenantLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !tenant ? (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy thông tin doanh nghiệp của tài khoản này.
        </p>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-8 pb-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên doanh nghiệp</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Tên doanh nghiệp do quản trị nền tảng cấu hình.
                  </FormDescription>
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
                    <Input {...field} disabled />
                  </FormControl>
                  <FormDescription>
                    Mô tả không thể chỉnh sửa tại đây.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Trạng thái hoạt động</FormLabel>
              <div className="mt-1">
                <Badge
                  variant={tenant.is_active ? "outline" : "destructive"}
                  className={
                    tenant.is_active ? "border-green-500 text-green-600" : ""
                  }
                >
                  {tenant.is_active ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
              </div>
              <FormDescription>
                Trạng thái được lấy từ hệ thống, không thể chỉnh sửa tại đây.
              </FormDescription>
            </FormItem>

            <FormField
              control={form.control}
              name="default_responder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Người phản hồi mặc định</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                  <FormDescription>
                    Cuộc hội thoại mới sẽ ưu tiên bot hoặc agent.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <Button
              type="submit"
              className="cursor-pointer"
              disabled={updateTenant.isPending}
            >
              {updateTenant.isPending ? "Đang lưu..." : "Lưu metadata"}
            </Button>
          </form>
        </Form>
      )}
    </ContentSection>
  );
}
