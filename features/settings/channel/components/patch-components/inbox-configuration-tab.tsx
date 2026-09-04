"use client";

import type { UseFormReturn } from "react-hook-form";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  AllowedDomainsTagsInput,
  INPUT_CLASSNAME,
  type InboxEditFormValues,
} from "./shared";

export type InboxConfigurationTabProps = {
  form: UseFormReturn<InboxEditFormValues>;
  isBusy: boolean;
  savingConfiguration: boolean;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  onCopyHmacToken: () => void | Promise<void>;
};

export function InboxConfigurationTab({
  form,
  isBusy,
  savingConfiguration,
  onSubmit,
  onCopyHmacToken,
}: InboxConfigurationTabProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="w-full">
        <Card className="w-full gap-0 border-border/70 bg-card py-0 shadow-none">
          <CardContent className="space-y-6 p-4 sm:p-5">
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium">
                  Tên miền được phép
                </h3>
                <p className="text-sm text-muted-foreground">
                  Chỉ các trang thuộc danh sách này mới được nhúng widget
                  chat. Nhập từng URL rồi nhấn Enter để thêm. Để trống
                  nghĩa là cho phép mọi tên miền (không khuyến nghị trên
                  môi trường thật).
                </p>
              </div>

              <FormField
                control={form.control}
                name="allowed_domains"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-xs">
                      Danh sách tên miền
                    </FormLabel>
                    <FormControl>
                      <AllowedDomainsTagsInput
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isBusy}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Ví dụ:{" "}
                      <span translate="no">
                        https://devomnichannelcgv.telesip.vn
                      </span>
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="border-t border-border/70" />

            <FormField
              control={form.control}
              name="widget_enabled_in_mobile_apps"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0 flex-1 space-y-1">
                    <FormLabel className="text-base font-medium">
                      Bật widget trên ứng dụng di động
                    </FormLabel>
                    <p className="text-sm font-normal text-muted-foreground">
                      Bật nếu bạn nhúng widget trong app iOS hoặc Android.
                      App di động không gửi thông tin tên miền nên sẽ bị
                      chặn bởi danh sách tên miền trừ khi tùy chọn này
                      được bật.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isBusy}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="border-t border-border/70" />

            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-base font-medium">
                  Xác thực danh tính
                </h3>
                <p className="text-sm text-muted-foreground">
                  Dùng khóa bí mật để tạo token xác thực người dùng, tránh
                  giả mạo danh tính trong hội thoại.
                </p>
              </div>

              <FormField
                control={form.control}
                name="hmac_token"
                render={({ field }) => (
                  <FormItem className="gap-1.5">
                    <FormLabel className="text-xs">Khóa bí mật</FormLabel>
                    <div className="relative w-full">
                      <FormControl>
                        <Input
                          {...field}
                          readOnly
                          disabled={isBusy}
                          className={cn(
                            INPUT_CLASSNAME,
                            "w-full bg-muted/40 pr-28",
                          )}
                          translate="no"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute top-1/2 right-1.5 h-7 -translate-y-1/2 border"
                        disabled={isBusy || !field.value}
                        onClick={() => void onCopyHmacToken()}
                      >
                        <Copy className="size-3.5" />
                        Sao chép
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Giữ khóa này an toàn. Token tạo từ khóa sẽ được gửi
                      kèm khi bắt đầu hội thoại.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hmac_mandatory"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start justify-between gap-4 space-y-0 rounded-lg border border-border/70 px-3 py-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <FormLabel className="text-sm font-medium">
                        Bắt buộc xác thực danh tính cho mọi hội thoại
                      </FormLabel>
                      <p className="text-sm font-normal text-muted-foreground">
                        Khi bật, người dùng phải có token hợp lệ mới được
                        bắt đầu hội thoại. Yêu cầu không có token sẽ bị từ
                        chối.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isBusy}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </section>

            <div className="flex w-full justify-end pt-2">
              <Button type="submit" disabled={isBusy}>
                {savingConfiguration ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Cập nhật cấu hình"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
