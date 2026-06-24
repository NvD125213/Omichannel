"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AgentDataTableToolbarProps {
  title?: string;
  description?: string;
  enabledCount?: number;
  totalCount?: number;
}

export function AgentDataTableToolbar({
  title = "Agent",
  description,
  enabledCount,
  totalCount,
}: AgentDataTableToolbarProps) {
  const showStats =
    enabledCount != null && totalCount != null && totalCount > 0;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
          {title}
        </h2>
        {description && (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="h-8 cursor-pointer rounded-lg px-3"
          asChild
        >
          <Link href="/ai/agent/actions">
            <Plus className="size-4" />
            Thêm agent
          </Link>
        </Button>
      </div>
    </div>
  );
}
