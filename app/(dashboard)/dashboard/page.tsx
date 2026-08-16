"use client";

import { useMemo, useState, type ReactNode } from "react";
import { OverviewReport } from "@/features/dashboard2/components/overview-report";
import { ConversationGroupedCharts } from "@/features/dashboard2/components/conversation-charts/conversation-report";
import { AgentHorizontalBarChart } from "@/features/dashboard2/components/agent-charts/agent-horizontal-bar-chart";
import { ConversationTrafficHeatmapChart } from "@/features/dashboard2/components/dashboard-charts/conversation-traffic-heatmap-chart";
import { ResolutionTrafficHeatmapChart } from "@/features/dashboard2/components/dashboard-charts/resolution-traffic-heatmap-chart";
import {
  getDefaultLast7DaysRange,
  StartAndEndDateTimePicker,
  toStartEndDateTimeFormats,
  type StartEndDateTimeValue,
} from "@/components/start-and-end-datetime-picker";

function toUnixRange(value: StartEndDateTimeValue) {
  const formats = toStartEndDateTimeFormats(value);
  return {
    since: formats.since ?? 0,
    until: formats.until ?? 0,
  };
}

function isValidRange(range: { since: number; until: number }) {
  return range.since > 0 && range.until > 0 && range.since <= range.until;
}

function ChartSection({
  title,
  description,
  dateValue,
  onDateChange,
  children,
}: {
  title: string;
  description: string;
  dateValue?: StartEndDateTimeValue;
  onDateChange?: (value: StartEndDateTimeValue) => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {dateValue && onDateChange ? (
          <StartAndEndDateTimePicker
            value={dateValue}
            onChange={onDateChange}
            numberOfMonths={2}
            placeholder="Chọn khoảng thời gian"
            align="end"
            className="shrink-0"
          />
        ) : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Trang overview — chỉ cần đăng nhập.
 * Phân quyền chi tiết route được enforce bởi `DashboardPermissionGate` (layout).
 */
export default function DashboardPage() {
  const [overviewRangeValue, setOverviewRangeValue] =
    useState<StartEndDateTimeValue>(getDefaultLast7DaysRange);
  const [trafficRangeValue, setTrafficRangeValue] =
    useState<StartEndDateTimeValue>(getDefaultLast7DaysRange);

  const overviewRange = useMemo(
    () => toUnixRange(overviewRangeValue),
    [overviewRangeValue],
  );
  const trafficRange = useMemo(
    () => toUnixRange(trafficRangeValue),
    [trafficRangeValue],
  );

  return (
    <>
      <div className="flex flex-col justify-between gap-3 px-4 py-4 md:flex-row md:items-center lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Báo cáo tổng quan
          </h1>
          <p className="text-muted-foreground">
            Hội thoại, tin nhắn, CSAT và trạng thái realtime theo khoảng thời
            gian
          </p>
        </div>
        <StartAndEndDateTimePicker
          value={overviewRangeValue}
          onChange={setOverviewRangeValue}
          numberOfMonths={2}
          placeholder="Chọn khoảng thời gian"
          align="end"
          className="shrink-0"
        />
      </div>

      <div className="@container/main space-y-10 px-4 pb-8 lg:px-6">
        {isValidRange(overviewRange) ? (
          <OverviewReport
            since={overviewRange.since}
            until={overviewRange.until}
          />
        ) : null}

        <ChartSection
          title="Lưu lượng theo giờ"
          description="Heatmap hội thoại và giải quyết"
          dateValue={trafficRangeValue}
          onDateChange={setTrafficRangeValue}
        >
          {isValidRange(trafficRange) ? (
            <div className="grid gap-5 lg:grid-cols-2 lg:items-stretch">
              <ConversationTrafficHeatmapChart
                key={`traffic-${trafficRange.since}-${trafficRange.until}`}
                since={trafficRange.since}
                until={trafficRange.until}
              />
              <ResolutionTrafficHeatmapChart
                key={`resolution-${trafficRange.since}-${trafficRange.until}`}
                since={trafficRange.since}
                until={trafficRange.until}
              />
            </div>
          ) : null}
        </ChartSection>

        <ChartSection
          title="Hội thoại"
          description="Ba nhóm: hội thoại, tin nhắn và thời gian xử lý — mỗi biểu đồ có khoảng thời gian riêng"
        >
          <ConversationGroupedCharts />
        </ChartSection>

        <ChartSection
          title="Agent"
          description="Thời gian xử lý và khối lượng hội thoại theo từng agent"
        >
          <AgentHorizontalBarChart />
        </ChartSection>
      </div>
    </>
  );
}
