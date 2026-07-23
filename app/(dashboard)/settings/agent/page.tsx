import { ContentSection } from "@/components/content-section";
import AgentList from "@/features/settings/agent/components/agent-list";

export default function AgentPage() {
  return (
    <ContentSection
      title="Danh sách nhân sự hỗ trợ"
      desc="Nhân sự hỗ trợ là thành viên trong nhóm hỗ trợ khách hàng của bạn, người có thể xem và trả lời tin nhắn của người dùng."
      innerClassName="w-full max-w- lg:max-w-none"
    >
      <AgentList />
    </ContentSection>
  );
}
