"use client";

import { use } from "react";
import { ChannelWidgetTestPage } from "@/features/settings/channel/components/channel-widget-test-page";

export default function ChannelWidgetTestRoute({
  params,
}: {
  params: Promise<{ inboxId: string }>;
}) {
  const { inboxId } = use(params);
  return <ChannelWidgetTestPage inboxId={inboxId} />;
}
