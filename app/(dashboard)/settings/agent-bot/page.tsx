import { ContentSection } from "@/components/content-section";
import AgentBotList from "@/features/settings/agent-bot/components/agent-bot-list";

export default function AgentBotPage() {
  return (
    <ContentSection
      title="Danh sách agent bot"
      desc="Agent bot là bot tự động xử lý hội thoại theo webhook và logic tích hợp của bạn."
      innerClassName="w-full max-w- lg:max-w-none"
    >
      <AgentBotList />
    </ContentSection>
  );
}
