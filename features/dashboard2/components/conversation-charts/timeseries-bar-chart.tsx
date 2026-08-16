"use client";

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
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import {
  parseTimeseriesBarData,
  pickTimeseriesGroupBy,
} from "@/features/dashboard2/utils/parse-data";
import { useGetReportTimeseries } from "@/hooks/reports/use-reports";
import { cn } from "@/lib/utils";
import { useMemo, type ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type {
  ReportTimeseriesData,
  ReportTimeseriesMetric,
} from "@/services/reports/service";

export type TimeseriesValueKind = "count" | "duration";

export type TimeseriesBarChartProps = {
  since: number;
  until: number;
  metric: ReportTimeseriesMetric;
  title: string;
  description?: string;
  seriesLabel: string;
  emptyLabel?: string;
  errorLabel?: string;
  valueKind?: TimeseriesValueKind;
  timezoneOffset?: string | number;
  className?: string;
  color?: string;
  headerAction?: ReactNode;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(value));

const formatDurationCompact = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return s > 0 ? `${m}p ${s}s` : `${m}p`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}p` : `${h}h`;
};

export function TimeseriesBarChart({
  since,
  until,
  metric,
  title,
  description,
  seriesLabel,
  emptyLabel = "Không có dữ liệu trong khoảng thời gian đã chọn.",
  errorLabel = "Không thể tải dữ liệu biểu đồ.",
  valueKind = "count",
  timezoneOffset = 7,
  className,
  color = "var(--chart-1)",
  headerAction,
}: TimeseriesBarChartProps) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const groupBy = pickTimeseriesGroupBy(since, until);

  const params = useMemo(
    () => ({
      metric,
      type: "account" as const,
      since,
      until,
      group_by: groupBy,
      business_hours: false,
      timezone_offset: timezoneOffset,
    }),
    [metric, since, until, groupBy, timezoneOffset],
  );

  const enabled = !!tenantId && since > 0 && until >= since;

  const { data, isLoading, isFetching, isError } = useGetReportTimeseries(
    tenantId,
    params,
    enabled,
  );

  const chartData = useMemo(() => {
    const payload = data?.data;
    if (!payload || typeof payload !== "object") {
      return parseTimeseriesBarData(null, timezoneOffset, groupBy);
    }
    return parseTimeseriesBarData(
      payload as ReportTimeseriesData,
      timezoneOffset,
      groupBy,
    );
  }, [data, timezoneOffset, groupBy]);

  const chartConfig = {
    value: { label: seriesLabel, color },
  } satisfies ChartConfig;

  const hasData = chartData.some((row) => row.value > 0);
  const showInitialLoading = isLoading && !data;
  const showRefreshing = isFetching && !!data;
  const formatValue =
    valueKind === "duration" ? formatDurationCompact : formatCount;

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/50 bg-card py-0 shadow-sm",
        className,
      )}
    >
      <CardHeader className="px-5 pt-5 pb-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            {description ? (
              <CardDescription>{description}</CardDescription>
            ) : null}
          </div>
          {headerAction ? (
            <div className="shrink-0 sm:pt-0.5">{headerAction}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="relative px-3 pb-5 pt-3 sm:px-5">
        {showInitialLoading ? (
          <Skeleton className="h-56 w-full rounded-lg" />
        ) : isError && !data ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            {errorLabel}
          </p>
        ) : chartData.length === 0 || !hasData ? (
          <p className="text-muted-foreground py-16 text-center text-sm">
            {emptyLabel}
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className={cn(
              "aspect-auto h-56 w-full transition-opacity",
              showRefreshing && "opacity-60",
            )}
          >
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-muted/30"
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                minTickGap={16}
              />
              <YAxis
                allowDecimals={valueKind === "duration"}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11 }}
                width={valueKind === "duration" ? 52 : 36}
                tickFormatter={formatValue}
              />
              <ChartTooltip
                cursor={{ fill: "var(--muted)", opacity: 0.35 }}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold tabular-nums">
                        {formatValue(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                name={seriesLabel}
                fill="var(--color-value)"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
