"use client";

import type { CSSProperties } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Sketch } from "@uiw/react-color";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CHANNEL_LABELS,
  FEATURE_FLAGS,
  InboxAvatarSetup,
  INPUT_CLASSNAME,
  REPLY_TIME_OPTIONS,
  SELECT_TRIGGER_CLASSNAME,
  TEXTAREA_CLASSNAME,
  WebsiteChatPreview,
  type ChannelKey,
  type InboxEditFormValues,
} from "./shared";

export type InboxSettingsTabWatched = Pick<
  InboxEditFormValues,
  | "name"
  | "welcome_title"
  | "welcome_tagline"
  | "widget_color"
  | "reply_time"
  | "greeting_enabled"
  | "greeting_message"
>;

export type InboxSettingsTabProps = {
  form: UseFormReturn<InboxEditFormValues>;
  channelKey: ChannelKey;
  isBusy: boolean;
  savingSettings: boolean;
  activeAvatarUrl: string;
  inboxRecord: Record<string, unknown> | null;
  widgetScript: string;
  isWidgetColorOpen: boolean;
  setIsWidgetColorOpen: (open: boolean) => void;
  onAvatarFileSelect: (file: File) => void;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  watched: InboxSettingsTabWatched;
};

export function InboxSettingsTab({
  form,
  channelKey,
  isBusy,
  savingSettings,
  activeAvatarUrl,
  inboxRecord,
  widgetScript,
  isWidgetColorOpen,
  setIsWidgetColorOpen,
  onAvatarFileSelect,
  onSubmit,
  watched,
}: InboxSettingsTabProps) {
  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-6 pb-6">
        <div
          className={cn(
            "grid gap-4",
            channelKey === "website" &&
              "xl:grid-cols-[minmax(0,1fr)_minmax(352px,0.666fr)] xl:items-stretch xl:min-h-128",
          )}
        >
          <Card className="flex h-full min-w-0 flex-col gap-0 border-border/70 bg-card py-0 shadow-none">
            <CardContent className="flex flex-1 flex-col space-y-4 p-4 sm:p-5">
              {channelKey === "website" ? (
                <section className="space-y-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium">Cấu hình widget</h3>
                    <p className="text-xs text-muted-foreground">
                      Chỉnh sửa bên trái, xem trước bên phải.
                    </p>
                  </div>

                  <InboxAvatarSetup
                    displayUrl={activeAvatarUrl}
                    disabled={isBusy}
                    uploadInputId="inbox-website-avatar-upload"
                    onFileSelect={onAvatarFileSelect}
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">Tên kênh</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isBusy}
                              className={INPUT_CLASSNAME}
                              placeholder="Nhập tên kênh"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website_url"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">Website URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isBusy}
                              className={INPUT_CLASSNAME}
                              placeholder="https://example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="welcome_title"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">
                            Tiêu đề chào mừng
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isBusy}
                              className={INPUT_CLASSNAME}
                              placeholder="Xin chào!"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reply_time"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">
                            Thời gian phản hồi
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isBusy}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={SELECT_TRIGGER_CLASSNAME}
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {REPLY_TIME_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="welcome_tagline"
                    render={({ field }) => (
                      <FormItem className="gap-1.5">
                        <FormLabel className="text-xs">
                          Mô tả chào mừng
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            disabled={isBusy}
                            maxLength={255}
                            rows={2}
                            className={cn(
                              TEXTAREA_CLASSNAME,
                              "min-h-14 resize-y",
                            )}
                            placeholder="Chúng tôi sẵn sàng hỗ trợ bạn."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                    <FormField
                      control={form.control}
                      name="widget_color"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">Màu widget</FormLabel>
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() =>
                                setIsWidgetColorOpen(!isWidgetColorOpen)
                              }
                              disabled={isBusy}
                              className="inline-flex items-center gap-2 rounded-lg border border-border/80 px-2.5 py-1.5"
                            >
                              <span
                                className="size-5 rounded-full border"
                                style={{
                                  backgroundColor: field.value || "#1f93ff",
                                }}
                              />
                              <span className=" text-xs">
                                {field.value || "#1f93ff"}
                              </span>
                            </button>
                            {isWidgetColorOpen ? (
                              <FormControl>
                                <div
                                  className={cn(
                                    "w-fit overflow-x-auto rounded-xl border bg-background p-2",
                                    isBusy && "pointer-events-none opacity-60",
                                  )}
                                >
                                  <Sketch
                                    color={field.value || "#1f93ff"}
                                    onChange={(color) =>
                                      field.onChange(color.hex)
                                    }
                                    style={
                                      {
                                        width: 220,
                                        boxShadow: "none",
                                        background: "transparent",
                                        "--sketch-background": "transparent",
                                        "--sketch-box-shadow": "none",
                                        "--sketch-swatch-border-top":
                                          "1px solid hsl(var(--border))",
                                      } as CSSProperties
                                    }
                                    disableAlpha
                                  />
                                </div>
                              </FormControl>
                            ) : null}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="greeting_message"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <FormLabel className="text-xs">
                              Tin nhắn chào
                            </FormLabel>
                            <FormField
                              control={form.control}
                              name="greeting_enabled"
                              render={({ field: toggle }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                  <FormLabel className="text-xs text-muted-foreground">
                                    Bật
                                  </FormLabel>
                                  <FormControl>
                                    <Switch
                                      checked={toggle.value}
                                      onCheckedChange={toggle.onChange}
                                      disabled={isBusy}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={isBusy || !watched.greeting_enabled}
                              rows={2}
                              className={cn(
                                TEXTAREA_CLASSNAME,
                                "min-h-14 resize-y",
                              )}
                              placeholder="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {(
                      [
                        {
                          name: "enable_email_collect" as const,
                          label: "Thu thập email",
                        },
                        {
                          name: "allow_messages_after_resolved" as const,
                          label: "Nhắn sau khi xử lý",
                        },
                        {
                          name: "continuity_via_email" as const,
                          label: "Tiếp tục qua email",
                        },
                      ] as const
                    ).map((item) => (
                      <FormField
                        key={item.name}
                        control={form.control}
                        name={item.name}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2">
                            <FormLabel className="mb-0 text-xs font-normal">
                              {item.label}
                            </FormLabel>
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
                    ))}
                  </div>

                  <FormField
                    control={form.control}
                    name="selected_feature_flags"
                    render={({ field }) => (
                      <FormItem className="gap-1.5">
                        <FormLabel className="text-xs">
                          Tính năng widget
                        </FormLabel>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {FEATURE_FLAGS.map((feature) => {
                            const checked = field.value.includes(feature.key);
                            return (
                              <label
                                key={feature.key}
                                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2"
                              >
                                <Checkbox
                                  checked={checked}
                                  disabled={isBusy}
                                  onCheckedChange={(value) => {
                                    const next = new Set(field.value);
                                    if (value === true) next.add(feature.key);
                                    else next.delete(feature.key);
                                    field.onChange(Array.from(next));
                                  }}
                                />
                                <span className="text-xs leading-4">
                                  {feature.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              ) : (
                <>
                  <section className="space-y-4">
                    <div className="space-y-0.5">
                      <h3 className="text-sm font-medium">Thông tin kênh</h3>
                      <p className="text-xs text-muted-foreground">
                        Cấu hình kênh {CHANNEL_LABELS[channelKey]}.
                      </p>
                    </div>

                    <InboxAvatarSetup
                      displayUrl={activeAvatarUrl}
                      disabled={isBusy}
                      uploadInputId="inbox-channel-avatar-upload"
                      onFileSelect={onAvatarFileSelect}
                    />

                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="gap-1.5">
                            <FormLabel className="text-xs">Tên kênh</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                disabled={isBusy}
                                className={INPUT_CLASSNAME}
                                placeholder="Nhập tên kênh"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {channelKey === "email" ? (
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">Email</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="support@example.com"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {channelKey === "api" ? (
                        <FormField
                          control={form.control}
                          name="webhook_url"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Webhook URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="https://example.com/webhook"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {channelKey === "sms" || channelKey === "whatsapp" ? (
                        <FormField
                          control={form.control}
                          name="phone_number"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Số điện thoại
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="+15551234567"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}

                      {channelKey === "telegram" ? (
                        <FormField
                          control={form.control}
                          name="bot_token"
                          render={({ field }) => (
                            <FormItem className="gap-1.5 sm:col-span-2">
                              <FormLabel className="text-xs">
                                Bot Token
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                    </div>

                    {channelKey === "sms" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="provider_api_key"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Provider API Key
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="provider_api_secret"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Provider API Secret
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="provider_application_id"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Application ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="your-application-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="provider_account_id"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Account ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="your-account-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {channelKey === "whatsapp" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="provider_api_key"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">API Key</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone_number_id"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Phone Number ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="your-phone-number-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="business_account_id"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Business Account ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="your-business-account-id"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {channelKey === "line" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="line_channel_id"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                LINE Channel ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="1234567890"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="line_channel_secret"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                LINE Channel Secret
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="line_channel_token"
                          render={({ field }) => (
                            <FormItem className="gap-1.5 sm:col-span-2">
                              <FormLabel className="text-xs">
                                LINE Channel Token
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Để trống nếu không đổi"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}

                    {channelKey === "api" ? (
                      <FormField
                        control={form.control}
                        name="hmac_mandatory"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border px-3 py-2">
                            <FormLabel className="mb-0 text-xs font-normal">
                              Bắt buộc HMAC
                            </FormLabel>
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
                    ) : null}

                    {channelKey === "email" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="sender_name_type"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Tên người gửi
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isBusy}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={SELECT_TRIGGER_CLASSNAME}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="friendly">
                                    Thân thiện
                                  </SelectItem>
                                  <SelectItem value="professional">
                                    Chuyên nghiệp
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="business_name"
                          render={({ field }) => (
                            <FormItem className="gap-1.5">
                              <FormLabel className="text-xs">
                                Tên doanh nghiệp
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={isBusy}
                                  className={INPUT_CLASSNAME}
                                  placeholder="Nhập tên doanh nghiệp"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : null}
                  </section>

                  <section className="space-y-3 border-t pt-4">
                    <h3 className="text-sm font-medium">Cài đặt hội thoại</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          {
                            name: "greeting_enabled" as const,
                            label: "Bật lời chào",
                            channels: null as ChannelKey[] | null,
                          },
                          {
                            name: "lock_to_single_conversation" as const,
                            label: "Giới hạn một hội thoại",
                            channels: [
                              "api",
                              "line",
                              "telegram",
                              "whatsapp",
                              "sms",
                            ] as ChannelKey[] | null,
                          },
                        ] as const
                      )
                        .filter(
                          (item) =>
                            !item.channels ||
                            item.channels.includes(channelKey),
                        )
                        .map((item) => (
                          <FormField
                            key={item.name}
                            control={form.control}
                            name={item.name}
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between gap-3 rounded-lg border px-3 py-2">
                                <FormLabel className="mb-0 text-xs font-normal">
                                  {item.label}
                                </FormLabel>
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
                        ))}
                    </div>
                    <FormField
                      control={form.control}
                      name="greeting_message"
                      render={({ field }) => (
                        <FormItem className="gap-1.5">
                          <FormLabel className="text-xs">Tin nhắn chào</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              disabled={isBusy || !watched.greeting_enabled}
                              rows={2}
                              className={cn(
                                TEXTAREA_CLASSNAME,
                                "min-h-14 resize-y",
                              )}
                              placeholder="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </section>
                </>
              )}

              <div className="mt-auto flex justify-end pt-1">
                <Button type="submit" disabled={isBusy}>
                  {savingSettings ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Cập nhật cài đặt"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {channelKey === "website" ? (
            <WebsiteChatPreview
              inboxRecord={inboxRecord}
              formValues={{
                name: watched.name,
                avatar_url: activeAvatarUrl,
                welcome_title: watched.welcome_title,
                welcome_tagline: watched.welcome_tagline,
                widget_color: watched.widget_color,
                reply_time: watched.reply_time,
                greeting_enabled: watched.greeting_enabled,
                greeting_message: watched.greeting_message,
              }}
              script={widgetScript}
            />
          ) : null}
        </div>
      </form>
    </Form>
  );
}
