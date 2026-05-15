"use client";

import { replyByBotOrUserChatConstants } from "@/constants/dashboard/reply-by-bot-or-user-chat";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarClock, CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { Cell, Pie, PieChart } from "recharts";

const chartConfig = {
  value: {
    label: "Số lượt phản hồi",
  },
  bot: {
    label: "Bot",
    color: "#3B82F6",
  },
  user: {
    label: "Người dùng",
    color: "#F59E0B",
  },
  unHandled: {
    label: "Chưa xử lý",
    color: "#EF4444",
  },
};

function formatDateTime(raw: string) {
  const isoLike = raw.replace(" ", "T");
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDateTimeLocalValue(raw: string) {
  const isoLike = raw.replace(" ", "T");
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ReplyChatPizzaChart() {
  const [preset, setPreset] = useState<"day" | "week" | "month">("day");
  const data = useMemo(
    () => [
      {
        key: "bot",
        name: "Bot xử lý",
        value: replyByBotOrUserChatConstants.bot,
        color: chartConfig.bot.color,
      },
      {
        key: "user",
        name: "Người xử lý",
        value: replyByBotOrUserChatConstants.user,
        color: "#6EE7B7",
      },
      {
        key: "unHandled",
        name: "Chưa xử lý",
        value: replyByBotOrUserChatConstants.unHandled,
        color: chartConfig.unHandled.color,
      },
    ],
    [],
  );

  const totalReplies = useMemo(
    () => data.reduce((acc, item) => acc + item.value, 0),
    [data],
  );

  const [timeFrom, setTimeFrom] = useState(
    toDateTimeLocalValue(replyByBotOrUserChatConstants.timeToStart),
  );
  const [timeTo, setTimeTo] = useState(
    toDateTimeLocalValue(replyByBotOrUserChatConstants.timeToEnd),
  );

  const timeRangeLabel = useMemo(() => {
    if (!timeFrom || !timeTo) return "Chọn khoảng thời gian";
    return `${formatDateTime(timeFrom)} - ${formatDateTime(timeTo)}`;
  }, [timeFrom, timeTo]);

  return (
    <Card className="h-full border-border/50 bg-linear-to-br from-fuchsia-500/5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-col gap-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle>Phản hồi tin nhắn</CardTitle>
          {/* <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1">
            <Button
              type="button"
              size="sm"
              variant={preset === "day" ? "secondary" : "ghost"}
              className="h-8 rounded-lg px-3 text-sm"
              onClick={() => setPreset("day")}
            >
              Ngày
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preset === "week" ? "secondary" : "ghost"}
              className="h-8 rounded-lg px-3 text-sm"
              onClick={() => setPreset("week")}
            >
              Tuần
            </Button>
            <Button
              type="button"
              size="sm"
              variant={preset === "month" ? "secondary" : "ghost"}
              className="h-8 rounded-lg px-3 text-sm"
              onClick={() => setPreset("month")}
            >
              Tháng
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-8 rounded-lg"
            >
              <CalendarDays className="size-4 text-muted-foreground" />
            </Button>
          </div> */}
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={timeFrom}
              onChange={(e) => setTimeFrom(e.target.value)}
              className="h-9 pl-9"
              aria-label="Thời gian bắt đầu"
            />
          </div>
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={timeTo}
              onChange={(e) => setTimeTo(e.target.value)}
              className="h-9 pl-9"
              aria-label="Thời gian kết thúc"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-7">
          <div className="flex items-center justify-center">
            <div className="relative">
              <ChartContainer
                config={chartConfig}
                className="mx-auto h-[190px] w-[190px] sm:h-[230px] sm:w-[230px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => {
                          const count = Number(value);
                          const pct =
                            totalReplies > 0 ? (count / totalReplies) * 100 : 0;
                          return `${name}: ${count.toLocaleString("vi-VN")} (${pct.toFixed(1)}%)`;
                        }}
                      />
                    }
                  />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={98}
                    paddingAngle={0}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold leading-none">
                  {totalReplies}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {data.map((item) => {
              const pct =
                totalReplies > 0 ? (item.value / totalReplies) * 100 : 0;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block size-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium leading-none">
                        {item.name}
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xl font-semibold leading-none">
                    {item.value.toLocaleString("vi-VN")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
