"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  useCreateCallLog,
  useUpdateCallLog,
} from "@/hooks/call-logs/use-call-logs";
import { useMe } from "@/hooks/user/use-me";

declare global {
  interface Window {
    CGVSDK: any;
    CgvCallSDK: any;
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
  /** Epoch ms when call was answered (timer base). */
  connectedAt: number | null;
}

interface CGVCallSDKContextType {
  sdk: any;
  ready: boolean;
  callSession: CallSession;
  dialerOpen: boolean;
  dialerPreset: {
    phoneNumber: string;
    userName: string | null;
    context: MakeCallContext | null;
  };
  openDialer: (payload?: {
    phoneNumber?: string;
    userName?: string | null;
    context?: MakeCallContext | null;
  }) => void;
  closeDialer: () => void;
  makeCall: (phone: string, context?: MakeCallContext) => void;
  hangup: () => void;
  accept: () => void;
  reject: () => void;
  toggleMute: () => void;
  sendDTMF: (key: string) => void;
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

function isValidSipCallId(callId?: string | null) {
  return !!callId && callId !== "Unknown";
}

export function CGVCallSDKProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sdk, setSdk] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [callSession, setCallSession] = useState<CallSession>(IDLE_SESSION);
  const [dialerOpen, setDialerOpen] = useState(false);
  const [dialerPreset, setDialerPreset] = useState<{
    phoneNumber: string;
    userName: string | null;
    context: MakeCallContext | null;
  }>({
    phoneNumber: "",
    userName: null,
    context: null,
  });

  const { data: currentUser } = useMe();
  const createCallLog = useCreateCallLog();
  const updateCallLog = useUpdateCallLog();

  const createMutateRef = useRef(createCallLog.mutate);
  const updateMutateRef = useRef(updateCallLog.mutate);
  const currentUserRef = useRef(currentUser);
  const pendingContextRef = useRef<MakeCallContext | null>(null);
  const activeCallRef = useRef<ActiveCallState | null>(null);
  const sdkRef = useRef<any>(null);

  useEffect(() => {
    createMutateRef.current = createCallLog.mutate;
  }, [createCallLog.mutate]);

  useEffect(() => {
    updateMutateRef.current = updateCallLog.mutate;
  }, [updateCallLog.mutate]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    sdkRef.current = sdk;
  }, [sdk]);

  useEffect(() => {
    let cancelled = false;

    function initSDK() {
      if (cancelled || !window.CGVSDK) return;

      const voiceDelegate = {
        onCallCreated: (phone: string, meta?: { callId?: string }) => {
          const sipCallId = meta?.callId;
          if (!isValidSipCallId(sipCallId)) return;

          const ctx = pendingContextRef.current;
          const user = currentUserRef.current;
          const startedAt = new Date().toISOString();
          const phoneNumber = phone || "";

          activeCallRef.current = {
            sip_call_id: sipCallId!,
            phone_number: phoneNumber,
            started_at: startedAt,
            direction: "outbound",
          };

          setCallSession((prev) => ({
            status: "connecting",
            direction: "outbound",
            phoneNumber: phoneNumber || prev.phoneNumber,
            displayName: ctx?.display_name ?? prev.displayName,
            muted: false,
            connectedAt: null,
          }));

          createMutateRef.current({
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

          pendingContextRef.current = null;
        },

        onCallReceived: (phone: string, meta?: { callId?: string }) => {
          const sipCallId = meta?.callId;
          if (!isValidSipCallId(sipCallId)) return;

          const user = currentUserRef.current;
          const startedAt = new Date().toISOString();
          const phoneNumber = phone || "";

          activeCallRef.current = {
            sip_call_id: sipCallId!,
            phone_number: phoneNumber,
            started_at: startedAt,
            direction: "inbound",
          };

          setCallSession({
            status: "ringing",
            direction: "inbound",
            phoneNumber,
            displayName: null,
            muted: false,
            connectedAt: null,
          });
          setDialerOpen(true);
          setDialerPreset({
            phoneNumber,
            userName: null,
            context: null,
          });

          createMutateRef.current({
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
        },

        onCallAnswered: (phone: string, meta?: { callId?: string }) => {
          const active = activeCallRef.current;
          const sipCallId = meta?.callId || active?.sip_call_id;
          if (!isValidSipCallId(sipCallId)) return;

          const answeredAt = new Date().toISOString();
          if (active && active.sip_call_id === sipCallId) {
            active.answered_at = answeredAt;
          }

          setCallSession((prev) => ({
            ...prev,
            status: "connected",
            phoneNumber: phone || prev.phoneNumber,
            connectedAt: Date.now(),
          }));

          updateMutateRef.current({
            sipCallId: sipCallId!,
            data: {
              status: "answered",
            },
          });
        },

        onCallHangup: () => {
          const active = activeCallRef.current;
          if (active?.sip_call_id) {
            const endedAt = new Date();
            const endedAtIso = endedAt.toISOString();
            const durationBase = active.answered_at
              ? new Date(active.answered_at)
              : null;
            const duration = durationBase
              ? Math.max(
                  0,
                  Math.round(
                    (endedAt.getTime() - durationBase.getTime()) / 1000,
                  ),
                )
              : 0;
            const status = active.answered_at ? "completed" : "missed";

            updateMutateRef.current({
              sipCallId: active.sip_call_id,
              data: {
                status,
                ended_at: endedAtIso,
                duration,
              },
            });
          }

          activeCallRef.current = null;
          pendingContextRef.current = null;
          setCallSession(IDLE_SESSION);
          setDialerOpen(false);
        },

        onCallMute: (muted: boolean) => {
          setCallSession((prev) => ({ ...prev, muted: !!muted }));
        },
      };

      const instance = new window.CGVSDK(
        "gtg.vn",
        process.env.NEXT_PUBLIC_SIP_USERNAME,
        "3001",
        voiceDelegate,
        {
          enableWidget: false,
          sipOnly: true,
          sipDomain: "gtg.vn",
          wsServer: process.env.NEXT_PUBLIC_WS_SERVER,
          sipPassword: process.env.NEXT_PUBLIC_SIP_PASSWORD,
        },
      );

      if (cancelled) return;

      setSdk(instance);
      setReady(true);
    }

    if (window.CGVSDK) {
      initSDK();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://sdk.telesip.vn/public/sdk.v2.min.js";
    script.async = true;
    script.onload = () => {
      window.CGVSDK.k = process.env.NEXT_PUBLIC_CGV_API_KEY;
      initSDK();
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  const openDialer = useCallback(
    (payload?: {
      phoneNumber?: string;
      userName?: string | null;
      context?: MakeCallContext | null;
    }) => {
      setDialerPreset({
        phoneNumber: payload?.phoneNumber ?? "",
        userName: payload?.userName ?? null,
        context: payload?.context ?? null,
      });
      setDialerOpen(true);
    },
    [],
  );

  const closeDialer = useCallback(() => {
    if (callSession.status !== "idle") {
      sdkRef.current?.hangup?.();
    }
    setDialerOpen(false);
  }, [callSession.status]);

  const makeCall = useCallback(
    (phone: string, context?: MakeCallContext) => {
      if (!sdk) return;

      const user = currentUserRef.current;
      const mergedContext: MakeCallContext = {
        customer_id:
          context?.customer_id ??
          dialerPreset.context?.customer_id ??
          null,
        ticket_id:
          context?.ticket_id ?? dialerPreset.context?.ticket_id ?? null,
        tenant_id:
          context?.tenant_id ??
          dialerPreset.context?.tenant_id ??
          user?.tenant_id ??
          null,
        user_id:
          context?.user_id ?? dialerPreset.context?.user_id ?? user?.id ?? null,
        display_name:
          context?.display_name ??
          dialerPreset.context?.display_name ??
          dialerPreset.userName ??
          null,
      };

      pendingContextRef.current = mergedContext;

      setCallSession({
        status: "connecting",
        direction: "outbound",
        phoneNumber: phone,
        displayName: mergedContext.display_name ?? null,
        muted: false,
        connectedAt: null,
      });
      setDialerOpen(true);

      sdk.call(phone, {
        extraHeaders: [
          "CALL-FROM: CGVSDK",
          `Route: <sip:gtg.vn;lr;sipml5-outbound;transport=udp>`,
        ],
        earlyMedia: true,
      });
    },
    [sdk, dialerPreset],
  );

  const hangup = useCallback(() => {
    sdkRef.current?.hangup?.();
  }, []);

  const accept = useCallback(() => {
    sdkRef.current?.accept?.();
  }, []);

  const reject = useCallback(() => {
    sdkRef.current?.reject?.();
  }, []);

  const toggleMute = useCallback(() => {
    const instance = sdkRef.current;
    if (!instance) return;
    if (callSession.muted) {
      instance.unmute?.();
    } else {
      instance.mute?.();
    }
  }, [callSession.muted]);

  const sendDTMF = useCallback((key: string) => {
    sdkRef.current?.sendDTMF?.(key);
  }, []);

  const value = useMemo(
    () => ({
      sdk,
      ready,
      callSession,
      dialerOpen,
      dialerPreset,
      openDialer,
      closeDialer,
      makeCall,
      hangup,
      accept,
      reject,
      toggleMute,
      sendDTMF,
    }),
    [
      sdk,
      ready,
      callSession,
      dialerOpen,
      dialerPreset,
      openDialer,
      closeDialer,
      makeCall,
      hangup,
      accept,
      reject,
      toggleMute,
      sendDTMF,
    ],
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
