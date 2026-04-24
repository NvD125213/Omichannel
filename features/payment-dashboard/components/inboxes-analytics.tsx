"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/auth-context";
import { useListTenantInboxes } from "@/hooks/chatwoot/use-chatwoot";
import apiClient from "@/lib/api-client";
import { Building2, Clock3, MessageSquareText } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

interface InboxWorkingHourItem {
  day_of_week?: number;
  closed_all_day?: boolean;
  open_hour?: number | null;
  open_minutes?: number | null;
  close_hour?: number | null;
  close_minutes?: number | null;
  open_all_day?: boolean;
}

interface TenantInboxItem {
  id?: number | string;
  avatar_url?: string;
  channel_id?: number;
  name?: string;
  channel_type?: string;
  working_hours_enabled?: boolean;
  enable_auto_assignment?: boolean;
  working_hours?: InboxWorkingHourItem[];
}

const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const REPORT_SINCE = 1776445200;
const REPORT_UNTIL = 1777049999;

interface InboxReportItem {
  id: number;
  conversations_count: number | null;
  resolved_conversations_count: number | null;
  avg_resolution_time: number | null;
  avg_first_response_time: number | null;
  avg_reply_time: number | null;
}

const channelTypeLabel = (value: string) => {
  if (value === "Channel::Api") return "API";
  if (value === "Channel::WebWidget") return "Web Widget";
  const [, suffix] = value.split("::");
  return suffix || value;
};

const getWorkingHoursInMinutes = (item?: InboxWorkingHourItem) => {
  if (!item || item.closed_all_day) return 0;
  if (item.open_all_day) return 24 * 60;

  const openHour = item.open_hour;
  const openMinutes = item.open_minutes;
  const closeHour = item.close_hour;
  const closeMinutes = item.close_minutes;

  if (
    typeof openHour !== "number" ||
    typeof openMinutes !== "number" ||
    typeof closeHour !== "number" ||
    typeof closeMinutes !== "number"
  ) {
    return 0;
  }

  const openTotalMinutes = openHour * 60 + openMinutes;
  const closeTotalMinutes = closeHour * 60 + closeMinutes;
  let duration = closeTotalMinutes - openTotalMinutes;
  if (duration < 0) duration += 24 * 60;
  return duration;
};

const minutesToHourValue = (hour?: number | null, minutes?: number | null) => {
  if (typeof hour !== "number" || typeof minutes !== "number") return null;
  return Number((hour + minutes / 60).toFixed(2));
};

