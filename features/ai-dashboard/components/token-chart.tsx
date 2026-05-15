"use client";

import { aiTokenChartConstants } from "@/constants/dashboard/ai-token-chart";
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
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

const BAR_ANIMATION = {
  isAnimationActive: true,
  animationBegin: 0,
  animationDuration: 1100,
  animationEasing: "ease-in-out" as const,
};

type RangeKey = "last7Days" | "last30Days" | "last12Months";

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "last7Days", label: "7 ngày gần nhất" },
  { value: "last30Days", label: "30 ngày gần nhất" },
  { value: "last12Months", label: "12 tháng gần nhất" },
];

const chartConfig = {
  tokens: {
    label: "Lượng token được tiêu thụ",
    color: "#7C3AED",
  },
};

const BAR_INACTIVE = "#DDD6FE";
const BAR_ACTIVE = "#7C3AED";

function buildData(key: RangeKey) {
  if (key === "last7Days") {
    return aiTokenChartConstants.last7Days.map((row) => ({
      name: new Date(`${row.date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      tokens: row.tokens,
    }));
  }
  if (key === "last30Days") {
    return aiTokenChartConstants.last30Days.map((row) => ({
      name: String(row.day),
      tokens: row.tokens,
    }));
  }
  return aiTokenChartConstants.last12Months.map((row) => ({
    name: row.month,
    tokens: row.tokens,
  }));
}

function formatTokensK(value: number) {
  return `${(value / 1000).toFixed(2)}k`;
}

function formatTooltipTokens(value: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  if (value >= 1000) return `${formatTokensK(value)} token`;
  return `${value.toLocaleString("vi-VN")} token`;
}

function formatYAxisTick(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000)
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return value.toLocaleString("vi-VN");
}

function averageTokensK(data: { tokens: number }[]) {
  if (!data.length) return "0,00";
  const avg = data.reduce((s, d) => s + d.tokens, 0) / data.length;
  return (avg / 1000).toLocaleString("vi-VN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function HighlightLabel(props: {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  value?: number;
  index?: number;
  highlightIndex: number;
}) {
  const { x: xRaw, y: yRaw, width: wRaw, value, index, highlightIndex } = props;
  const x = typeof xRaw === "string" ? Number.parseFloat(xRaw) : xRaw;
  const y = typeof yRaw === "string" ? Number.parseFloat(yRaw) : yRaw;
  const width = typeof wRaw === "string" ? Number.parseFloat(wRaw) : wRaw;
  if (
    index !== highlightIndex ||
    x == null ||
    Number.isNaN(x) ||
    y == null ||
    Number.isNaN(y) ||
    width == null ||
    Number.isNaN(width) ||
    value == null
  ) {
    return null;
  }
  const label = `${formatTokensK(value)} token`;
  const boxW = Math.max(88, label.length * 6.5);
  const boxH = 26;
  const boxX = x + width / 2 - boxW / 2;
  const boxY = y - boxH - 8;
  const textY = boxY + boxH / 2 + 4;
  return (
    <g>
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={8}
        fill="#18181b"
      />
      <text
        x={x + width / 2}
        y={textY}
        textAnchor="middle"
        fill="#fafafa"
        fontSize={11}
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}

function HoverReferenceTooltip(
  props: ComponentProps<typeof ChartTooltipContent> & {
    setReferenceY: (y: number | null) => void;
  },
) {
  const { setReferenceY, active, payload, ...rest } = props;

  useEffect(() => {
    const raw = payload?.[0]?.value;
    const y =
      typeof raw === "number" && !Number.isNaN(raw) ? (raw as number) : null;
    setReferenceY(active && y != null ? y : null);
  }, [active, payload, setReferenceY]);

  return <ChartTooltipContent active={active} payload={payload} {...rest} />;
}

export function TokenChart({ className }: { className?: string }) {
  const [range, setRange] = useState<RangeKey>("last7Days");
  const [hoverReferenceY, setHoverReferenceY] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const data = useMemo(() => buildData(range), [range]);

  useEffect(() => {
    setHoverReferenceY(null);
    setHoveredIndex(null);
  }, [range]);

  const highlightIndex = useMemo(() => {
    let max = -Infinity;
    let idx = 0;
    data.forEach((d, i) => {
      if (d.tokens > max) {
        max = d.tokens;
        idx = i;
      }
    });
    return idx;
  }, [data]);

  const maxTokens = data[highlightIndex]?.tokens ?? 0;
  const yDomainMax = useMemo(
    () => Math.max(Math.ceil(maxTokens * 1.15), 1),
    [maxTokens],
  );
  const avgDisplay = useMemo(() => averageTokensK(data), [data]);

  const xAxisInterval =
    range === "last30Days" ? Math.floor(data.length / 6) : 0;

  const barSize =
    range === "last30Days" ? 14 : range === "last12Months" ? 32 : 48;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/50 bg-linear-to-br from-violet-500/5 p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Biểu đồ token A.I
          </h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {avgDisplay}k
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              token trung bình
            </span>
          </p>
        </div>
        <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
          <SelectTrigger
            size="sm"
            className="w-full gap-2 rounded-full border-border/60 bg-background/80 sm:w-[200px]"
          >
            <Calendar className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartContainer config={chartConfig} className="mt-6 h-[320px] w-full">
        <BarChart
          key={range}
          data={data}
          margin={{ top: 48, right: 12, left: 4, bottom: 36 }}
          barCategoryGap="2%"
          barGap={0}
          onMouseMove={(state) => {
            const idx = state?.activeTooltipIndex;
            setHoveredIndex(typeof idx === "number" ? idx : null);
          }}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="#d4d4d8"
            className="dark:stroke-zinc-700"
          />
          <XAxis
            dataKey="name"
            tickLine={{ stroke: "#a1a1aa" }}
            axisLine={{ stroke: "#a1a1aa", strokeWidth: 1 }}
            tick={{ fill: "#71717a", fontSize: 11 }}
            interval={xAxisInterval}
            label={{
              value: "Mốc thời gian",
              position: "insideBottom",
              offset: -8,
              fill: "#71717a",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <YAxis
            width={44}
            domain={[0, yDomainMax]}
            tickLine={{ stroke: "#a1a1aa" }}
            axisLine={{ stroke: "#a1a1aa", strokeWidth: 1 }}
            tick={{ fill: "#71717a", fontSize: 11 }}
            tickFormatter={formatYAxisTick}
            label={{
              value: "Token",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              fill: "#71717a",
              fontSize: 11,
              fontWeight: 500,
            }}
          />
          <ChartTooltip
            cursor={false}
            content={(tp) => (
              <HoverReferenceTooltip
                active={tp.active}
                payload={tp.payload}
                label={tp.label}
                setReferenceY={setHoverReferenceY}
                labelFormatter={(lbl) =>
                  lbl !== undefined && lbl !== null && `${lbl}` !== ""
                    ? `Mốc: ${lbl}`
                    : undefined
                }
                formatter={(val) => formatTooltipTokens(val as number)}
              />
            )}
          />
          <Bar
            name={chartConfig.tokens.label?.toString() ?? "tokens"}
            dataKey="tokens"
            radius={[12, 12, 12, 12]}
            maxBarSize={barSize}
            activeBar={{ opacity: 0.92 }}
            {...BAR_ANIMATION}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={i === highlightIndex ? BAR_ACTIVE : BAR_INACTIVE}
                fillOpacity={
                  hoveredIndex == null ? 1 : i === hoveredIndex ? 1 : 0.72
                }
                style={{ transition: "fill-opacity 220ms ease" }}
              />
            ))}
            {/* <LabelList
              dataKey="tokens"
              position="top"
              content={(labelProps) => (
                <HighlightLabel
                  highlightIndex={highlightIndex}
                  x={labelProps.x}
                  y={labelProps.y}
                  width={labelProps.width}
                  value={
                    typeof labelProps.value === "number"
                      ? labelProps.value
                      : undefined
                  }
                  index={labelProps.index}
                />
              )}
            /> */}
          </Bar>
          {hoverReferenceY != null ? (
            <ReferenceLine
              y={hoverReferenceY}
              stroke="#71717a"
              strokeDasharray="5 5"
              strokeWidth={1.25}
              strokeOpacity={0.9}
              ifOverflow="visible"
              isFront
            />
          ) : null}
        </BarChart>
      </ChartContainer>

      <div className="mt-4 flex items-center gap-2">
        <span
          className="inline-flex size-3 shrink-0 rounded-full border-2 border-blue-500 bg-background"
          aria-hidden
        />
        <span className="text-sm font-medium text-muted-foreground">
          Lượng token được tiêu thụ
        </span>
      </div>
    </div>
  );
}
