"use client";

import { Chat } from "@/features/chats/components/chats";

export default function ChatsPage() {
  return (
    <div className="pt-4 h-[calc(100vh-6.5rem)] flex flex-col overflow-hidden @container/main">
      <Chat />
    </div>
  );
}
