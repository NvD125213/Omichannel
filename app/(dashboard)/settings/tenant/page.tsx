"use client";

import { useEffect, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bot, Star } from "lucide-react";
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
import { PermissionGuard } from "@/components/permission-guard";
import { PERMISSIONS } from "@/constants/permission";
import { useAuth } from "@/contexts/auth-context";
import { useGetTenants } from "@/hooks/tenant/use-get-tenant";
import {
  useGetOwnTenantSettings,
  useUpdateOwnTenantSettings,
} from "@/hooks/tenant/use-own-tenant-settings";
import { useMe } from "@/hooks/user/use-me";
import { cn } from "@/lib/utils";

const settingsTenantSchema = z.object({
  name: z.string(),
  description: z.string(),
  chatbot_enabled: z.boolean(),
  conversation_rating_enabled: z.boolean(),
  default_responder: z.enum(["bot", "agent"]),
});

type SettingsTenantValues = z.infer<typeof settingsTenantSchema>;

export default function SettingsTenantPage() {
  const router = useRouter();
  const { data: user, isPending: isUserPending } = useMe();
  const { hasPermission } = useAuth();
  const isPlatformAdmin = user?.is_platform_admin === true;
  const tenantId = user?.tenant_id ?? "";
  const canView = hasPermission(PERMISSIONS.VIEW_OWN_TENANT_SETTINGS);
  const canEdit = hasPermission(PERMISSIONS.EDIT_OWN_TENANT_SETTINGS);
  const canLoad = !!tenantId && !isPlatformAdmin && (canView || canEdit);

  const { data: tenant, isLoading: isTenantLoading } = useGetTenants(
    {
      id: tenantId,
    },
    { enabled: canLoad },
  );

  const { data: settings, isLoading: isSettingsLoading } =
    useGetOwnTenantSettings(canLoad);

  const updateSettings = useUpdateOwnTenantSettings();

  const form = useForm<SettingsTenantValues>({
    resolver: zodResolver(settingsTenantSchema),
    defaultValues: {
      name: "",
      description: "",
      chatbot_enabled: true,
      conversation_rating_enabled: false,
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
    if (!tenant || !settings) return;
    form.reset({
      name: tenant.name || "",
      description: tenant.description || "",
      chatbot_enabled: Boolean(settings.chatbot_enabled),
      conversation_rating_enabled: Boolean(
        settings.conversation_rating_enabled,
      ),
      default_responder:
        settings.default_responder === "agent" ? "agent" : "bot",
    });
  }, [tenant, settings, form]);

  function onSubmit(values: SettingsTenantValues) {
    if (!canEdit) return;
    updateSettings.mutate({
      conversation_rating_enabled: values.conversation_rating_enabled,
      chatbot_enabled: values.chatbot_enabled,
      default_responder: values.default_responder,
    });
  }

  const isLoading = isTenantLoading || isSettingsLoading;

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
      desc="Xem thông tin doanh nghiệp. Chỉnh chatbot, người phản hồi mặc định và đánh giá hội thoại khi có quyền cập nhật."
      innerClassName="lg:max-w-4xl"
    >
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !tenant ? (
        <p className="text-sm text-muted-foreground">
          Không tìm thấy thông tin doanh nghiệp của tài khoản này.
        </p>
      ) : !settings ? (
        <p className="text-sm text-muted-foreground">
          Không lấy được cài đặt vận hành của doanh nghiệp.
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!canEdit}
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
                <ToggleSetting
                  icon={Bot}
                  label="Kích hoạt chatbot"
                  description="Bật hoặc tắt chatbot cho doanh nghiệp này."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                />
              )}
            />

            <FormField
              control={form.control}
              name="conversation_rating_enabled"
              render={({ field }) => (
                <ToggleSetting
                  icon={Star}
                  label="Đánh giá hội thoại (CSAT)"
                  description="Cho phép khách hàng đánh giá sau khi kết thúc hội thoại."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={!canEdit}
                />
              )}
            />

            <PermissionGuard permission={PERMISSIONS.EDIT_OWN_TENANT_SETTINGS}>
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={updateSettings.isPending}
              >
                {updateSettings.isPending ? "Đang lưu..." : "Lưu cài đặt"}
              </Button>
            </PermissionGuard>
          </form>
        </Form>
      )}
    </ContentSection>
  );
}

function ToggleSetting({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <FormItem className="flex items-start justify-between gap-4 rounded-xl border border-border/80 bg-muted/15 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border",
            checked
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-border/70 bg-background text-muted-foreground",
          )}
        >
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <FormLabel className="text-sm font-semibold leading-none">
              {label}
            </FormLabel>
            <Badge
              variant="outline"
              className={cn(
                "h-5 border px-1.5 text-[10px] font-medium",
                checked
                  ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              {checked ? "Đang bật" : "Đã tắt"}
            </Badge>
          </div>
          <FormDescription className="text-xs leading-relaxed">
            {description}
          </FormDescription>
        </div>
      </div>
      <FormControl>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className="mt-1 shrink-0"
        />
      </FormControl>
    </FormItem>
  );
}
