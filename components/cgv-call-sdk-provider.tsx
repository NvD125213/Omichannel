"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";
import { isChatbotPath } from "@/constants/chatbot-routes";
import { useAuth } from "@/contexts/auth-context";
import { useCreateCallLog } from "@/hooks/call-logs/use-call-logs";
import { useMe } from "@/hooks/user/use-me";
import { useGetMyWebcall } from "@/hooks/user/use-get-my-webcall";
import type { CreateCallLogRequest } from "@/services/call-logs/service";
import type { UserWebcallConfig } from "@/services/user/user-current";
import { enableSoftphoneCornerDrag } from "@/components/softphone/widget-corner-drag";
import {
  enableSoftphoneChromeRecovery,
  isSoftphoneTemplateBroken,
  waitForBrowserChromeIdle,
} from "@/components/softphone/widget-chrome-recovery";

declare global {
  interface Window {
    /** Phải khớp modifiers với `components/softphone/telesip-sdk.tsx` (không dùng `?`). */
    CGVSDK: any;
    currentSipCallId?: string;
  }
}

export type CallDirection = "inbound" | "outbound";
export type CallUiStatus = "idle" | "connecting" | "ringing" | "connected";

export interface MakeCallContext {
  customer_id?: string | null;
  ticket_id?: string | null;
  tenant_id?: string | null;
  user_id?: string | null;
  display_name?: string | null;
}

export interface CallSession {
  status: CallUiStatus;
  direction: CallDirection | null;
  phoneNumber: string;
  displayName: string | null;
  muted: boolean;
  connectedAt: number | null;
}

interface CGVCallSDKContextType {
  sdk: any;
  ready: boolean;
  callSession: CallSession;
  makeCall: (phone: string, context?: MakeCallContext) => void;
  hangup: () => void;
  showWidget: () => void;
}

const IDLE_SESSION: CallSession = {
  status: "idle",
  direction: null,
  phoneNumber: "",
  displayName: null,
  muted: false,
  connectedAt: null,
};

const CGVCallSDKContext = createContext<CGVCallSDKContextType | undefined>(
  undefined,
);

const SDK_SCRIPT = "https://sdk.telesip.vn/public/sdk.v2.min.js";
const SDK_STYLES = "https://sdk.telesip.vn/public/styles.css";
/**
 * Grace trước khi destroy SDK khi không còn provider nào mount.
 * Phải đủ dài để survive chuyển route-group (dashboard ↔ chatbot đều
 * force-dynamic, có thể mất >1s) — destroy giữa chừng làm widget vỡ DOM.
 */
const TEARDOWN_GRACE_MS = 3000;
/** Chờ trước khi mở widget / cho phép show — tránh alert/dialog từ SDK lúc boot. */
const WIDGET_BOOT_DELAY_MS = 2000;

/** Bump khi đổi voiceDelegate — ép recreate SDK (tránh HMR giữ callback cũ). */
const VOICE_DELEGATE_BUILD = 6;
const MAX_SDK_CHROME_REMOUNTS = 2;

// singleton
let sharedSdk: any = null;
let sharedReady = false;
let sharedWebcall: UserWebcallConfig | null = null;
let sharedWebcallKey: string | null = null;
/** Widget chỉ được show sau delay boot. */
let sharedWidgetUnlocked = false;
let mountCount = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;
let widgetUnlockTimer: ReturnType<typeof setTimeout> | null = null;
let scriptLoadPromise: Promise<void> | null = null;
/** Action chờ chạy sau khi hết delay boot (vd. makeCall sớm). */
let pendingAfterUnlock: (() => void) | null = null;
let sdkChromeRemounts = 0;
/** Session đã sẵn sàng (đã mount, đã auth) — dùng cho hide/show ngoài React. */
let sharedSessionAllowsWidget = false;

type CreateMutate = (data: CreateCallLogRequest) => void;

const bridges: {
  createMutate: CreateMutate | null;
  currentUser: { id?: string; tenant_id?: string | null } | null | undefined;
  setCallSession: Dispatch<SetStateAction<CallSession>> | null;
  onWidgetUnlocked: (() => void) | null;
} = {
  createMutate: null,
  currentUser: null,
  setCallSession: null,
  onWidgetUnlocked: null,
};

