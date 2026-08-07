"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useCreateCallLog } from "@/hooks/call-logs/use-call-logs";
import { useMe } from "@/hooks/user/use-me";
import type { CreateCallLogRequest } from "@/services/call-logs/service";
import { enableSoftphoneCornerDrag } from "@/components/softphone/widget-corner-drag";

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

const SIP_DOMAIN = "demo.cgv.vn";
const SIP_EXTENSION = "101";
const SIP_PASSWORD = "ldCGV%2025!!!";
const WS_SERVER = "wss://cgvcall.mobilesip.vn:7444";
const SDK_SCRIPT = "https://sdk.telesip.vn/public/sdk.v2.min.js";
const SDK_STYLES = "https://sdk.telesip.vn/public/styles.css";
const TEARDOWN_GRACE_MS = 800;

// singleton
let sharedSdk: any = null;
let sharedReady = false;
let mountCount = 0;
let teardownTimer: ReturnType<typeof setTimeout> | null = null;
let scriptLoadPromise: Promise<void> | null = null;

type CreateMutate = (data: CreateCallLogRequest) => void;

const bridges: {
  createMutate: CreateMutate | null;
  currentUser: { id?: string; tenant_id?: string | null } | null | undefined;
  setCallSession: Dispatch<SetStateAction<CallSession>> | null;
} = {
  createMutate: null,
  currentUser: null,
  setCallSession: null,
};

/** Bump khi đổi voiceDelegate — ép recreate SDK (tránh HMR giữ callback cũ). */
const VOICE_DELEGATE_BUILD = 5;

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

function removeOrphanedWidgetDom() {
  if (typeof document === "undefined") return;
  const selectors = [
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

function loadSdkScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.CGVSDK) {
    window.CGVSDK.k = process.env.NEXT_PUBLIC_CGV_API_KEY;
    return Promise.resolve();
  }
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${SDK_SCRIPT}"]`,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => {
        if (window.CGVSDK) {
          window.CGVSDK.k = process.env.NEXT_PUBLIC_CGV_API_KEY;
        }
        resolve();
      });
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load CGV SDK")),
      );
      if (window.CGVSDK) {
        window.CGVSDK.k = process.env.NEXT_PUBLIC_CGV_API_KEY;
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SCRIPT;
    script.async = true;
    script.onload = () => {
      if (window.CGVSDK) {
        window.CGVSDK.k = process.env.NEXT_PUBLIC_CGV_API_KEY;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load CGV SDK"));
    document.body.appendChild(script);
  });

  return scriptLoadPromise;
}

function ensureSharedSdk(): any {
  if (typeof window === "undefined" || !window.CGVSDK) return null;

  const prevBuild = (
    window as Window & { __CGV_VOICE_DELEGATE_BUILD__?: number }
  ).__CGV_VOICE_DELEGATE_BUILD__;
  if (sharedSdk && prevBuild !== VOICE_DELEGATE_BUILD) {
    destroySharedSdk();
  }

  if (sharedSdk) return sharedSdk;

  ensureSdkStyles();

  sharedSdk = new window.CGVSDK(
    SIP_DOMAIN,
    process.env.NEXT_PUBLIC_SIP_USERNAME,
    SIP_EXTENSION,
    buildVoiceDelegate(),
    {
      enableWidget: true,
      sipOnly: true,
      sipDomain: SIP_DOMAIN,
      wsServer: WS_SERVER,
      sipPassword: SIP_PASSWORD,
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

  sharedReady = true;
  (
    window as Window & { __CGV_VOICE_DELEGATE_BUILD__?: number }
  ).__CGV_VOICE_DELEGATE_BUILD__ = VOICE_DELEGATE_BUILD;
  return sharedSdk;
}

function destroySharedSdk() {
  teardownSdkInstance(sharedSdk);
  sharedSdk = null;
  sharedReady = false;
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
  const [callSession, setCallSession] = useState<CallSession>(IDLE_SESSION);

  const { data: currentUser } = useMe();
  const createCallLog = useCreateCallLog();

  const sdkRef = useRef<any>(sharedSdk);

  useEffect(() => {
    bridges.createMutate = (data) => {
      createCallLog.mutate(data);
    };
    bridges.currentUser = currentUser;
    bridges.setCallSession = setCallSession;

    return () => {
      if (bridges.setCallSession === setCallSession) {
        bridges.setCallSession = null;
      }
    };
  }, [createCallLog, currentUser, setCallSession]);

  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  useEffect(() => {
    let cancelled = false;

    mountCount += 1;
    cancelPendingTeardown();
    if (typeof document !== "undefined") {
      document.getElementById("cgv-sdk-style-overrides")?.remove();
    }

    if (sharedSdk) {
      ensureSharedSdk();
      setSdk(sharedSdk);
      setReady(true);
      sdkRef.current = sharedSdk;
    }

    async function boot() {
      try {
        await loadSdkScript();
        if (cancelled) return;
        const instance = ensureSharedSdk();
        if (cancelled || !instance) return;
        setSdk(instance);
        setReady(true);
        sdkRef.current = instance;
      } catch {
        if (!cancelled) {
          setReady(false);
        }
      }
    }

    if (!sharedSdk) {
      void boot();
    }

    return () => {
      cancelled = true;
      mountCount = Math.max(0, mountCount - 1);

      if (mountCount === 0) {
        cancelPendingTeardown();
        teardownTimer = setTimeout(() => {
          if (mountCount === 0) {
            destroySharedSdk();
            setSdk(null);
            setReady(false);
            setCallSession(IDLE_SESSION);
            sdkRef.current = null;
          }
          teardownTimer = null;
        }, TEARDOWN_GRACE_MS);
      }
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    return enableSoftphoneCornerDrag();
  }, [ready]);

  const showWidget = useCallback(() => {
    const instance = sdkRef.current ?? sharedSdk;
    if (!instance) return;
    if (typeof instance.show === "function") {
      instance.show();
    } else if (typeof instance.openWidget === "function") {
      instance.openWidget();
    }
  }, []);

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

      setCallSession({
        status: "connecting",
        direction: "outbound",
        phoneNumber,
        displayName: context?.display_name ?? null,
        muted: false,
        connectedAt: null,
      });

      // Chỉ tạo call log 1 lần lúc nhấn gọi
      if (bridges.createMutate) {
        bridges.createMutate({
          sip_call_id: sipCallId,
          phone_number: phoneNumber,
          user_id,
          customer_id,
          ticket_id,
        });
      }

      showWidget();
      if (typeof instance.call === "function") {
        window.currentSipCallId = sipCallId;
        instance.call(phoneNumber, {
          params: {
            callId: sipCallId,
          },
          extraHeaders: [
            "CALL-FROM: CGVSDK",
            `Route: <sip:${SIP_DOMAIN};lr;sipml5-outbound;transport=udp>`,
          ],
          earlyMedia: true,
        });
      }
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
