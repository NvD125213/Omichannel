import PermissionsMatrix from "@/features/permissions/components/permission-data-table";

export default function PermissionsPage() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen text-foreground animate-in fade-in duration-500">
      <PermissionsMatrix />
    </div>
  );
}
