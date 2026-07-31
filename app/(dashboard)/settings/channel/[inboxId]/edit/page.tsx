"use client";

import { use } from "react";
import { ChannelInboxesActionPatch } from "@/features/settings/channel/components/channel-inboxes-action-patch";

export default function EditChannelPage({
  params,
}: {
  params: Promise<{ inboxId: string }>;
}) {
  const { inboxId } = use(params);
  return <ChannelInboxesActionPatch inboxId={inboxId} />;
}
