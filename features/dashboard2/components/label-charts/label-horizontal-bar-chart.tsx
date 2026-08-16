"use client";

import {
  GroupedSummaryBarChart,
  type GroupedSummaryBarChartProps,
} from "@/features/dashboard2/components/agent-charts/agent-horizontal-bar-chart";

export type LabelHorizontalBarChartProps = Omit<
  GroupedSummaryBarChartProps,
  "kind"
>;

export function LabelHorizontalBarChart(props: LabelHorizontalBarChartProps) {
  return <GroupedSummaryBarChart kind="label" {...props} />;
}
