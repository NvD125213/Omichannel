"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState } from "react";

export function HelpSearchHero() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="relative overflow-hidden rounded-xl border bg-linear-to-br from-violet-500/5 via-background to-fuchsia-500/5 p-8 md:p-12">
      <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Chúng tôi có thể giúp gì cho bạn?
        </h1>
        <p className="text-muted-foreground mx-auto max-w-lg text-sm md:text-base">
          Tìm kiếm trong kho tài liệu để xem câu trả lời, hướng dẫn và tài
          liệu hỗ trợ.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              type="search"
              placeholder="Tìm bài viết trợ giúp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-4"
            />
          </div>
          <Button size="lg" className="h-12 px-6">
            Tìm kiếm
          </Button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Tìm kiếm phổ biến:</span>
          {["Bắt đầu", "Cài đặt tài khoản", "Thanh toán", "API"].map(
            (tag) => (
              <button
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="hover:text-foreground rounded-md border bg-background px-2 py-1 transition-colors"
              >
                {tag}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
