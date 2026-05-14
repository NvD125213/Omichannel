import StatiticCard from "@/features/ai-dashboard/components/statitic-card";
import { TokenChart } from "@/features/ai-dashboard/components/token-chart";
import { SessionChatChart } from "@/features/ai-dashboard/components/session-chat-chart";
import { customerCountCardConstants } from "@/constants/dashboard/customer-count-card";
import { customerOnlineCardConstants } from "@/constants/dashboard/customer-online-card";
import { sessionChatCardConstants } from "@/constants/dashboard/session-chat-card";
import { tokenUsedCardConstants } from "@/constants/dashboard/token-used-card";
import { ReplyChatPizzaChart } from "@/features/ai-dashboard/components/reply-chat-pizza-chart";
import { StatisticOnUserChart } from "@/features/ai-dashboard/components/statistic-on-user-chart";
import { TopicFavouriteTabs } from "@/features/ai-dashboard/components/topic-favourite-tabs";
import { MessageSquare, Radio, Sparkles, Users } from "lucide-react";

function formatInt(value: number) {
  return value.toLocaleString("vi-VN");
}

export default function AIDashboardPage() {
  return (
    <>
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">AI Dashboard</h1>
          <p className="text-muted-foreground">
            Tổng quan số liệu chatbot và AI
          </p>
        </div>
      </div>

      <div className="@container/main space-y-4 px-4 pb-6 sm:space-y-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatiticCard
            title={customerCountCardConstants.name}
            value={formatInt(customerCountCardConstants.total)}
            growth={customerCountCardConstants.growth}
            isGrowth={customerCountCardConstants.isGrowthPositive}
            Icon={Users}
            iconWrapperClassName="bg-sky-100 dark:bg-sky-950/50"
            iconClassName="text-sky-600 dark:text-sky-400"
          />
          <StatiticCard
            title={customerOnlineCardConstants.name}
            value={formatInt(customerOnlineCardConstants.total)}
            growth={customerOnlineCardConstants.downdayGrowth}
            isGrowth={customerOnlineCardConstants.isGrowthPositive}
            Icon={Radio}
            iconWrapperClassName="bg-emerald-100 dark:bg-emerald-950/50"
            iconClassName="text-emerald-600 dark:text-emerald-400"
          />
          <StatiticCard
            title={sessionChatCardConstants.name}
            value={formatInt(sessionChatCardConstants.total)}
            growth={sessionChatCardConstants.growth}
            isGrowth={sessionChatCardConstants.isGrowthPositive}
            Icon={MessageSquare}
            iconWrapperClassName="bg-amber-100 dark:bg-amber-950/50"
            iconClassName="text-amber-600 dark:text-amber-400"
          />
          <StatiticCard
            title={tokenUsedCardConstants.name}
            value={tokenUsedCardConstants.total.toLocaleString("vi-VN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            growth={tokenUsedCardConstants.growth}
            isGrowth={!tokenUsedCardConstants.isGrowthNegative}
            Icon={Sparkles}
            iconWrapperClassName="bg-rose-100 dark:bg-rose-950/50"
            iconClassName="text-rose-600 dark:text-rose-400"
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <TokenChart />
          <SessionChatChart />
        </div>

        <div className="grid gap-4 xl:grid-cols-10">
          <div className="xl:col-span-4">
            <ReplyChatPizzaChart />
          </div>
          <div className="xl:col-span-6">
            <StatisticOnUserChart />
          </div>
        </div>

        <TopicFavouriteTabs />
      </div>
    </>
  );
}
