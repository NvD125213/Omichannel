"use client";

import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { initials, type AgentOption } from "./shared";

export type InboxCollaboratorsTabProps = {
  agents: AgentOption[];
  selectedMemberIds: string[];
  isLoadingAgents: boolean;
  membersHydrated: boolean;
  isBusy: boolean;
  savingMembers: boolean;
  onToggleMember: (agentId: string, checked: boolean) => void;
  onSave: () => void;
};

export function InboxCollaboratorsTab({
  agents,
  selectedMemberIds,
  isLoadingAgents,
  membersHydrated,
  isBusy,
  savingMembers,
  onToggleMember,
  onSave,
}: InboxCollaboratorsTabProps) {
  return (
    <Card className="gap-0 border-border/70 bg-card py-0 shadow-none">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Cộng tác viên</h3>
            <p className="text-sm text-muted-foreground">
              Chọn nhân viên được phép xử lý hội thoại trên kênh này.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedMemberIds.length} đã chọn
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border">
          {isLoadingAgents || !membersHydrated ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                </div>
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Không tìm thấy nhân viên phù hợp.
            </div>
          ) : (
            <ul className="divide-y">
              {agents.map((agent) => {
                const checked = selectedMemberIds.includes(agent.id);
                return (
                  <li key={agent.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40",
                        checked && "bg-primary/5",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={isBusy}
                        onCheckedChange={(value) =>
                          onToggleMember(agent.id, value === true)
                        }
                      />
                      <Avatar className="size-9">
                        {agent.thumbnail ? (
                          <AvatarImage
                            src={agent.thumbnail}
                            alt={agent.name}
                          />
                        ) : null}
                        <AvatarFallback>
                          {initials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {agent.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span translate="no">{agent.email}</span>
                        </p>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button type="button" onClick={() => void onSave()} disabled={isBusy}>
            {savingMembers ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Cập nhật cộng tác viên"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
