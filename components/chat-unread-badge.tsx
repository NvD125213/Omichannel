import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatUnreadBadgeCount } from "@/features/chats/utils/chat-unread-store";

interface ChatUnreadBadgeProps {
  count: number;
  className?: string;
}

export function ChatUnreadBadge({ count, className }: ChatUnreadBadgeProps) {
  if (count <= 0) return null;

  return (
    <Badge
      variant="default"
      className={cn(
        "min-w-[20px] h-5 px-1.5 text-xs font-medium shrink-0",
        className,
      )}
    >
      {formatUnreadBadgeCount(count)}
    </Badge>
  );
}
