"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MessageCircle } from "lucide-react";
import { useGetTenantInbox } from "@/hooks/chatwoot/use-chatwoot";
import { useMe } from "@/hooks/user/use-me";
import {
  buildEmbedScriptForInbox,
  injectEmbedScript,
  pickInboxString,
  unwrapInboxRecord,
} from "./channel-widget-test-utils";

interface ChannelWidgetLivePageProps {
  inboxId: string;
}

export function ChannelWidgetLivePage({ inboxId }: ChannelWidgetLivePageProps) {
  const { data: currentUser } = useMe();
  const tenantId = currentUser?.tenant_id ?? "";

  const { data: inboxResponse, isLoading, isError } = useGetTenantInbox(
    tenantId,
    inboxId,
  );

  const inboxRecord = useMemo(
    () => unwrapInboxRecord(inboxResponse),
    [inboxResponse],
  );

  const channel =
    (inboxRecord?.channel as Record<string, unknown> | undefined) ?? {};
  const sources = inboxRecord ? [inboxRecord, channel] : [];
  const inboxName = pickInboxString(sources, "name") || "Kênh chat";

  const embedScript = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildEmbedScriptForInbox(inboxRecord, window.location.origin);
  }, [inboxRecord]);

  useEffect(() => {
    if (!embedScript.trim()) return;
    const cleanup = injectEmbedScript(embedScript);
    return cleanup;
  }, [embedScript]);

  return (
    <div className="min-h-dvh bg-linear-to-b from-[#f5f7ff] to-[#eef1ff] text-[#1a2456]">
      <div className="mx-auto max-w-3xl px-6 py-10 pb-32">
        <Link
          href="/settings/channel"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#6e85fa] hover:text-[#5568e8]"
        >
          <ArrowLeft className="size-4" />
          Quay lại quản lý kênh
        </Link>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#d4dcfa] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#6e85fa] shadow-[0_8px_22px_rgba(110,133,250,0.12)]">
          <MessageCircle className="size-3.5" />
          Trang demo widget
        </div>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">{inboxName}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#7b88b8]">
          Đây là trang giả lập website khách hàng. Widget FSEL giữ nguyên giao
          diện khung chat tùy chỉnh — thử mở bubble, chọn quick reply và nhắn
          tin.
        </p>

        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 text-sm text-[#7b88b8]">
            <Loader2 className="size-4 animate-spin" />
            Đang tải widget...
          </div>
        ) : null}

        {!isLoading && (isError || !embedScript.trim()) ? (
          <div className="mt-10 rounded-2xl border border-[#d4dcfa] bg-white p-5 text-sm text-[#7b88b8] shadow-[0_12px_32px_rgba(110,133,250,0.12)]">
            Không tải được script widget cho inbox này. Hãy kiểm tra lại cấu
            hình kênh Web Widget hoặc đăng nhập trước khi test.
            <div className="mt-4">
              <Link
                href={`/settings/channel/${inboxId}/edit`}
                className="font-medium text-[#6e85fa] hover:underline"
              >
                Mở cài đặt kênh
              </Link>
            </div>
          </div>
        ) : null}

        {!isLoading && embedScript.trim() ? (
          <div className="mt-10 space-y-4">
            <div className="rounded-2xl border border-[#d4dcfa] bg-white p-5 shadow-[0_12px_32px_rgba(110,133,250,0.12)]">
              <h2 className="text-base font-semibold">Nội dung demo</h2>
              <p className="mt-2 text-sm leading-6 text-[#7b88b8]">
                Trang này chạy widget FSEL tùy chỉnh (không dùng khung Chatwoot
                mặc định). Tin nhắn gửi qua Widget API của Chatwoot.
              </p>
            </div>
            <div className="rounded-2xl border border-dashed border-[#d4dcfa] bg-white/60 p-5 text-sm text-[#7b88b8]">
              Khu vực nội dung website mẫu. Cuộn trang và thử tương tác với
              chatbot ở góc dưới phải.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ChannelWidgetLivePage;
