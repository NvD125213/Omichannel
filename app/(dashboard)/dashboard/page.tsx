"use client";

import { CustomerInsights } from "@/features/dashboard2/components/customer-insights";
import { MetricsOverview } from "@/features/dashboard2/components/matrics-overview";
import { QuickActions } from "@/features/dashboard2/components/quick-actions";
import { RecentTransactions } from "@/features/dashboard2/components/recent-transactions";
import { RevenueBreakdown } from "@/features/dashboard2/components/revenue-breakdown";
import { SalesChart } from "@/features/dashboard2/components/sale-chart";
import { TopProducts } from "@/features/dashboard2/components/top-products";

/**
 * Trang overview — chỉ cần đăng nhập.
 * Phân quyền chi tiết route được enforce bởi `DashboardPermissionGate` (layout).
 */
export default function DashboardPage() {
  return (
    <>
      <div className="px-4 lg:px-6 py-4 flex md:flex-row flex-col md:items-center justify-between gap-2">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Báo cáo kinh doanh
          </h1>
          <p className="text-muted-foreground">
            Kiểm soát hiệu suất kinh doanh và các chỉ số quan trọng trong thời
            gian thực
          </p>
        </div>
        <QuickActions />
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <MetricsOverview />

        <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
          <SalesChart />
          <RevenueBreakdown />
        </div>

        <div className="grid gap-6 grid-cols-1 @5xl:grid-cols-2">
          <RecentTransactions />
          <TopProducts />
        </div>

        <CustomerInsights />
      </div>
    </>
  );
}
