"use client";

import { use } from "react";
import { TeamFormActionPage } from "@/features/settings/team/components/team-form-action-page";

export default function EditTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  return <TeamFormActionPage teamId={teamId} />;
}
