import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AgentDataAction } from "@/features/chatbot-kg-core/agent/components/agent-data-action";

function AgentActionFallback() {
  return (
    <div className="flex h-full max-h-full min-h-0 flex-col gap-3 overflow-hidden px-4 pb-4 pt-2">
      <Skeleton className="h-6 w-64 rounded-lg" />
      <Skeleton className="min-h-0 flex-1 rounded-2xl" />
    </div>
  );
}

export default function AgentActionsPage() {
  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <Suspense fallback={<AgentActionFallback />}>
        <AgentDataAction />
      </Suspense>
    </div>
  );
}
