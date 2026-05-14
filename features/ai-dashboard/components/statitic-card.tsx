import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

export interface StatiticCardProps {
  title: string;
  value: ReactNode;
  growth: string | number;
  isGrowth: boolean;
  Icon: LucideIcon;
  comparisonLabel?: string;
  className?: string;
  /** Class nền ô icon (mặc định tím nhạt) */
  iconWrapperClassName?: string;
  /** Class màu icon (mặc định tím) */
  iconClassName?: string;
}

function formatGrowth(growth: string | number, isGrowth: boolean): string {
  if (typeof growth === "string") return growth;
  if (growth === 0) return "0%";
  if (growth > 0) return isGrowth ? `+${growth}%` : `-${growth}%`;
  return `${growth}%`;
}

export default function StatiticCard({
  title,
  value,
  growth,
  isGrowth,
  Icon,
  comparisonLabel = "so với hôm qua",
  className,
  iconWrapperClassName,
  iconClassName,
}: StatiticCardProps) {
  const growthText = formatGrowth(growth, isGrowth);
  const TrendIcon = isGrowth ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border/50 bg-linear-to-br from-violet-500/5 via-background to-background p-6 shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100/90 dark:bg-violet-500/20",
            iconWrapperClassName,
          )}
          aria-hidden
        >
          <Icon
            className={cn(
              "size-5 text-violet-600 dark:text-violet-300",
              iconClassName,
            )}
            strokeWidth={2}
          />
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        <TrendIcon
          className={cn(
            "size-4 shrink-0",
            isGrowth
              ? "text-teal-600 dark:text-teal-400"
              : "text-red-600 dark:text-red-400",
          )}
          aria-hidden
        />
        <span
          className={cn(
            "font-medium",
            isGrowth
              ? "text-teal-600 dark:text-teal-400"
              : "text-red-600 dark:text-red-400",
          )}
        >
          {growthText}
        </span>
        <span className="text-foreground">
          {comparisonLabel}
        </span>
      </div>
    </div>
  );
}
