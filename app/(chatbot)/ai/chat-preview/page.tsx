import { ChatboxPreview } from "@/features/chatbot-kg-core/chat-preview/components/chatbox-preview";

export default function ChatFramePage() {
  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <ChatboxPreview />
    </div>
  );
}
