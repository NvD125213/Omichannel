"use client";

import {
  TimeseriesBarChart,
  type TimeseriesValueKind,
} from "@/features/dashboard2/components/conversation-charts/timeseries-bar-chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDefaultLast7DaysRange,
  StartAndEndDateTimePicker,
  toStartEndDateTimeFormats,
  type StartEndDateTimeValue,
} from "@/components/start-and-end-datetime-picker";
import { useMemo, useState } from "react";
import type { ReportTimeseriesMetric } from "@/services/reports/service";

function toUnixRange(value: StartEndDateTimeValue) {
  const formats = toStartEndDateTimeFormats(value);
  return {
    since: formats.since ?? 0,
    until: formats.until ?? 0,
  };
}

export type ConversationMetricOption = {
  metric: ReportTimeseriesMetric;
  label: string;
  description: string;
  seriesLabel: string;
  valueKind?: TimeseriesValueKind;
  color?: string;
};

export type GroupedConversationChartProps = {
  title: string;
  options: ConversationMetricOption[];
  className?: string;
};

export function GroupedConversationChart({
  title,
  options,
  className,
}: GroupedConversationChartProps) {
  const [metric, setMetric] = useState(options[0]?.metric ?? "");
  const [rangeValue, setRangeValue] = useState<StartEndDateTimeValue>(
    getDefaultLast7DaysRange,
  );
  const range = useMemo(() => toUnixRange(rangeValue), [rangeValue]);
  const selected =
    options.find((option) => option.metric === metric) ?? options[0];

  if (!selected) return null;

  return (
    <TimeseriesBarChart
      key={selected.metric}
      since={range.since}
      until={range.until}
      metric={selected.metric}
      title={title}
      description={selected.description}
      seriesLabel={selected.seriesLabel}
      valueKind={selected.valueKind}
      color={selected.color}
      className={className}
      headerAction={
        <div className="flex w-full flex-row gap-2 sm:w-auto">
          {options.length > 1 ? (
            <Select
              value={selected.metric}
              onValueChange={(value) =>
                setMetric(value as ReportTimeseriesMetric)
              }
            >
              <SelectTrigger className="h-8 w-full min-w-0 sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.metric} value={option.metric}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <StartAndEndDateTimePicker
            value={rangeValue}
            onChange={setRangeValue}
            numberOfMonths={2}
            placeholder="Chọn khoảng thời gian"
            align="end"
            className="shrink-0"
          />
        </div>
      }
    />
  );
}

const VOLUME_OPTIONS: ConversationMetricOption[] = [
  {
    metric: "conversations_count",
    label: "Hội thoại",
    description: "Số hội thoại theo thời gian",
    seriesLabel: "Hội thoại",
    color: "var(--chart-1)",
  },
  {
    metric: "resolutions_count",
    label: "Đã giải quyết",
    description: "Số hội thoại được đánh dấu đã giải quyết",
    seriesLabel: "Đã giải quyết",
    color: "var(--chart-2)",
  },
];

const MESSAGE_OPTIONS: ConversationMetricOption[] = [
  {
    metric: "incoming_messages_count",
    label: "Tin nhắn đến",
    description: "Số tin nhắn nhận vào theo thời gian",
    seriesLabel: "Tin nhắn đến",
    color: "var(--chart-3)",
  },
  {
    metric: "outgoing_messages_count",
    label: "Tin nhắn đi",
    description: "Số tin nhắn gửi đi theo thời gian",
    seriesLabel: "Tin nhắn đi",
    color: "var(--chart-2)",
  },
];

const TIME_OPTIONS: ConversationMetricOption[] = [
  {
    metric: "avg_first_response_time",
    label: "Thời gian phản hồi đầu tiên",
    description: "RTT trung bình theo thời gian",
    seriesLabel: "RTT",
    valueKind: "duration",
    color: "var(--chart-4)",
  },
  {
    metric: "avg_resolution_time",
    label: "Thời gian giải quyết",
    description: "ATTD trung bình theo thời gian",
    seriesLabel: "ATTD",
    valueKind: "duration",
    color: "var(--chart-5)",
  },
  {
    metric: "reply_time",
    label: "Thời gian chờ của khách",
    description: "Thời gian phản hồi trung bình (reply time)",
    seriesLabel: "Thời gian chờ",
    valueKind: "duration",
    color: "var(--chart-1)",
  },
];

/** Hàng trên 50:50 (Hội thoại | Tin nhắn), Thời gian xử lý full-width hàng dưới */
export function ConversationGroupedCharts() {
  return (
    <div className="grid grid-cols-12 gap-5">
      <GroupedConversationChart
        title="Hội thoại"
        options={VOLUME_OPTIONS}
        className="col-span-12 lg:col-span-6"
      />
      <GroupedConversationChart
        title="Tin nhắn"
        options={MESSAGE_OPTIONS}
        className="col-span-12 lg:col-span-6"
      />
      <GroupedConversationChart
        title="Thời gian xử lý"
        options={TIME_OPTIONS}
        className="col-span-12"
      />
    </div>
  );
}
