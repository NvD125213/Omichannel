"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChannelInboxesDataList from "@/features/settings/channel/components/channel-inboxes-data-list";

export default function ChannelPage() {
  const router = useRouter();

  return (
    <div className="flex-1 space-y-6 text-foreground animate-in fade-in duration-500 overflow-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý kênh</h2>
          <p className="text-sm text-muted-foreground">
            Xem và cấu hình các kênh (inbox) đã kết nối với Chatwoot.
          </p>
        </div>
        <Button onClick={() => router.push("/settings/channel/new")}>
          <Plus className="mr-2 size-4" />
          Tạo kênh
        </Button>
      </div>

      <ChannelInboxesDataList />
    </div>
  );
}
