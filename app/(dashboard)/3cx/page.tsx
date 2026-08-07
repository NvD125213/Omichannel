"use client";

const THREE_CX_WEBCLIENT_URL = "https://voip-poc.3cx.asia/webclient/";

export default function ThreeCXPage() {
  return (
    <div
      data-dashboard-inset-flush
      className="flex h-[calc(100vh-4.4rem)] flex-col overflow-hidden"
    >
      <iframe
        src={THREE_CX_WEBCLIENT_URL}
        title="3CX Webclient"
        className="size-full border-0"
        allow="microphone; camera; autoplay; clipboard-read; clipboard-write; display-capture"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
