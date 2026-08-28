"use client";

import { use } from "react";
import { ChannelWidgetLivePage } from "@/features/settings/channel/components/channel-widget-live-page";

export default function WidgetTestLiveRoute({
  params,
}: {
  params: Promise<{ inboxId: string }>;
}) {
  const { inboxId } = use(params);
  return <ChannelWidgetLivePage inboxId={inboxId} />;
}
