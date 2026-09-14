"use client";

import type { UseFormReturn } from "react-hook-form";
import {
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CONTACT_CAPTURE_MODES } from "@/services/chatwoot/contact-capture";
import {
  INPUT_CLASSNAME,
  SELECT_TRIGGER_CLASSNAME,
  TEXTAREA_CLASSNAME,
  type InboxEditFormValues,
} from "./shared";

type InboxContactCaptureSectionProps = {
  form: UseFormReturn<InboxEditFormValues>;
  disabled?: boolean;
};

export function InboxContactCaptureSection({
  form,
  disabled,
}: InboxContactCaptureSectionProps) {
  const mode = form.watch("contact_capture.mode");
  const modeHint =
    CONTACT_CAPTURE_MODES.find((item) => item.value === mode)?.hint ?? "";

  return (
    <section className="space-y-3 rounded-lg border border-border/70 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h4 className="text-xs font-medium">Thu thập thông tin liên hệ</h4>
          <p className="text-xs text-muted-foreground">
            Ghi tên, email, SĐT lên theo từng Website.
          </p>
        </div>
        <FormField
          control={form.control}
          name="contact_capture.enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormLabel className="text-xs text-muted-foreground">
                Bật
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="contact_capture.mode"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <FormLabel className="text-xs">Cách thu thập</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger className={SELECT_TRIGGER_CLASSNAME}>
                  <SelectValue placeholder="Chọn cách thu thập" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CONTACT_CAPTURE_MODES.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {modeHint ? (
              <FormDescription className="text-xs">{modeHint}</FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="contact_capture.message"
        render={({ field }) => (
          <FormItem className="gap-1.5">
            <FormLabel className="text-xs">Lời nhắn form</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                disabled={disabled}
                rows={2}
                className={cn(TEXTAREA_CLASSNAME, "min-h-14 resize-y")}
                placeholder="Vui lòng để lại thông tin để chúng tôi hỗ trợ bạn tốt hơn."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-2">
        <p className="text-xs font-medium">Trường thu thập</p>
        <p className="text-xs text-muted-foreground">
          Lưu ý: Các trường thu thập sẽ hiện trên form chat của khách hàng.
        </p>
        <div className="space-y-2">
          {form.watch("contact_capture.fields")?.map((item, index) => (
            <div
              key={item.key}
              className="grid gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <FormField
                control={form.control}
                name={`contact_capture.fields.${index}.label`}
                render={({ field }) => (
                  <FormItem className="gap-1">
                    <FormLabel className="text-xs text-muted-foreground">
                      Nhãn{" "}
                      {item.key === "name"
                        ? "tên"
                        : item.key === "phone"
                          ? "SĐT"
                          : "email"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={disabled}
                        className={INPUT_CLASSNAME}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end gap-3 pb-0.5">
                <FormField
                  control={form.control}
                  name={`contact_capture.fields.${index}.enabled`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormLabel className="mb-0 text-xs font-normal">
                        Hiện
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          disabled={disabled}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            if (!checked) {
                              form.setValue(
                                `contact_capture.fields.${index}.required`,
                                false,
                              );
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contact_capture.fields.${index}.required`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormLabel className="mb-0 text-xs font-normal">
                        Bắt buộc
                      </FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          disabled={disabled || !item.enabled}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
