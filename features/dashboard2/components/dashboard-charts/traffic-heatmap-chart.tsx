"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/auth-context";
import {
  groupConversationTrafficByHourMode,
  parseConversationTrafficData,
  type ConversationTrafficHourMode,
} from "@/features/dashboard2/utils/parse-data";
import { useGetReportTimeseries } from "@/hooks/reports/use-reports";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import type {
  ReportTimeseriesData,
  ReportTimeseriesMetric,
} from "@/services/reports/service";

export type TrafficHeatmapChartProps = {
  since: number;
  until: number;
  timezoneOffset?: string | number;
  className?: string;
  metric: ReportTimeseriesMetric;
  title: string;
  description?: string;
  unitLabel: string;
  emptyLabel: string;
  errorLabel: string;
  ariaLabel: string;
  defaultHourMode?: ConversationTrafficHourMode;
};

function getCellIntensity(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(0.18, Math.sqrt(value / max));
}

const HOUR_MODE_OPTIONS: {
  value: ConversationTrafficHourMode;
  label: string;
}[] = [
  { value: "all", label: "Theo giờ" },
  { value: "quarter", label: "8 khung" },
  { value: "half", label: "4 khung" },
];

export function TrafficHeatmapChart({
  since,
  until,
  timezoneOffset = 7,
  className,
  metric,
  title,
  description,
  unitLabel,
  emptyLabel,
  errorLabel,
  ariaLabel,
  defaultHourMode = "all",
}: TrafficHeatmapChartProps) {
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";
  const [hourMode, setHourMode] =
    useState<ConversationTrafficHourMode>(defaultHourMode);

  const timeseriesParams = useMemo(
    () => ({
      metric,
      type: "account" as const,
      since,
      until,
      group_by: "hour" as const,
      business_hours: false,
      timezone_offset: timezoneOffset,
    }),
    [metric, since, until, timezoneOffset],
  );

  const enabled = !!tenantId && since > 0 && until >= since;

  const { data, isLoading, isFetching, isError } = useGetReportTimeseries(
    tenantId,
    timeseriesParams,
    enabled,
  );

  const parsed = useMemo(() => {
    const payload = data?.data;
    if (!payload || typeof payload !== "object") {
      return parseConversationTrafficData(null, timezoneOffset);
    }
    return parseConversationTrafficData(
      payload as ReportTimeseriesData,
      timezoneOffset,
    );
  }, [data, timezoneOffset]);

  const display = useMemo(
    () => groupConversationTrafficByHourMode(parsed, hourMode),
    [parsed, hourMode],
  );

  const maxValue = useMemo(() => {
    let max = 0;
    for (const row of display.chartData) {
      for (const series of display.dates) {
        const value = Number(row[series.key] ?? 0);
        if (value > max) max = value;
      }
    }
    return max;
  }, [display]);

  const showInitialLoading = isLoading && !data;
  const showRefreshing = isFetching && !!data;

  return (
    <Card
      className={cn(
        "flex h-full flex-col border-border/50 bg-card py-0 shadow-sm",
        className,
      )}
    >
      <CardHeader className="gap-3 px-4 pt-4 pb-0 sm:px-5 sm:pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">{title}</CardTitle>
            <CardDescription>
              {parsed.timezone ? `Heatmap · ${parsed.timezone}` : description}
            </CardDescription>
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={hourMode}
            onValueChange={(value) => {
              if (!value) return;
              setHourMode(value as ConversationTrafficHourMode);
            }}
            className="w-full justify-start sm:w-auto"
            aria-label="Chế độ gộp giờ"
          >
            {HOUR_MODE_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="flex-1 px-2.5 text-xs sm:flex-none"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </CardHeader>

      <CardContent className="relative px-3 pb-4 pt-3 sm:px-5">
        {showInitialLoading ? (
          <Skeleton className="h-80 w-full rounded-lg" />
        ) : isError && !data ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {errorLabel}
          </p>
        ) : display.chartData.length === 0 || display.dates.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Không có dữ liệu trong khoảng thời gian đã chọn.
          </p>
        ) : (
          <TooltipProvider delayDuration={100}>
            <div
              className={cn(
                "relative transition-opacity",
                showRefreshing && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "overflow-auto rounded-md",
                  hourMode === "all" ? "max-h-100" : "max-h-64",
                )}
              >
                <div
                  className="inline-grid min-w-full gap-0.5"
                  style={{
                    gridTemplateColumns: `2.75rem repeat(${display.dates.length}, minmax(2.25rem, 1fr))`,
                  }}
                  role="table"
                  aria-label={ariaLabel}
                >
                  <div
                    className="sticky top-0 left-0 z-20 h-7 bg-card"
                    aria-hidden="true"
                  />
                  {display.dates.map((series) => (
                    <div
                      key={series.key}
                      className="sticky top-0 z-10 flex h-7 items-end justify-center bg-card pb-1 text-center text-xs font-medium text-muted-foreground"
                      role="columnheader"
                    >
                      {series.label}
                    </div>
                  ))}

                  {display.chartData.map((row) => (
                    <div key={row.hour} className="contents" role="row">
                      <div
                        className="sticky left-0 z-10 flex h-5 items-center justify-end bg-card pr-1.5 text-xs tabular-nums text-muted-foreground"
                        role="rowheader"
                      >
                        {row.hour}
                      </div>
                      {display.dates.map((series) => {
                        const value = Number(row[series.key] ?? 0);
                        const intensity = getCellIntensity(value, maxValue);

                        return (
                          <Tooltip key={`${row.hour}-${series.key}`}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                className={cn(
                                  "h-5 w-full rounded-[3px] border border-transparent transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                  value === 0 && "bg-muted/60",
                                )}
                                style={
                                  value > 0
                                    ? {
                                        backgroundColor: `color-mix(in oklab, var(--chart-1) ${Math.round(intensity * 100)}%, var(--muted))`,
                                      }
                                    : undefined
                                }
                                aria-label={`${series.label} · ${row.hour}: ${value} ${unitLabel}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">
                                {series.label} · {row.hour}
                              </p>
                              <p className="opacity-80">
                                {value} {unitLabel}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                <span>Thấp</span>
                <div className="flex overflow-hidden rounded-sm">
                  {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                    <span
                      key={step}
                      className="size-2.5"
                      style={{
                        backgroundColor:
                          step === 0
                            ? "var(--muted)"
                            : `color-mix(in oklab, var(--chart-1) ${Math.round(step * 100)}%, var(--muted))`,
                      }}
                    />
                  ))}
                </div>
                <span>Cao</span>
                {maxValue > 0 ? (
                  <span className="tabular-nums">(max {maxValue})</span>
                ) : null}
              </div>

              {!display.hasData ? (
                <p className="text-muted-foreground mt-2 text-center text-xs">
                  {emptyLabel}
                </p>
              ) : null}
            </div>

            {showRefreshing ? (
              <p className="text-muted-foreground absolute inset-x-0 top-3 text-center text-[11px]">
                Đang cập nhật…
              </p>
            ) : null}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
