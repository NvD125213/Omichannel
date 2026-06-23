"use client";

import { ArrowLeft, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface WebDataToolbarProps {
  title?: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  linkIcon?: "plus" | "arrow-left";
}

const controlClass =
  "h-8 cursor-pointer rounded-lg text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground/80";

export function WebDataToolbar({
  title = "Web Data",
  description = "Theo dõi và quản lý các trang web đã crawl cho agent",
  href,
  linkLabel,
  linkIcon = "plus",
}: WebDataToolbarProps) {
  const LinkIcon = linkIcon === "arrow-left" ? ArrowLeft : Plus;
  const resolvedLinkLabel =
    linkLabel ??
    (linkIcon === "arrow-left" ? "Quay lại danh sách" : "Dữ liệu web mới");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground/90">
          {title}
        </h2>
        {description ? (
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        ) : null}
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

        {href ? (
          <Button
            type="button"
            size="sm"
            className="h-8 cursor-pointer rounded-lg"
            asChild
          >
            <Link href={href} className="inline-flex items-center gap-2">
              <LinkIcon className="size-4" />
              {resolvedLinkLabel}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
