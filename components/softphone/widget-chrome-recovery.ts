import { reapplyStoredSoftphoneCorner } from "@/components/softphone/widget-corner-drag";

const MUSTACHE_RE = /\{\{\s*[\w.$]+\s*\}\}/;
const RECOVER_DEBOUNCE_MS = 80;
const SETTLE_AFTER_FOCUS_MS = 250;

export function isSoftphoneTemplateBroken() {
  if (typeof document === "undefined") return false;
  for (const id of ["pwBackground", "ppContainer"]) {
    const el = document.getElementById(id);
    if (el && MUSTACHE_RE.test(el.textContent ?? "")) return true;
  }
  return false;
}

function isDocumentReadyForVue() {
  if (typeof document === "undefined") return false;
  if (document.visibilityState !== "visible") return false;
  return document.hasFocus();
}

/**
 * Chrome Password Manager (cảnh báo mật khẩu bị lộ) là UI của browser,
 * không phải `alert()`. Nó cướp focus ngay sau login → Vue TeleSIP
 * inject HTML nhưng không compile (raw `{{ calleeInfo }}`, mọi màn
 * chồng lên nhau). Chờ dialog đóng (focus trở lại) rồi mới `new CGVSDK`.
 */
export function waitForBrowserChromeIdle(timeoutMs = 30_000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    let fallbackTimer = 0;

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.setTimeout(resolve, SETTLE_AFTER_FOCUS_MS);
    };

    const onFocus = () => {
      if (isDocumentReadyForVue()) finish();
    };

    fallbackTimer = window.setTimeout(finish, timeoutMs);

    if (isDocumentReadyForVue()) {
      requestAnimationFrame(() => requestAnimationFrame(onFocus));
      return;
    }

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
  });
}

/**
 * Viewport nhảy / dialog Chrome đóng → gỡ tọa độ pixel cũ.
 * Template vỡ thì gọi `onBrokenTemplate` (recreate SDK, không chỉ show()).
 */
export function enableSoftphoneChromeRecovery(options: {
  onBrokenTemplate?: () => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  let timer = 0;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      reapplyStoredSoftphoneCorner();
      if (isSoftphoneTemplateBroken()) {
        options.onBrokenTemplate?.();
      }
    }, RECOVER_DEBOUNCE_MS);
  };

  window.addEventListener("resize", schedule);
  window.addEventListener("focus", schedule);
  document.addEventListener("visibilitychange", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
  schedule();

  return () => {
    window.clearTimeout(timer);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("focus", schedule);
    document.removeEventListener("visibilitychange", schedule);
    window.visualViewport?.removeEventListener("resize", schedule);
    window.visualViewport?.removeEventListener("scroll", schedule);
  };
}
