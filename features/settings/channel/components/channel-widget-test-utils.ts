import {
  buildChatEmbedScript,
  DEFAULT_CHAT_PREVIEW_VARIANT,
  resolveChatPreviewFromInbox,
  resolveChatPreviewTemplate,
} from "./chat-preview-config";

export function unwrapInboxRecord(
  response: unknown,
): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  const data = root.data;

  const pickRecord = (value: unknown): Record<string, unknown> | null => {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return null;
    const record = value as Record<string, unknown>;
    if ("name" in record || "channel_type" in record || "id" in record) {
      return record;
    }
    return null;
  };

  const direct = pickRecord(data);
  if (direct) return direct;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    return (
      pickRecord(nested.messaging) ??
      pickRecord(nested.inbox) ??
      pickRecord(nested.payload) ??
      null
    );
  }

  return pickRecord(root);
}

export function pickInboxString(
  sources: Record<string, unknown>[],
  ...keys: string[]
): string {
  for (const source of sources) {
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim();
      }
    }
  }
  return "";
}

export function buildEmbedScriptForInbox(
  inboxRecord: Record<string, unknown> | null,
  widgetAssetsOrigin: string,
): string {
  if (!inboxRecord) return "";

  const channel =
    (inboxRecord.channel as Record<string, unknown> | undefined) ?? {};
  const webWidgetScript = pickInboxString(
    [inboxRecord, channel],
    "web_widget_script",
  );
  if (!webWidgetScript) return "";

  const previewBundle = resolveChatPreviewFromInbox(inboxRecord);
  const template = resolveChatPreviewTemplate(
    previewBundle.variantId || DEFAULT_CHAT_PREVIEW_VARIANT,
    inboxRecord,
  );

  return buildChatEmbedScript(previewBundle.variantId, {
    baseScript: webWidgetScript,
    template,
    data: previewBundle.runtime,
    widgetAssetsOrigin,
  });
}

export function injectEmbedScript(embedScript: string) {
  const injectedScripts: HTMLScriptElement[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(embedScript, "text/html");

  doc.querySelectorAll("script").forEach((node) => {
    const script = document.createElement("script");
    const src = node.getAttribute("src");

    if (src) {
      script.src = src;
      if (node.hasAttribute("async")) script.async = true;
    } else {
      script.text = node.textContent || "";
    }

    document.body.appendChild(script);
    injectedScripts.push(script);
  });

  return () => {
    document.getElementById("omni-fsel-techie-root")?.remove();
    document.getElementById("omni-fsel-techie-style")?.remove();
    document.getElementById("omni-fsel-chatwoot-sdk")?.remove();
    document
      .querySelectorAll('script[data-omni-fsel-widget="1"]')
      .forEach((node) => node.remove());
    document
      .querySelectorAll(
        ".woot-widget-holder,.woot--bubble-holder,.woot-widget-bubble,#woot-widget-holder,#cw-widget-holder",
      )
      .forEach((node) => node.remove());

    delete (window as Window & { __OMNICHANNEL_CHAT_WIDGET__?: unknown })
      .__OMNICHANNEL_CHAT_WIDGET__;
    delete (
      window as Window & { __OMNICHANNEL_CHAT_WIDGET_BOOTSTRAPPED__?: boolean }
    ).__OMNICHANNEL_CHAT_WIDGET_BOOTSTRAPPED__;

    injectedScripts.forEach((script) => script.remove());
  };
}
