"use client";

import { Chat } from "@/features/chats/components/chats";

export default function ChatsPage() {
  return (
    <div
      data-dashboard-inset-flush
      className="h-[calc(100vh-4.4rem)] flex flex-col overflow-hidden @container/main"
    >
      <Chat />
    </div>
  );
}
