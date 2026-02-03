import TabsTicketDetail from "@/features/tickets/ticket-detail/components/ticket-detail-tab-bar";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

function TicketDetailPageContent() {
  return <TabsTicketDetail />;
}

export default function TicketDetailPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_TICKETS]}>
      <TicketDetailPageContent />
    </ProtectedRoute>
  );
}
