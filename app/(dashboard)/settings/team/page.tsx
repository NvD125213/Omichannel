"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Home, Settings, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/breadcrumb";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  useListTenantTeams,
  useDeleteTenantTeam,
} from "@/hooks/chatwoot/use-chatwoot";
import { useAuth } from "@/contexts/auth-context";
import {
  TeamListData,
  type TeamItem,
} from "@/features/settings/team/components/team-list-data";

export default function TeamPage() {
  const router = useRouter();
  const { user } = useAuth();
  const tenantId = user?.tenant_id ?? "";

  const { data, isLoading } = useListTenantTeams(tenantId);

  const rawData = data?.data as
    | { teams?: TeamItem[]; tenant_id?: string }
    | TeamItem[]
    | undefined;
  const teams: TeamItem[] = Array.isArray(rawData)
    ? rawData
    : (rawData?.teams ?? []);

  const deleteTeam = useDeleteTenantTeam();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<TeamItem | null>(null);

  const handleCreate = () => {
    router.push("/settings/team/new");
  };

  const handleEdit = (team: TeamItem) => {
    router.push(`/settings/team/${team.id}/edit`);
  };

  const handleDelete = (team: TeamItem) => {
    setDeletingTeam(team);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTeam) {
      await deleteTeam.mutateAsync({
        tenantId,
        teamId: deletingTeam.id,
      });
      setDeleteOpen(false);
      setDeletingTeam(null);
    }
  };

  return (
    <div className="flex-1 space-y-8 text-foreground animate-in fade-in duration-500 overflow-auto">
      <div className="@container/main space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Quản lý đội nhóm
            </h2>
            <p className="text-sm text-muted-foreground">
              Tạo và quản lý các đội nhóm làm việc trong hệ thống.
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 size-4" />
            Tạo đội nhóm
          </Button>
        </div>

        <TeamListData
          teams={teams}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Xóa đội nhóm"
        description={
          <span>
            Bạn có chắc chắn muốn xóa đội nhóm{" "}
            <span className="font-semibold">{deletingTeam?.name}</span>?
          </span>
        }
        confirmText="Xóa"
        cancelText="Hủy"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
        loading={deleteTeam.isPending}
      />
    </div>
  );
}
