import { CategoryCards } from "@/features/help-center/components/category-cards";
import { FAQAccordion } from "@/features/help-center/components/faq-accordion";
import { HelpSearchHero } from "@/features/help-center/components/help-search-hero";
import { PopularArticles } from "@/features/help-center/components/popular-articles";

export default function HelpCenterPage() {
  return (
    <>
      <div className="px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Trung tâm trợ giúp</h1>
          <p className="text-muted-foreground">
            Tìm câu trả lời, hướng dẫn và tài liệu hỗ trợ
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-8 pb-8">
        <HelpSearchHero />
        <CategoryCards />
        <PopularArticles />
        <FAQAccordion />
      </div>
    </>
  );
}
