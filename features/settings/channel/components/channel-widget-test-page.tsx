"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface ChannelWidgetTestPageProps {
  inboxId: string;
}

/** Chuyển sang trang demo widget riêng (không iframe, không hiện script). */
export function ChannelWidgetTestPage({ inboxId }: ChannelWidgetTestPageProps) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/widget-test/${inboxId}`);
  }, [inboxId, router]);

  return (
    <div className="flex min-h-80 items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Đang mở sandbox kiểm thử widget...
      </div>
    </div>
  );
}

export default ChannelWidgetTestPage;
