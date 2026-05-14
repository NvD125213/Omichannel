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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpIcon,
  MapPin,
  Target,
  TrendingUp,
  UserIcon,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

const customerGrowthData = [
  { month: "T1", new: 245, returning: 890, churn: 45 },
  { month: "T2", new: 312, returning: 934, churn: 52 },
  { month: "T3", new: 289, returning: 1023, churn: 38 },
  { month: "T4", new: 456, returning: 1156, churn: 61 },
  { month: "T5", new: 523, returning: 1298, churn: 47 },
  { month: "T6", new: 634, returning: 1445, churn: 55 },
];

const chartConfig = {
  new: {
    label: "Khách hàng mới",
    color: "var(--chart-1)",
  },
  returning: {
    label: "Quay lại",
    color: "var(--chart-2)",
  },
  churn: {
    label: "Rời bỏ",
    color: "var(--chart-3)",
  },
};

const demographicsData = [
  {
    ageGroup: "18-24",
    customers: 2847,
    percentage: "18.0%",
    growth: "+15.2%",
    growthColor: "text-green-600",
  },
  {
    ageGroup: "25-34",
    customers: 4521,
    percentage: "28.5%",
    growth: "+8.7%",
    growthColor: "text-green-600",
  },
  {
    ageGroup: "35-44",
    customers: 3982,
    percentage: "25.1%",
    growth: "+3.4%",
    growthColor: "text-blue-600",
  },
  {
    ageGroup: "45-54",
    customers: 2734,
    percentage: "17.2%",
    growth: "+1.2%",
    growthColor: "text-orange-600",
  },
  {
    ageGroup: "55+",
    customers: 1763,
    percentage: "11.2%",
    growth: "-2.1%",
    growthColor: "text-red-600",
  },
];

const regionsData = [
  {
    region: "Bắc Mỹ",
    customers: 6847,
    revenue: "$847,523",
    growth: "+12.3%",
    growthColor: "text-green-600",
  },
  {
    region: "Châu Âu",
    customers: 4521,
    revenue: "$563,891",
    growth: "+9.7%",
    growthColor: "text-green-600",
  },
  {
    region: "Châu Á - Thái Bình Dương",
    customers: 2892,
    revenue: "$321,456",
    growth: "+18.4%",
    growthColor: "text-blue-600",
  },
  {
    region: "Mỹ Latin",
    customers: 1123,
    revenue: "$187,234",
    growth: "+15.8%",
    growthColor: "text-green-600",
  },
  {
    region: "Khác",
    customers: 464,
    revenue: "$67,891",
    growth: "+5.2%",
    growthColor: "text-orange-600",
  },
];

export function CustomerInsights() {
  const [activeTab, setActiveTab] = useState("growth");

  return (
    <Card className="h-fit bg-linear-to-br from-violet-500/5 via-background to-background border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Phân tích khách hàng</CardTitle>
        <CardDescription>Xu hướng tăng trưởng và nhân khẩu học</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg h-12">
            <TabsTrigger
              value="growth"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <TrendingUp className="size-4" />
              <span className="hidden sm:inline">Tăng trưởng</span>
            </TabsTrigger>
            <TabsTrigger
              value="demographics"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <UserIcon className="size-4" />
              <span className="hidden sm:inline">Nhân khẩu học</span>
            </TabsTrigger>
            <TabsTrigger
              value="regions"
              className="cursor-pointer flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
            >
              <MapPin className="size-4" />
              <span className="hidden sm:inline">Khu vực</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="mt-8 space-y-6">
            <div className="grid gap-6">
              {/* Chart and Key Metrics Side by Side */}
              <div className="grid grid-cols-10 gap-6">
                {/* Chart Area - 70% */}
                <div className="col-span-10 xl:col-span-7">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">
                    Xu hướng tăng trưởng khách hàng
                  </h3>
                  <ChartContainer
                    config={chartConfig}
                    className="h-[375px] w-full"
                  >
                    <BarChart
                      data={customerGrowthData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                      />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: "var(--border)" }}
                        axisLine={{ stroke: "var(--border)" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: "var(--border)" }}
                        axisLine={{ stroke: "var(--border)" }}
                        domain={[0, "dataMax"]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="new"
                        fill="var(--color-new)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="returning"
                        fill="var(--color-returning)"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="churn"
                        fill="var(--color-churn)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Key Metrics - 30% */}
                <div className="col-span-10 xl:col-span-3 space-y-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-6">
                    Chỉ số chính
                  </h3>
                  <div className="grid grid-cols-3 gap-5">
                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="size-4 text-primary" />
                        <span className="text-sm font-medium">
                          Tổng khách hàng
                        </span>
                      </div>
                      <div className="text-2xl font-bold">15,847</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="size-3" />
                        +12.5% so với tháng trước
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          Tỷ lệ giữ chân
                        </span>
                      </div>
                      <div className="text-2xl font-bold">92.4%</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="size-3" />
                        +2.1% cải thiện
                      </div>
                    </div>

                    <div className="p-4 rounded-lg max-lg:col-span-3 xl:col-span-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">LTV trung bình</span>
                      </div>
                      <div className="text-2xl font-bold">$2,847</div>
                      <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <ArrowUpIcon className="size-3" />
                        +8.3% tăng trưởng
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="demographics" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">
                      Nhóm tuổi
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Khách hàng
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Tỷ lệ
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Tăng trưởng
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demographicsData.map((row, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium py-5 px-6">
                        {row.ageGroup}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        {row.customers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        {row.percentage}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>
                          {row.growth}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                Đã chọn 0 / {demographicsData.length} dòng.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Sau
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regions" className="mt-8">
            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="py-5 px-6 font-semibold">
                      Khu vực
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Khách hàng
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Doanh thu
                    </TableHead>
                    <TableHead className="text-right py-5 px-6 font-semibold">
                      Tăng trưởng
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionsData.map((row, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium py-5 px-6">
                        {row.region}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        {row.customers.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        {row.revenue}
                      </TableCell>
                      <TableCell className="text-right py-5 px-6">
                        <span className={`font-medium ${row.growthColor}`}>
                          {row.growth}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-6">
              <div className="text-muted-foreground text-sm hidden sm:block">
                Đã chọn 0 / {regionsData.length} dòng.
              </div>
              <div className="space-x-2 space-y-2">
                <Button variant="outline" size="sm" disabled>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Sau
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
