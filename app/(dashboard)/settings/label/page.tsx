import { ContentSection } from "@/components/content-section";
import LabelList from "@/features/settings/label/components/label-list";

export default function LabelPage() {
  return (
    <ContentSection
      title="Danh sách label"
      desc="Quản lý label để phân loại ticket. Bảng màu sử dụng cùng kiểu với màn quản lý tag."
      innerClassName="w-full max-w- lg:max-w-none"
    >
      <LabelList />
    </ContentSection>
  );
}
