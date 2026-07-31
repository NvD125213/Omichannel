"use client";

import { AlignLeft, Pencil, Trash2, UsersRound, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyData } from "@/components/empty-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconMoodEmpty } from "@tabler/icons-react";

export interface TeamItem {
  id: string;
  name: string;
  description?: string | null;
  allow_auto_assign?: boolean | null;
  is_member?: boolean;
}

interface TeamListDataProps {
  teams: TeamItem[];
  isLoading?: boolean;
  onEdit?: (team: TeamItem) => void;
  onDelete?: (team: TeamItem) => void;
}

const ICON_COLORS = [
  "bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  "bg-violet-500/15 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400",
];

export function TeamListData({
  teams,
  isLoading,
  onEdit,
  onDelete,
}: TeamListDataProps) {
  if (isLoading) {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-8 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <Skeleton className="h-7 w-7 rounded-md" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-md border bg-transparent py-6 px-4">
        <EmptyData
          icon={IconMoodEmpty}
          title="Chưa có đội nhóm nào."
          description="Hãy tạo đội nhóm mới để bắt đầu quản lý thành viên."
          showButton={false}
          buttonText=""
          onButtonClick={() => {}}
        />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {teams.map((team, index) => {
          const colorIndex = index % ICON_COLORS.length;
          return (
            <Card
              key={team.id}
              className="relative overflow-hidden border py-2"
            >
              <div className="flex h-full flex-col space-y-2.5 p-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ICON_COLORS[colorIndex]}`}
                  >
                    <UsersRound className="size-4" />
                  </div>
                  <span className="truncate text-sm font-semibold">
                    {team.name}
                  </span>
                </div>

                <div className="flex min-h-8 items-start gap-2">
                  <AlignLeft className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/50" />
                  {team.description ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {team.description}
                    </p>
                  ) : (
                    <p className="line-clamp-2 text-xs italic leading-relaxed text-muted-foreground/50">
                      Chưa có mô tả
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-2">
                  {team.allow_auto_assign ? (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-0 bg-blue-500/10 text-[11px] font-medium text-blue-600 hover:bg-blue-500/15 dark:bg-blue-500/15 dark:text-blue-400"
                    >
                      <Zap className="size-3" />
                      Tự động gán
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="gap-1 border-0 bg-muted/50 text-[11px] font-medium text-muted-foreground/60"
                    >
                      Gán thủ công
                    </Badge>
                  )}

                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() => onEdit?.(team)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Chỉnh sửa</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 cursor-pointer text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete?.(team)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Xóa</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
