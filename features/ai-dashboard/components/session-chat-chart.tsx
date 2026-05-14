"use client";
import { sessionOnlineChartConstants } from "@/constants/dashboard/session-online-chart";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

type RangeKey = "today" | "7d" | "30d";

const chartConfig = {
  sessions: {
    label: "Số phiên",
    color: "#3B82F6",
  },
};

export function SessionChatChart() {
  const [range, setRange] = useState<RangeKey>("7d");

  const data = useMemo<
    {
      label: string;
      sessions: number;
      sessionsLight: number;
      sessionsDark: number;
      date: string;
    }[]
  >(() => {
    const todayDate =
      sessionOnlineChartConstants.last7Days[
        sessionOnlineChartConstants.last7Days.length - 1
      ]?.date ?? "";

    if (range === "today") {
      return sessionOnlineChartConstants.todayByHourCumulative.map((row) => ({
        label: row.hour,
        sessions: row.sessions,
        sessionsLight: row.sessions,
        sessionsDark: row.sessions,
        date: `${todayDate} ${row.hour}`,
      }));
    }
    if (range === "7d") {
      return sessionOnlineChartConstants.last7Days.map((row) => ({
        label: row.label,
        sessions: row.sessions,
        sessionsLight: row.sessions,
        sessionsDark: row.sessions,
        date: row.date,
      }));
    }
    return sessionOnlineChartConstants.month30Days.map((row) => ({
      label: String(row.day),
      sessions: row.sessions,
      sessionsLight: row.sessions,
      sessionsDark: row.sessions,
      date: row.date,
    }));
  }, [range]);

  const latestOnline = data[data.length - 1]?.sessions ?? 0;
  const xAxisInterval = useMemo(() => {
    if (range === "today") return 2;
    if (range === "30d") return Math.max(0, Math.floor(data.length / 7) - 1);
    return 0;
  }, [data.length, range]);

  return (
    <Card className="cursor-pointer bg-linear-to-br from-violet-500/5 via-background to-background border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Số phiên chat đang online</CardTitle>
          <CardDescription>
            Tổng quan theo ngày, hiện tại {latestOnline.toLocaleString("vi-VN")}{" "}
            phiên
          </CardDescription>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger className="w-full sm:w-32 cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today" className="cursor-pointer">
              Today
            </SelectItem>
            <SelectItem value="7d" className="cursor-pointer">
              7 ngày
            </SelectItem>
            <SelectItem value="30d" className="cursor-pointer">
              30 ngày
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-4 pb-2">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
          >
            <defs>
              {/* Light */}
              <linearGradient
                id="sessionAreaGradientLight"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#93C5FD" stopOpacity={0.9} />
                <stop offset="45%" stopColor="#BFDBFE" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#EFF6FF" stopOpacity={0.02} />
              </linearGradient>

              {/* Dark */}
              <linearGradient
                id="sessionAreaGradientDark"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#60A5FA" stopOpacity={0.95} />
                <stop offset="45%" stopColor="#93C5FD" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#DBEAFE" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-muted/40"
            />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              interval={xAxisInterval}
              minTickGap={20}
              tickMargin={10}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const rawDate = payload?.[0]?.payload?.date;
                    if (typeof rawDate !== "string" || rawDate.length < 10) {
                      return undefined;
                    }
                    const [yyyy, mm, dd] = rawDate.slice(0, 10).split("-");
                    const base = `Ngày: ${dd}/${mm}/${yyyy}`;
                    const time = rawDate.slice(11, 16);
                    return time ? `${base} ${time}` : base;
                  }}
                  formatter={(value) =>
                    `${Number(value).toLocaleString("vi-VN")} phiên`
                  }
                />
              }
            />
            <Area
              type="monotone"
              dataKey="sessionsLight"
              stroke="none"
              fill="url(#sessionAreaGradientLight)"
              className="dark:hidden"
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="sessionsDark"
              stroke="none"
              fill="url(#sessionAreaGradientDark)"
              className="hidden dark:block"
              isAnimationActive
              animationDuration={900}
            />
            <Line
              type="monotone"
              dataKey="sessions"
              name="Số phiên"
              stroke="var(--color-sessions)"
              strokeWidth={2.5}
              dot={{ r: 0 }}
              activeDot={{
                r: 5,
                fill: "#60A5FA",
                stroke: "hsl(var(--background))",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
