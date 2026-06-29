"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { PERMISSIONS } from "@/constants/permission";
import { LeadsCustomerFeature } from "@/features/customers/components/leads/leads-data-table";

export default function CustomersLeadsPage() {
  return (
    <ProtectedRoute requiredPermissions={[PERMISSIONS.VIEW_CUSTOMERS]}>
      <LeadsCustomerFeature />
    </ProtectedRoute>
  );
}
