"use client";

import { TrafficHeatmapChart } from "@/features/dashboard2/components/dashboard-charts/traffic-heatmap-chart";

export type ConversationTrafficHeatmapChartProps = {
  since: number;
  until: number;
  timezoneOffset?: string | number;
  className?: string;
};

export function ConversationTrafficHeatmapChart({
  since,
  until,
  timezoneOffset = 7,
  className,
}: ConversationTrafficHeatmapChartProps) {
  return (
    <TrafficHeatmapChart
      since={since}
      until={until}
      timezoneOffset={timezoneOffset}
      className={className}
      metric="conversations_count"
      title="Lưu lượng hội thoại theo giờ"
      description="Heatmap số hội thoại theo khung giờ và ngày"
      unitLabel="hội thoại"
      emptyLabel="Chưa có hội thoại nào trong khoảng thời gian này."
      errorLabel="Không thể tải dữ liệu lưu lượng hội thoại."
      ariaLabel="Heatmap lưu lượng hội thoại theo giờ"
      defaultHourMode="all"
    />
  );
}
