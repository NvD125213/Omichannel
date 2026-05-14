"use client";

import { Button } from "@/components/ui/button";
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
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const salesData = [
  { month: "T1", sales: 12500, target: 15000 },
  { month: "T2", sales: 18200, target: 15000 },
  { month: "T3", sales: 16800, target: 15000 },
  { month: "T4", sales: 22400, target: 20000 },
  { month: "T5", sales: 24600, target: 20000 },
  { month: "T6", sales: 28200, target: 25000 },
  { month: "T7", sales: 31500, target: 25000 },
  { month: "T8", sales: 29800, target: 25000 },
  { month: "T9", sales: 33200, target: 30000 },
  { month: "T10", sales: 35100, target: 30000 },
  { month: "T11", sales: 38900, target: 35000 },
  { month: "T12", sales: 42300, target: 35000 },
];

const chartConfig = {
  sales: {
    label: "Doanh số",
    color: "#3b82f6",
  },
  target: {
    label: "Mục tiêu",
    color: "#f59e0b",
  },
};

export function SalesChart() {
  const [timeRange, setTimeRange] = useState("12m");

  return (
    <Card className="cursor-pointer bg-linear-to-br from-violet-500/5 via-background to-background border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 pb-2">
        <div>
          <CardTitle>Hiệu suất bán hàng</CardTitle>
          <CardDescription>So sánh doanh số theo tháng với mục tiêu</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-2 sm:gap-0 w-full sm:w-auto">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-32 cursor-pointer">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3m" className="cursor-pointer">
                3 tháng gần nhất
              </SelectItem>
              <SelectItem value="6m" className="cursor-pointer">
                6 tháng gần nhất
              </SelectItem>
              <SelectItem value="12m" className="cursor-pointer">
                12 tháng gần nhất
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
            Xuất dữ liệu
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0 pt-6">
        <div className="px-3 sm:px-6 pb-6">
          <ChartContainer
            config={chartConfig}
            className="h-[250px] sm:h-[350px] w-full"
          >
            <AreaChart
              data={salesData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-sales)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-target)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-target)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-muted/30"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="target"
                stackId="1"
                stroke="var(--color-target)"
                fill="url(#colorTarget)"
                strokeDasharray="5 5"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="sales"
                stackId="2"
                stroke="var(--color-sales)"
                fill="url(#colorSales)"
                strokeWidth={1}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
