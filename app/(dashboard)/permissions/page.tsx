import PermissionsMatrix from "@/features/permissions/components/permission-data-table";
import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";

function PermissionsPageContent() {
  return (
    <div className="p-4 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
      <PermissionsMatrix />
    </div>
  );
}

export default function PermissionsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_PERMISSIONS]}>
      <PermissionsPageContent />
    </ProtectedRoute>
  );
}
