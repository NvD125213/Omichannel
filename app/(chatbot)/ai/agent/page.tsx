import { AgentDataListTable } from "@/features/chatbot-kg-core/agent/components/agent-data-list-table";

export default function AgentPage() {
  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <AgentDataListTable />
    </div>
  );
}
