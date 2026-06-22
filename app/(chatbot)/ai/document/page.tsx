import { DocumentDataListTable } from "@/features/chatbot-kg-core/document/components/document-data-list-table";

export default function DocumentPage() {
  return (
    <div className="flex h-full max-h-full min-h-0 flex-col overflow-hidden">
      <DocumentDataListTable />
    </div>
  );
}