type WindowDialogFns = {
  alert: typeof window.alert;
  confirm: typeof window.confirm;
  prompt: typeof window.prompt;
};

let suppressedDialogs: WindowDialogFns | null = null;

function isWebcallUsable(
  webcall?: UserWebcallConfig | null,
): webcall is UserWebcallConfig {
  if (!webcall) return false;
  const enabled =
    webcall.enable_widget === true || webcall.webphone_enabled === true;
  if (!enabled) return false;
  return Boolean(
    webcall.sip_domain &&
    webcall.sip_extension &&
    webcall.sip_password &&
    webcall.ws_server,
  );
}

function webcallFingerprint(webcall: UserWebcallConfig): string {
  return [
    webcall.sip_domain,
    webcall.sip_username,
    webcall.sip_extension,
    webcall.sip_password,
    webcall.ws_server,
    webcall.enable_widget,
    webcall.sip_only,
    webcall.api_key,
    webcall.webphone_enabled,
  ].join("|");
}

function suppressWindowDialogs() {
  if (typeof window === "undefined" || suppressedDialogs) return;
  suppressedDialogs = {
    alert: window.alert.bind(window),
    confirm: window.confirm.bind(window),
    prompt: window.prompt.bind(window),
  };
  window.alert = () => undefined;
  window.confirm = () => false;
  window.prompt = () => null;
}

function restoreWindowDialogs() {
  if (typeof window === "undefined" || !suppressedDialogs) return;
  window.alert = suppressedDialogs.alert;
  window.confirm = suppressedDialogs.confirm;
  window.prompt = suppressedDialogs.prompt;
  suppressedDialogs = null;
}

function hideWidgetInstance(instance: any) {
  if (!instance) return;
  try {
    if (typeof instance.hide === "function") instance.hide();
    else if (typeof instance.closeWidget === "function") instance.closeWidget();
  } catch {}
}

function showWidgetInstance(instance: any) {
  if (!instance) return;
  if (typeof document !== "undefined") {
    for (const id of ["pwBackground", "ppContainer"]) {
      const el = document.getElementById(id);
      if (!(el instanceof HTMLElement)) continue;
      el.style.removeProperty("display");
      el.style.removeProperty("visibility");
      el.style.removeProperty("pointer-events");
    }
  }
  try {
    if (typeof instance.show === "function") instance.show();
    else if (typeof instance.openWidget === "function") instance.openWidget();
  } catch {}
}

function cancelWidgetUnlockTimer() {
  if (widgetUnlockTimer != null) {
    clearTimeout(widgetUnlockTimer);
    widgetUnlockTimer = null;
  }
}

function cloakWidgetDom() {
  if (typeof document === "undefined") return;
  for (const id of ["pwBackground", "ppContainer"]) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) continue;
    el.style.setProperty("opacity", "0", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }
}

function uncloakWidgetDom() {
  if (typeof document === "undefined") return;
  for (const id of ["pwBackground", "ppContainer"]) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) continue;
    el.style.removeProperty("opacity");
    el.style.removeProperty("pointer-events");
  }
}

function scheduleWidgetUnlock() {
  cancelWidgetUnlockTimer();
  sharedWidgetUnlocked = false;
  suppressWindowDialogs();
  cloakWidgetDom();

  widgetUnlockTimer = setTimeout(() => {
    widgetUnlockTimer = null;
    sharedWidgetUnlocked = true;
    restoreWindowDialogs();
    if (isWidgetAllowedHere()) {
      uncloakWidgetDom();
      restoreWidgetDom();
    }
    bridges.onWidgetUnlocked?.();
    const pending = pendingAfterUnlock;
    pendingAfterUnlock = null;
    pending?.();
  }, WIDGET_BOOT_DELAY_MS);
}

function createSipCallId(): string {
  return crypto.randomUUID();
}

