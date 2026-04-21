import { ContentSection } from "@/components/content-section";
import AgentList from "@/features/settings/agent/components/agent-list";

export default function AgentPage() {
  return (
    <ContentSection
      title="Danh sách đại lý hỗ trợ"
      desc="Đại lý hỗ trợ là thành viên trong nhóm hỗ trợ khách hàng của bạn, người có thể xem và trả lời tin nhắn của người dùng."
      innerClassName="w-full max-w- lg:max-w-none"
    >
      <AgentList />
    </ContentSection>
  );
}
