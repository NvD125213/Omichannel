"use client";

import { TrafficHeatmapChart } from "@/features/dashboard2/components/dashboard-charts/traffic-heatmap-chart";

export type ResolutionTrafficHeatmapChartProps = {
  since: number;
  until: number;
  timezoneOffset?: string | number;
  className?: string;
};

export function ResolutionTrafficHeatmapChart({
  since,
  until,
  timezoneOffset = 7,
  className,
}: ResolutionTrafficHeatmapChartProps) {
  return (
    <TrafficHeatmapChart
      since={since}
      until={until}
      timezoneOffset={timezoneOffset}
      className={className}
      metric="resolutions_count"
      title="Lưu lượng giải quyết theo giờ"
      description="Heatmap số hội thoại đã giải quyết theo khung giờ và ngày"
      unitLabel="đã giải quyết"
      emptyLabel="Chưa có hội thoại nào được giải quyết trong khoảng thời gian này."
      errorLabel="Không thể tải dữ liệu lưu lượng giải quyết."
      ariaLabel="Heatmap lưu lượng giải quyết theo giờ"
      defaultHourMode="all"
    />
  );
}
