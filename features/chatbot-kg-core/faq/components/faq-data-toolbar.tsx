"use client";

import { Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FaqDataToolbarProps {
  title?: string;
  description?: string;
  onAdd?: () => void;
}

const controlClass =
  "h-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground/80";

export function FaqDataToolbar({
  title = "FAQ",
  description = "Theo dõi và quản lý câu hỏi thường gặp của agent",
  onAdd,
}: FaqDataToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
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
          variant="outline"
          size="sm"
          className={controlClass}
        >
          <SlidersHorizontal className="size-4" />
          Lọc
        </Button>
        {onAdd && (
          <Button
            type="button"
            size="sm"
            className="h-8 cursor-pointer rounded-lg"
            onClick={onAdd}
          >
            <Plus className="size-4" />
            Thêm FAQ
          </Button>
        )}
      </div>
    </div>
  );
}
