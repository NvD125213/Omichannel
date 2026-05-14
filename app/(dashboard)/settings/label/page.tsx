import { ContentSection } from "@/components/content-section";
import LabelList from "@/features/settings/label/components/label-list";

export default function LabelPage() {
  return (
    <ContentSection
      title="Danh sách label"
      desc="Quản lý label để phân loại tin nhắn."
      innerClassName="w-full max-w- lg:max-w-none"
    >
      <LabelList />
    </ContentSection>
  );
}