function ensureSdkStyles() {
  if (typeof document === "undefined") return;
  document.getElementById("cgv-sdk-style-overrides")?.remove();
  if (document.querySelector(`link[href="${SDK_STYLES}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = SDK_STYLES;
  document.head.appendChild(link);
}

function teardownSdkInstance(instance: any) {
  if (!instance) return;
  try {
    if (typeof instance.hangup === "function") instance.hangup();
  } catch {}
  try {
    if (typeof instance.hide === "function") instance.hide();
    else if (typeof instance.closeWidget === "function") instance.closeWidget();
    else if (typeof instance.destroy === "function") instance.destroy();
  } catch {}
}

function hideWidgetDom() {
  if (typeof document === "undefined") return;
  for (const id of ["pwBackground", "ppContainer", "pwBackground-drag-ghost"]) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) continue;
    el.style.setProperty("display", "none", "important");
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("pointer-events", "none", "important");
  }
}

/**
 * Các path KHÔNG được hiện widget: auth `(auth)` + trang lỗi `(errors)`.
 * Route group không xuất hiện trên URL nên so theo prefix pathname.
 * Widget chỉ hiện trên `(dashboard)` — chatbot `/ai/*` cũng bị ẩn.
 */
const WIDGET_BLOCKED_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/reset-password",
  "/forbidden",
  "/unauthorized",
  "/not-found",
  "/internal-server-error",
  "/maintenance-error",
] as const;

function isWidgetAllowedOnPath(pathname: string | null | undefined): boolean {
  if (!pathname || pathname === "/") return false;
  if (
    WIDGET_BLOCKED_PATH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  ) {
    return false;
  }
  if (isChatbotPath(pathname)) return false;
  return true;
}

function isWidgetAllowedHere(): boolean {
  if (typeof window === "undefined") return false;
  if (!sharedSessionAllowsWidget) return false;
  return isWidgetAllowedOnPath(window.location.pathname);
}

/**
 * Gỡ các inline style ẩn (`display/visibility/pointer-events !important`)
 * mà `hideWidgetDom` đã set lúc unmount. Không gỡ thì SDK (Vue) toggle
 * display inline thường sẽ thua `!important` → widget nửa ẩn nửa hiện
 * sau khi chuyển giữa 2 hệ thống.
 *
 * Không khôi phục trên các trang bị chặn (auth/errors).
 */
function restoreWidgetDom() {
  if (typeof document === "undefined") return;
  if (!isWidgetAllowedHere()) return;
  for (const id of ["pwBackground", "ppContainer"]) {
    const el = document.getElementById(id);
    if (!(el instanceof HTMLElement)) continue;
    el.style.removeProperty("display");
    el.style.removeProperty("visibility");
    el.style.removeProperty("pointer-events");
  }
  // Ghost drag là tàn dư — luôn xóa khi khôi phục.
  document.getElementById("pwBackground-drag-ghost")?.remove();
}

function removeOrphanedWidgetDom() {
  if (typeof document === "undefined") return;
  const selectors = [
    "#pwBackground",
    "#ppContainer",
    "#pwBackground-drag-ghost",
    "#cgv-widget",
    "#cgv-sdk-widget",
    ".cgv-widget",
    ".cgv-softphone",
    "[id*='cgv-widget']",
    "[class*='cgv-widget']",
    "[id*='telesip']",
    "[class*='telesip']",
  ];
  for (const sel of selectors) {
    document.querySelectorAll(sel).forEach((el) => {
      try {
        el.remove();
      } catch {}
    });
  }
}

function emitSession(updater: SetStateAction<CallSession>) {
  if (bridges.setCallSession) {
    bridges.setCallSession(updater);
  }
}

/** Chỉ cập nhật UI session — không tạo/sửa call log ở đây. */
function buildVoiceDelegate() {
  return {
    onCallCreated: (phone: string) => {
      emitSession((prev) => ({
        status: "connecting",
        direction: "outbound",
        phoneNumber: phone || prev.phoneNumber,
        displayName: prev.displayName,
        muted: false,
        connectedAt: null,
      }));
    },

    onCallReceived: (phone: string) => {
      emitSession({
        status: "ringing",
        direction: "inbound",
        phoneNumber: phone || "",
        displayName: null,
        muted: false,
        connectedAt: null,
      });
    },

    onCallAnswered: (phone: string) => {
      emitSession((prev) => ({
        ...prev,
        status: "connected",
        phoneNumber: phone || prev.phoneNumber,
        connectedAt: Date.now(),
      }));
    },

    onCallHangup: () => {
      emitSession(IDLE_SESSION);
    },

    onCallMute: (muted: boolean) => {
      emitSession((prev) => ({ ...prev, muted: !!muted }));
    },
  };
}

function applySdkApiKey(apiKey?: string | null) {
  if (typeof window === "undefined" || !window.CGVSDK) return;
  window.CGVSDK.k =
    apiKey || process.env.NEXT_PUBLIC_CGV_API_KEY || window.CGVSDK.k;
}

function loadSdkScript(apiKey?: string | null): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.CGVSDK) {
    applySdkApiKey(apiKey);
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SDK_SCRIPT}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => {
        applySdkApiKey(apiKey);
        resolve();
      });
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load CGV SDK")),
      );
      if (window.CGVSDK) {
        applySdkApiKey(apiKey);
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SCRIPT;
    script.async = true;
    script.onload = () => {
      applySdkApiKey(apiKey);
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load CGV SDK"));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

function ensureSharedSdk(webcall: UserWebcallConfig): any {
  if (typeof window === "undefined" || !window.CGVSDK) return null;
  if (!isWebcallUsable(webcall)) return null;

  const nextKey = webcallFingerprint(webcall);
  const prevBuild = (
    window as Window & { __CGV_VOICE_DELEGATE_BUILD__?: number }
  ).__CGV_VOICE_DELEGATE_BUILD__;

  if (
    sharedSdk &&
    (prevBuild !== VOICE_DELEGATE_BUILD || sharedWebcallKey !== nextKey)
  ) {
    destroySharedSdk();
  }

  if (sharedSdk) return sharedSdk;

  ensureSdkStyles();
  applySdkApiKey(webcall.api_key);

  const sipDomain = String(webcall.sip_domain);
  const sipUsername = String(webcall.sip_username || webcall.sip_extension);
  const sipExtension = String(webcall.sip_extension);
  const sipPassword = String(webcall.sip_password);
  const wsServer = String(webcall.ws_server);

  sharedSdk = new window.CGVSDK(
    sipDomain,
    sipUsername,
    sipExtension,
    buildVoiceDelegate(),
    {
      enableWidget: webcall.enable_widget !== false,
      sipOnly: webcall.sip_only !== false,
      sipDomain,
      wsServer,
      sipPassword,
    },
  );

  if (typeof sharedSdk.call === "function") {
    const originalCall = sharedSdk.call.bind(sharedSdk);
    sharedSdk.call = (number: string, options?: Record<string, unknown>) => {
      const nextOptions = {
        ...(options ?? {}),
        params: {
          ...(((options ?? {}).params as Record<string, unknown> | undefined) ??
            {}),
          callId:
            ((options ?? {}).params as Record<string, unknown> | undefined)
              ?.callId ?? window.currentSipCallId,
        },
      };

      return originalCall(number, nextOptions);
    };
  }

  sharedWebcall = webcall;
  sharedWebcallKey = nextKey;
  sharedReady = true;
  (
    window as Window & { __CGV_VOICE_DELEGATE_BUILD__?: number }
  ).__CGV_VOICE_DELEGATE_BUILD__ = VOICE_DELEGATE_BUILD;

  scheduleWidgetUnlock();
  return sharedSdk;
}

function remountSharedSdkAfterChrome(config: UserWebcallConfig): any {
  if (!isSoftphoneTemplateBroken()) return sharedSdk;
  if (sdkChromeRemounts >= MAX_SDK_CHROME_REMOUNTS) return sharedSdk;
  sdkChromeRemounts += 1;
  destroySharedSdk();
  return ensureSharedSdk(config);
}

function destroySharedSdk() {
  cancelWidgetUnlockTimer();
  restoreWindowDialogs();
  sharedWidgetUnlocked = false;
  pendingAfterUnlock = null;
  sharedWebcall = null;
  sharedWebcallKey = null;
  teardownSdkInstance(sharedSdk);
  sharedSdk = null;
  sharedReady = false;
  hideWidgetDom();
  removeOrphanedWidgetDom();
}

function cancelPendingTeardown() {
  if (teardownTimer != null) {
    clearTimeout(teardownTimer);
    teardownTimer = null;
  }
}

export function CGVCallSDKProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const existing = useContext(CGVCallSDKContext);
  if (existing) {
    return <>{children}</>;
  }

  return <CGVCallSDKProviderInner>{children}</CGVCallSDKProviderInner>;
}

function CGVCallSDKProviderInner({ children }: { children: React.ReactNode }) {
  const [sdk, setSdk] = useState<any>(() => sharedSdk);
  const [ready, setReady] = useState<boolean>(() => sharedReady);
  const [widgetUnlocked, setWidgetUnlocked] = useState<boolean>(
    () => sharedWidgetUnlocked,
  );
  const [callSession, setCallSession] = useState<CallSession>(IDLE_SESSION);
  const [isMounted, setIsMounted] = useState(false);

  const pathname = usePathname();
  const { isAuthenticated, isAuthPending, isConnectionError } = useAuth();

  const sessionAllowsWidget =
    isMounted && isAuthenticated && !isAuthPending && !isConnectionError;
  const widgetAllowed =
    sessionAllowsWidget && isWidgetAllowedOnPath(pathname);
  sharedSessionAllowsWidget = sessionAllowsWidget;

  const { data: currentUser } = useMe();
  const { data: webcall, fetchStatus: webcallFetchStatus } = useGetMyWebcall();
  const createCallLog = useCreateCallLog();

  const sdkRef = useRef<any>(sharedSdk);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    bridges.createMutate = (data) => {
      createCallLog.mutate(data);
    };
    bridges.currentUser = currentUser;
    bridges.setCallSession = setCallSession;
    bridges.onWidgetUnlocked = () => setWidgetUnlocked(true);

    return () => {
      if (bridges.setCallSession === setCallSession) {
        bridges.setCallSession = null;
      }
      if (bridges.onWidgetUnlocked) {
        bridges.onWidgetUnlocked = null;
      }
    };
  }, [createCallLog, currentUser, setCallSession]);

  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  // Lifecycle mount — ẩn/destroy khi rời (dashboard)/(chatbot)
  useEffect(() => {
    mountCount += 1;
    cancelPendingTeardown();
    if (typeof document !== "undefined") {
      document.getElementById("cgv-sdk-style-overrides")?.remove();
    }
    // SDK sống ở root — chỉ hiện lại khi đang ở dashboard và session sẵn sàng.
    if (sharedSdk && isWidgetAllowedHere()) {
      restoreWidgetDom();
    } else {
      hideWidgetDom();
    }

    return () => {
      mountCount = Math.max(0, mountCount - 1);

      if (mountCount === 0) {
        hideWidgetInstance(sharedSdk);
        hideWidgetDom();

        cancelPendingTeardown();
        teardownTimer = setTimeout(() => {
          if (mountCount === 0) {
            destroySharedSdk();
            setSdk(null);
            setReady(false);
            setWidgetUnlocked(false);
            setCallSession(IDLE_SESSION);
            sdkRef.current = null;
          }
          teardownTimer = null;
        }, TEARDOWN_GRACE_MS);
      }
    };
  }, []);

  // Boot / recreate SDK từ GET /user/webcall.
  // Không `new CGVSDK` khi Chrome đang mở dialog mật khẩu (mất focus) —
  // Vue inject HTML nhưng không compile → raw `{{ calleeInfo }}`.
  useEffect(() => {
    let cancelled = false;

    if (!widgetAllowed) {
      return;
    }

    if (!isWebcallUsable(webcall)) {
      if (webcallFetchStatus === "fetching") return;
      if (sharedSdk) {
        destroySharedSdk();
        setSdk(null);
        setReady(false);
        setWidgetUnlocked(false);
        sdkRef.current = null;
      }
      return;
    }

    async function boot(config: UserWebcallConfig) {
      try {
        suppressWindowDialogs();
        await loadSdkScript(config.api_key);
        if (cancelled) return;
        if (!sharedSdk) {
          await waitForBrowserChromeIdle();
        }
        if (cancelled) return;
        const instance = ensureSharedSdk(config);
        if (cancelled || !instance) return;
        if (sharedWidgetUnlocked) {
          restoreWidgetDom();
        }
        setSdk(instance);
        setReady(true);
        setWidgetUnlocked(sharedWidgetUnlocked);
        sdkRef.current = instance;
      } catch {
        if (!cancelled) {
          setReady(false);
          restoreWindowDialogs();
        }
      }
    }

    void boot(webcall);

    return () => {
      cancelled = true;
    };
  }, [webcall, webcallFetchStatus, widgetAllowed]);

  useEffect(() => {
    if (!ready || !widgetUnlocked || !widgetAllowed) return;
    const stopDrag = enableSoftphoneCornerDrag();
    const stopChromeRecovery = enableSoftphoneChromeRecovery({
      onBrokenTemplate: () => {
        if (typeof document !== "undefined" && !document.hasFocus()) return;
        const config =
          sharedWebcall ?? (isWebcallUsable(webcall) ? webcall : null);
        if (!config) return;
        const instance = remountSharedSdkAfterChrome(config);
        if (!instance) return;
        setSdk(instance);
        setReady(true);
        setWidgetUnlocked(sharedWidgetUnlocked);
        sdkRef.current = instance;
      },
    });
    return () => {
      stopDrag();
      stopChromeRecovery();
    };
  }, [ready, widgetUnlocked, widgetAllowed, webcall]);

  // Ẩn widget khi reload / đang xác thực / ngoài (dashboard).
  // Không destroy SDK — chỉ toggle DOM để tránh vỡ Vue của TeleSIP.
  useLayoutEffect(() => {
    if (!widgetAllowed) {
      hideWidgetInstance(sharedSdk);
      hideWidgetDom();
      return;
    }
    if (sharedSdk && sharedWidgetUnlocked) {
      restoreWidgetDom();
    }
  }, [widgetAllowed, sdk, ready]);

  const showWidget = useCallback(() => {
    if (!sharedWidgetUnlocked && !widgetUnlocked) return;
    if (!isWidgetAllowedHere()) return;
    const instance = sdkRef.current ?? sharedSdk;
    if (!instance) return;
    showWidgetInstance(instance);
  }, [widgetUnlocked]);

  const makeCall = useCallback(
    (phone: string, context?: MakeCallContext) => {
      const instance = sdkRef.current ?? sharedSdk;
      if (!instance || !phone?.trim()) return;

      const user = bridges.currentUser;
      const phoneNumber = phone.trim();
      const sipCallId = createSipCallId();
      const customer_id = context?.customer_id ?? null;
      const ticket_id = context?.ticket_id ?? null;
      const user_id = context?.user_id ?? user?.id ?? null;
      const sipDomain = sharedWebcall?.sip_domain;

      setCallSession({
        status: "connecting",
        direction: "outbound",
        phoneNumber,
        displayName: context?.display_name ?? null,
        muted: false,
        connectedAt: null,
      });

      // Chỉ tạo call log 1 lần lúc nhấn gọi (nếu tenant bật)
      if (bridges.createMutate && sharedWebcall?.call_log_enabled !== false) {
        bridges.createMutate({
          sip_call_id: sipCallId,
          phone_number: phoneNumber,
          user_id,
          customer_id,
          ticket_id,
        });
      }

      const startCall = () => {
        showWidget();
        if (typeof instance.call === "function") {
          window.currentSipCallId = sipCallId;
          instance.call(phoneNumber, {
            params: {
              callId: sipCallId,
            },
            extraHeaders: [
              "CALL-FROM: CGVSDK",
              ...(sipDomain
                ? [`Route: <sip:${sipDomain};lr;sipml5-outbound;transport=udp>`]
                : []),
            ],
            earlyMedia: true,
          });
        }
      };

      if (!sharedWidgetUnlocked) {
        pendingAfterUnlock = startCall;
        return;
      }

      startCall();
    },
    [showWidget],
  );

  const hangup = useCallback(() => {
    const instance = sdkRef.current ?? sharedSdk;
    if (instance && typeof instance.hangup === "function") {
      instance.hangup();
    }
  }, []);

  const value: CGVCallSDKContextType = useMemo(
    () => ({
      sdk,
      ready,
      callSession,
      makeCall,
      hangup,
      showWidget,
    }),
    [sdk, ready, callSession, makeCall, hangup, showWidget],
  );

  return (
    <CGVCallSDKContext.Provider value={value}>
      {children}
    </CGVCallSDKContext.Provider>
  );
}

export function useCGVCallSDK() {
  const context = useContext(CGVCallSDKContext);

  if (!context) {
    throw new Error("useCGVCallSDK must be used inside CGVCallSDKProvider");
  }

  return context;
}
