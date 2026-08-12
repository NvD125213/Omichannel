"use client";

import { OverviewReport } from "@/features/dashboard2/components/overview-report";
import { QuickActions } from "@/features/dashboard2/components/quick-actions";

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
            Báo cáo tổng quan
          </h1>
          <p className="text-muted-foreground">
            Hội thoại, tin nhắn, CSAT và trạng thái realtime theo khoảng thời
            gian
          </p>
        </div>
        <QuickActions />
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6 pb-8">
        <OverviewReport />
      </div>
    </>
  );
}
