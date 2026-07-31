"use client";

import { Phone } from "lucide-react";

import { CallDialogAlert } from "@/components/call-dialog-alert";
import { useCGVCallSDK } from "@/components/cgv-call-sdk-provider";
import { cn } from "@/lib/utils";

export function CallSoftphoneHost() {
  const {
    ready,
    callSession,
    dialerOpen,
    dialerPreset,
    closeDialer,
    openDialer,
    makeCall,
  } = useCGVCallSDK();

  const isDialerVisible = dialerOpen || callSession.status !== "idle";

  return (
    <>
      <CallDialogAlert
        open={isDialerVisible}
        onOpenChange={(next) => {
          if (!next) {
            closeDialer();
            return;
          }
          openDialer({
            phoneNumber: dialerPreset.phoneNumber,
            userName: dialerPreset.userName,
            context: dialerPreset.context,
          });
        }}
        phoneNumber={dialerPreset.phoneNumber || callSession.phoneNumber}
        userName={dialerPreset.userName || callSession.displayName}
        onMakeCall={(phone) =>
          makeCall(phone, dialerPreset.context ?? undefined)
        }
      />

      {!isDialerVisible && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() =>
              openDialer({
                phoneNumber: "",
                userName: null,
                context: null,
              })
            }
            disabled={!ready}
            aria-label="Mở bàn phím gọi"
            title={ready ? "Mở dialer" : "Softphone đang kết nối…"}
            className={cn(
              "group relative flex size-12 cursor-pointer items-center justify-center rounded-full",
              "border border-white/20 text-white",
              "bg-sidebar [background-image:var(--sidebar-bg-image,none)]",
              "shadow-[0_10px_28px_-10px_rgba(0,0,0,0.55)]",
              "transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
              "hover:scale-105 hover:border-white/35 hover:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.6)]",
              "active:scale-95",
              "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:scale-100",
            )}
          >
            {/* Soft radiating ring */}
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 rounded-full border",
                "border-sidebar/50 dark:border-white/35",
                "animate-[ping_2.2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-45 dark:opacity-40",
              )}
            />

            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.28),transparent_60%)]"
            />

            <Phone
              className="relative size-5 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:rotate-12 group-active:rotate-0"
              strokeWidth={2.25}
            />

            <span
              aria-hidden
              className={cn(
                "absolute right-0.5 top-0.5 size-2 rounded-full ring-2 ring-background transition-colors duration-300",
                ready
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)]"
                  : "animate-pulse bg-amber-300",
              )}
            />
          </button>
        </div>
      )}
    </>
  );
}
