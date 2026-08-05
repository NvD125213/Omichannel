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
import {
  useCreateCallLog,
  useUpdateCallLog,
} from "@/hooks/call-logs/use-call-logs";
import { useMe } from "@/hooks/user/use-me";
import type {
  CreateCallLogRequest,
  UpdateCallLogRequest,
} from "@/services/call-logs/service";

declare global {
  interface Window {
    /** Phải khớp modifiers với `components/softphone/telesip-sdk.tsx` (không dùng `?`). */
    CGVSDK: any;
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

interface ActiveCallState {
  sip_call_id: string;
  phone_number: string;
  started_at: string;
  answered_at?: string;
  direction: CallDirection;
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

const SIP_DOMAIN = "gtg.vn";
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
type UpdateMutate = (vars: {
  sipCallId: string;
  data: UpdateCallLogRequest;
}) => void;

const bridges: {
  createMutate: CreateMutate | null;
  updateMutate: UpdateMutate | null;
  currentUser: { id?: string; tenant_id?: string | null } | null | undefined;
  pendingContext: MakeCallContext | null;
  activeCall: ActiveCallState | null;
  setCallSession: Dispatch<SetStateAction<CallSession>> | null;
} = {
  createMutate: null,
  updateMutate: null,
  currentUser: null,
  pendingContext: null,
  activeCall: null,
  setCallSession: null,
};

function isValidSipCallId(callId?: string | null): boolean {
  return !!callId && callId !== "Unknown";
}

function ensureSdkStyles() {
  if (typeof document === "undefined") return;
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

function buildVoiceDelegate() {
  return {
    onCallCreated: (phone: string, meta?: { callId?: string }) => {
      const sipCallId = meta?.callId;
      if (!isValidSipCallId(sipCallId)) return;

      const ctx = bridges.pendingContext;
      const user = bridges.currentUser;
      const startedAt = new Date().toISOString();
      const phoneNumber = phone || "";

      bridges.activeCall = {
        sip_call_id: sipCallId!,
        phone_number: phoneNumber,
        started_at: startedAt,
        direction: "outbound",
      };

      emitSession((prev) => ({
        status: "connecting",
        direction: "outbound",
        phoneNumber: phoneNumber || prev.phoneNumber,
        displayName: ctx?.display_name ?? prev.displayName,
        muted: false,
        connectedAt: null,
      }));

      if (bridges.createMutate) {
        bridges.createMutate({
          sip_call_id: sipCallId!,
          phone_number: phoneNumber,
          customer_id: ctx?.customer_id ?? null,
          ticket_id: ctx?.ticket_id ?? null,
          user_id: ctx?.user_id ?? user?.id ?? null,
          tenant_id: ctx?.tenant_id ?? user?.tenant_id ?? null,
          direction: "outbound",
          status: "ringing",
          started_at: startedAt,
        });
      }

      bridges.pendingContext = null;
    },

    onCallReceived: (phone: string, meta?: { callId?: string }) => {
      const sipCallId = meta?.callId;
      if (!isValidSipCallId(sipCallId)) return;

      const user = bridges.currentUser;
      const startedAt = new Date().toISOString();
      const phoneNumber = phone || "";

      bridges.activeCall = {
        sip_call_id: sipCallId!,
        phone_number: phoneNumber,
        started_at: startedAt,
        direction: "inbound",
      };

      emitSession({
        status: "ringing",
        direction: "inbound",
        phoneNumber,
        displayName: null,
        muted: false,
        connectedAt: null,
      });

      if (bridges.createMutate) {
        bridges.createMutate({
          sip_call_id: sipCallId!,
          phone_number: phoneNumber,
          customer_id: null,
          ticket_id: null,
          user_id: user?.id ?? null,
          tenant_id: user?.tenant_id ?? null,
          direction: "inbound",
          status: "ringing",
          started_at: startedAt,
        });
      }
    },

    onCallAnswered: (phone: string, meta?: { callId?: string }) => {
      const active = bridges.activeCall;
      const sipCallId = meta?.callId || active?.sip_call_id;
      if (!isValidSipCallId(sipCallId)) return;

      const answeredAt = new Date().toISOString();
      if (active && active.sip_call_id === sipCallId) {
        active.answered_at = answeredAt;
      }

      emitSession((prev) => ({
        ...prev,
        status: "connected",
        phoneNumber: phone || prev.phoneNumber,
        connectedAt: Date.now(),
      }));

      if (bridges.updateMutate) {
        bridges.updateMutate({
          sipCallId: sipCallId!,
          data: { status: "answered" },
        });
      }
    },

    onCallHangup: () => {
      const active = bridges.activeCall;
      if (active?.sip_call_id) {
        const endedAt = new Date();
        const endedAtIso = endedAt.toISOString();
        const durationBase = active.answered_at
          ? new Date(active.answered_at)
          : null;
        const duration = durationBase
          ? Math.max(
              0,
              Math.round((endedAt.getTime() - durationBase.getTime()) / 1000),
            )
          : 0;
        const status = active.answered_at ? "completed" : "missed";

        if (bridges.updateMutate) {
          bridges.updateMutate({
            sipCallId: active.sip_call_id,
            data: {
              status,
              ended_at: endedAtIso,
              duration,
            },
          });
        }
      }

      bridges.activeCall = null;
      bridges.pendingContext = null;
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
  if (sharedSdk) return sharedSdk;
  if (typeof window === "undefined" || !window.CGVSDK) return null;

  ensureSdkStyles();

  sharedSdk = new window.CGVSDK(
    SIP_DOMAIN,
    process.env.NEXT_PUBLIC_SIP_USERNAME,
    "3001",
    buildVoiceDelegate(),
    {
      enableWidget: true,
      sipOnly: true,
      sipDomain: SIP_DOMAIN,
      wsServer: process.env.NEXT_PUBLIC_WS_SERVER,
      sipPassword: process.env.NEXT_PUBLIC_SIP_PASSWORD,
    },
  );
  sharedReady = true;
  return sharedSdk;
}

function destroySharedSdk() {
  teardownSdkInstance(sharedSdk);
  sharedSdk = null;
  sharedReady = false;
  bridges.activeCall = null;
  bridges.pendingContext = null;
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
  const updateCallLog = useUpdateCallLog();

  const sdkRef = useRef<any>(sharedSdk);

  // Bridge chỉ cập nhật trong effect — React Compiler cấm ghi module-scope khi render
  useEffect(() => {
    bridges.createMutate = (data) => {
      createCallLog.mutate(data);
    };
    bridges.updateMutate = (vars) => {
      updateCallLog.mutate(vars);
    };
    bridges.currentUser = currentUser;
    bridges.setCallSession = setCallSession;

    return () => {
      // Tránh gọi setState của instance đã unmount trong grace period
      if (bridges.setCallSession === setCallSession) {
        bridges.setCallSession = null;
      }
    };
  }, [
    createCallLog.mutate,
    updateCallLog.mutate,
    currentUser,
    setCallSession,
  ]);

  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  useEffect(() => {
    let cancelled = false;

    mountCount += 1;
    cancelPendingTeardown();

    if (sharedSdk) {
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
      bridges.pendingContext = {
        customer_id: context?.customer_id ?? null,
        ticket_id: context?.ticket_id ?? null,
        tenant_id: context?.tenant_id ?? user?.tenant_id ?? null,
        user_id: context?.user_id ?? user?.id ?? null,
        display_name: context?.display_name ?? null,
      };

      setCallSession({
        status: "connecting",
        direction: "outbound",
        phoneNumber: phone.trim(),
        displayName: context?.display_name ?? null,
        muted: false,
        connectedAt: null,
      });

      showWidget();
      if (typeof instance.call === "function") {
        instance.call(phone.trim(), {
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