const secondsToReadable = (value: number | null | undefined) => {
  console.log(value);
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  const total = Math.max(0, Math.floor(value));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

export function InboxesAnalytics() {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const { data, isLoading } = useListTenantInboxes(tenantId);

  const inboxPayload = (
    data?.data as { chatwoot?: { payload?: unknown } } | undefined
  )?.chatwoot?.payload;
  const inboxes: TenantInboxItem[] = useMemo(
    () =>
      Array.isArray(inboxPayload) ? (inboxPayload as TenantInboxItem[]) : [],
    [inboxPayload],
  );

  const autoAssignEnabled = inboxes.filter(
    (inbox) => inbox.enable_auto_assignment === true,
  ).length;
  const workingHoursEnabled = inboxes.filter(
    (inbox) => inbox.working_hours_enabled === true,
  ).length;
  const [selectedInboxKey, setSelectedInboxKey] = useState<string>("");

  useEffect(() => {
    if (inboxes.length === 0) {
      setSelectedInboxKey("");
      return;
    }

    const hasSelected = inboxes.some(
      (inbox, index) =>
        String(inbox.id ?? `${inbox.name ?? "inbox"}-${index}`) ===
        selectedInboxKey,
    );

    if (!hasSelected) {
      setSelectedInboxKey(
        String(inboxes[0]?.id ?? `${inboxes[0]?.name ?? "inbox"}-0`),
      );
    }
  }, [inboxes, selectedInboxKey]);

  const selectedInbox = useMemo(
    () =>
      inboxes.find(
        (inbox, index) =>
          String(inbox.id ?? `${inbox.name ?? "inbox"}-${index}`) ===
          selectedInboxKey,
      ),
    [inboxes, selectedInboxKey],
  );
  const selectedInboxId = Number(selectedInbox?.id);

  const { data: inboxReportsResponse, isLoading: isLoadingInboxReports } =
    useQuery({
      queryKey: [
        "chatwoot-inbox-reports",
        tenantId,
        REPORT_SINCE,
        REPORT_UNTIL,
        false,
      ],
      queryFn: async () => {
        const response = await apiClient.get<{
          data?: unknown;
        }>(`/chatwoot/tenants/${tenantId}/inboxes/report`, {
          params: {
            since: REPORT_SINCE,
            until: REPORT_UNTIL,
            business_hours: false,
          },
        });
        return response.data;
      },
      enabled: Boolean(tenantId),
    });
  const inboxReports = useMemo(() => {
    const payload = (inboxReportsResponse as { data?: unknown } | undefined)
      ?.data;
    return Array.isArray(payload) ? (payload as InboxReportItem[]) : [];
  }, [inboxReportsResponse]);
  const selectedInboxReport = useMemo(
    () => inboxReports.find((item) => item.id === selectedInboxId),
    [inboxReports, selectedInboxId],
  );

  const workingHoursByDay = DAY_LABELS.map((dayLabel, dayIndex) => {
    const dayConfig = selectedInbox?.working_hours?.find(
      (item) => item.day_of_week === dayIndex,
    );
    const hours = Number((getWorkingHoursInMinutes(dayConfig) / 60).toFixed(1));
    const openHour =
      typeof dayConfig?.open_hour === "number" ? dayConfig.open_hour : 0;
    const openMinutes =
      typeof dayConfig?.open_minutes === "number" ? dayConfig.open_minutes : 0;
    const closeHour =
      typeof dayConfig?.close_hour === "number" ? dayConfig.close_hour : 0;
    const closeMinutes =
      typeof dayConfig?.close_minutes === "number"
        ? dayConfig.close_minutes
        : 0;
    const openTime = minutesToHourValue(
      dayConfig?.open_hour,
      dayConfig?.open_minutes,
    );
    const closeTime = minutesToHourValue(
      dayConfig?.close_hour,
      dayConfig?.close_minutes,
    );

    return {
      day: dayLabel,
      hours,
      openHour,
      openMinutes,
      closeHour,
      closeMinutes,
      openTime: openTime ?? 0,
      closeTime: closeTime ?? 0,
    };
  });
  const totalWeeklyHours = Number(
    workingHoursByDay.reduce((sum, day) => sum + day.hours, 0).toFixed(1),
  );

  return (
    <Card className="border-border/50 bg-linear-to-br from-amber-500/5 via-background to-background shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>Phân tích thống kê theo kênh</CardTitle>
        <CardDescription>
          Theo dõi số lượng inbox, loại kênh và cấu hình vận hành.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Tổng inbox</p>
            <p className="mt-1 text-xl font-semibold">{inboxes.length}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Bật tự động gán</p>
            <p className="mt-1 text-xl font-semibold">{autoAssignEnabled}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Bật giờ làm việc</p>
            <p className="mt-1 text-xl font-semibold">{workingHoursEnabled}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="mb-3 text-sm font-medium">Thông tin kênh đã chọn</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {selectedInbox?.avatar_url ? (
                  <img
                    src={selectedInbox.avatar_url}
                    alt={selectedInbox.name ?? "avatar"}
                    className="size-10 rounded-md border object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-md border bg-muted">
                    <Building2 className="size-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {selectedInbox?.name || "Chưa chọn inbox"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {channelTypeLabel(selectedInbox?.channel_type ?? "Khác")}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">Inbox ID</p>
                  <p className="text-sm font-medium">
                    {selectedInbox?.id ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Channel ID
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInbox?.channel_id ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Số lượng cuộc hội thoại
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInboxReport?.conversations_count ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Đã giải quyết
                  </p>
                  <p className="text-sm font-medium">
                    {selectedInboxReport?.resolved_conversations_count ?? "--"}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Thời gian giải quyết trung bình
                  </p>
                  <p className="text-sm font-medium">
                    {secondsToReadable(
                      selectedInboxReport?.avg_resolution_time,
                    )}
                  </p>
                </div>
                <div className="rounded-md border bg-background p-2">
                  <p className="text-[11px] text-muted-foreground">
                    Thời gian phản hồi trung bình
                  </p>
                  <p className="text-sm font-medium">
                    {secondsToReadable(
                      selectedInboxReport?.avg_first_response_time,
                    )}
                  </p>
                </div>
              </div>
              {isLoadingInboxReports && (
                <p className="text-xs text-muted-foreground">
                  Đang tải số liệu inbox...
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <p className="mb-3 text-sm font-medium">Danh sách kênh</p>
            <div className="space-y-2">
              {isLoading && (
                <p className="text-sm text-muted-foreground">
                  Đang tải dữ liệu...
                </p>
              )}
              {!isLoading && inboxes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có inbox để hiển thị.
                </p>
              )}
              {!isLoading &&
                inboxes.map((inbox, index) =>
                  (() => {
                    const inboxKey = String(
                      inbox.id ?? `${inbox.name ?? "inbox"}-${index}`,
                    );
                    const isSelected = inboxKey === selectedInboxKey;

                    return (
                      <div
                        key={inboxKey}
                        className={`cursor-pointer rounded-md border p-3 transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/30"
                        }`}
                        onClick={() => setSelectedInboxKey(inboxKey)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedInboxKey(inboxKey);
                          }
                        }}
                      >
                        <p className="truncate text-sm font-medium">
                          {inbox.name || "Kênh chưa đặt tên"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="size-3.5" />
                            {channelTypeLabel(inbox.channel_type ?? "Khác")}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquareText className="size-3.5" />
                            Auto assign:{" "}
                            {inbox.enable_auto_assignment ? "Bật" : "Tắt"}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            Working hours:{" "}
                            {inbox.working_hours_enabled ? "Bật" : "Tắt"}
                          </span>
                        </div>
                      </div>
                    );
                  })(),
                )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Giờ mở/đóng theo ngày (theo inbox chọn)
            </p>
            <p className="text-xs text-muted-foreground">
              Tổng tuần: {totalWeeklyHours}h
            </p>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">
            Inbox: {selectedInbox?.name || "Chưa chọn inbox"}
          </p>
          <ChartContainer
            config={{
              openHour: { label: "open_hour" },
              openMinutes: { label: "open_minutes" },
              closeHour: { label: "close_hour" },
              closeMinutes: { label: "close_minutes" },
            }}
            className="h-[220px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={workingHoursByDay}
                margin={{ top: 8, right: 8, left: -12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-muted/30"
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={34}
                  domain={[0, 59]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  dataKey="openHour"
                  type="monotone"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  dataKey="openMinutes"
                  type="monotone"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  dataKey="closeHour"
                  type="monotone"
                  stroke="var(--chart-3)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  dataKey="closeMinutes"
                  type="monotone"
                  stroke="var(--chart-4)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
