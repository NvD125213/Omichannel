"use client";

import { use } from "react";
import { PublicRatePage } from "@/features/ratings/components/public-rate-page";

export default function RatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <PublicRatePage token={token} />;
}
