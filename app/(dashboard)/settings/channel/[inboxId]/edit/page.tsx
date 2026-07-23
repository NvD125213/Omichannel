"use client";

import { use } from "react";
import { ChannelInboxesAction } from "@/features/settings/channel/components/channel-inboxes-action";

export default function EditChannelPage({
  params,
}: {
  params: Promise<{ inboxId: string }>;
}) {
  const { inboxId } = use(params);
  return <ChannelInboxesAction inboxId={inboxId} />;
}
