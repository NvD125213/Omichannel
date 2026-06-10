"use client";

import { ContentSection } from "@/components/content-section";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const notificationsFormSchema = z.object({
  communication_emails: z.boolean(),
  marketing_emails: z.boolean(),
  social_emails: z.boolean(),
  security_emails: z.boolean(),
  mobile_push: z.boolean(),
  desktop_push: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsFormSchema>;

const defaultValues: NotificationsFormValues = {
  communication_emails: false,
  marketing_emails: false,
  social_emails: true,
  security_emails: true,
  mobile_push: false,
  desktop_push: true,
};

export default function NotificationsPage() {
  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsFormSchema),
    defaultValues,
  });

  function onSubmit(data: NotificationsFormValues) {
    toast.message("Notification preferences updated!", {
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
    <ContentSection title="Thông báo" desc="Cấu hình cách bạn nhận thông báo.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-4">
          <div>
            <h3 className="mb-4 text-lg font-medium">Thông báo email</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="communication_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Thông báo email
                      </FormLabel>
                      <FormDescription>
                        Nhận email về hoạt động của tài khoản của bạn.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketing_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Thông báo email marketing
                      </FormLabel>
                      <FormDescription>
                        Nhận email về sản phẩm, tính năng mới và thêm.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="social_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Thông báo email xã hội
                      </FormLabel>
                      <FormDescription>
                        Nhận email về yêu cầu kết bạn, theo dõi và thêm.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="security_emails"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Thông báo email bảo mật
                      </FormLabel>
                      <FormDescription>
                        Nhận email về bảo mật tài khoản của bạn.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-medium">Thông báo push</h3>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="mobile_push"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Thông báo push trên điện thoại</FormLabel>
                      <FormDescription>
                        Nhận thông báo push trên điện thoại của bạn.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button type="submit">Cập nhật thông báo</Button>
        </form>
      </Form>
    </ContentSection>
  );
}
