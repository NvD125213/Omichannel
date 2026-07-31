"use client";

import { useEffect, useMemo, useState } from "react";
import { Delete, Grid3X3, Mic, MicOff, Phone, PhoneOff } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCGVCallSDK } from "@/components/cgv-call-sdk-provider";

interface CallDialogAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: string;
  userName: string | null;
  onMakeCall: (phoneNumber: string) => void;
}

const DIAL_PAD = [
  { key: "1", letters: "" },
  { key: "2", letters: "ABC" },
  { key: "3", letters: "DEF" },
  { key: "4", letters: "GHI" },
  { key: "5", letters: "JKL" },
  { key: "6", letters: "MNO" },
  { key: "7", letters: "PQRS" },
  { key: "8", letters: "TUV" },
  { key: "9", letters: "WXYZ" },
  { key: "*", letters: "" },
  { key: "0", letters: "+" },
  { key: "#", letters: "" },
] as const;

function formatDuration(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

function DialPadButton({
  digit,
  letters,
  onPress,
}: {
  digit: string;
  letters: string;
  onPress: (digit: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(digit)}
      className="group flex size-12 cursor-pointer flex-col items-center justify-center rounded-full bg-muted/55 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-black/4 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-muted hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_4px_12px_-6px_rgba(0,0,0,0.18)] active:scale-90 dark:bg-white/10 dark:text-white dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] dark:ring-white/10 dark:hover:bg-white/16"
    >
      <span className="text-lg font-medium leading-none tracking-tight transition-transform duration-300 group-active:scale-95">
        {digit}
      </span>
      {letters ? (
        <span className="mt-0.5 text-[8px] font-medium tracking-[0.14em] text-muted-foreground dark:text-white/45">
          {letters}
        </span>
      ) : (
        <span className="mt-0.5 h-2" />
      )}
    </button>
  );
}

function ActionCircle({
  children,
  onClick,
  disabled,
  tone = "muted",
  size = "md",
  ariaLabel,
  pulse,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "green" | "red" | "muted" | "amber";
  size?: "md" | "lg";
  ariaLabel: string;
  pulse?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "relative flex cursor-pointer items-center justify-center rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
        size === "lg" ? "size-14" : "size-11",
        tone === "green" &&
          "bg-emerald-500 text-white shadow-[0_8px_24px_-8px_rgba(16,185,129,0.75)] hover:bg-emerald-600",
        tone === "red" &&
          "bg-red-500 text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.7)] hover:bg-red-600",
        tone === "muted" &&
          "bg-muted/80 text-foreground ring-1 ring-black/4 hover:bg-muted dark:bg-white/12 dark:text-white dark:ring-white/12 dark:hover:bg-white/18",
        tone === "amber" &&
          "bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/25 dark:bg-amber-400/20 dark:text-amber-100 dark:ring-amber-300/30",
        pulse &&
          "after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-emerald-400/30 after:content-['']",
      )}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function CallDialogAlert({
  open,
  onOpenChange,
  onMakeCall,
  phoneNumber,
  userName,
}: CallDialogAlertProps) {
  const { ready, callSession, hangup, accept, reject, toggleMute, sendDTMF } =
    useCGVCallSDK();

  const [draftNumber, setDraftNumber] = useState(phoneNumber);
  const [showKeypad, setShowKeypad] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isInCall = callSession.status !== "idle";
  const trimmedName = (callSession.displayName || userName)?.trim();
  const displayPhone = isInCall
    ? callSession.phoneNumber || draftNumber
    : draftNumber;

  useEffect(() => {
    if (open && !isInCall) {
      setDraftNumber(phoneNumber);
      setShowKeypad(true);
      setElapsedSeconds(0);
    }
  }, [open, phoneNumber, isInCall]);

  useEffect(() => {
    if (callSession.status === "connected") {
      setShowKeypad(false);
    }
  }, [callSession.status]);

  useEffect(() => {
    if (callSession.status !== "connected" || !callSession.connectedAt) {
      setElapsedSeconds(0);
      return;
    }

    const tick = () => {
      setElapsedSeconds(
        Math.floor((Date.now() - (callSession.connectedAt as number)) / 1000),
      );
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [callSession.status, callSession.connectedAt]);

  const statusLabel = useMemo(() => {
    switch (callSession.status) {
      case "connecting":
        return "Calling";
      case "ringing":
        return callSession.direction === "inbound"
          ? "Incoming call"
          : "Calling";
      case "connected":
        return formatDuration(elapsedSeconds);
      default:
        return trimmedName || "Ready";
    }
  }, [callSession.status, callSession.direction, elapsedSeconds, trimmedName]);

  const showIncomingActions =
    callSession.status === "ringing" && callSession.direction === "inbound";
  const showActiveActions =
    callSession.status === "connecting" ||
    callSession.status === "connected" ||
    (callSession.status === "ringing" && callSession.direction === "outbound");
  const showIdleActions = !isInCall;
  const showPad =
    showIdleActions ||
    showKeypad ||
    callSession.status === "connecting" ||
    (callSession.status === "ringing" && callSession.direction === "outbound");

  const isCalling =
    callSession.status === "connecting" ||
    (callSession.status === "ringing" && callSession.direction === "outbound");
  const isConnected = callSession.status === "connected";
  const isIncoming = showIncomingActions;

  const handlePadPress = (digit: string) => {
    if (isInCall && callSession.status === "connected") {
      sendDTMF(digit);
      setDraftNumber((prev) => `${prev}${digit}`);
      return;
    }
    if (isInCall) return;
    setDraftNumber((prev) => `${prev}${digit}`);
  };

  const handleBackspace = () => {
    if (isInCall) return;
    setDraftNumber((prev) => prev.slice(0, -1));
  };

  const handleStartCall = () => {
    const next = draftNumber.trim();
    if (!next || !ready) return;
    onMakeCall(next);
  };

  const handleHangup = () => {
    hangup();
    setShowKeypad(true);
  };

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen && isInCall) {
      hangup();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "gap-0 overflow-hidden rounded-[1.75rem] border-8 border-neutral-950 bg-background p-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.18)] sm:max-w-75",
          "dark:border-slate-400/70 dark:bg-sidebar dark:text-sidebar-foreground dark:shadow-[0_4px_28px_-2px_rgba(255,255,255,0.18)]",
        )}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">
          {isInCall ? "Cuộc gọi" : "Gọi điện"}
        </DialogTitle>
        <DialogDescription className="sr-only">{statusLabel}</DialogDescription>

        <div className="relative px-5 pb-5 pt-6">
          {/* Ambient state glow — light mode only; dark uses sidebar-bg-image */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-28 opacity-90 transition-colors duration-700 dark:hidden",
              isConnected &&
                "bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.18),transparent_70%)]",
              isCalling &&
                "bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.14),transparent_70%)]",
              isIncoming &&
                "bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.2),transparent_70%)]",
              !isInCall &&
                "bg-[radial-gradient(ellipse_at_top,var(--sidebar)_0%,transparent_72%)] opacity-[0.08]",
            )}
          />

          {/* Soft highlight overlay for dark gradient surface */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.14),transparent_55%)] dark:block"
          />

          {/* Number + status */}
          <div className="relative min-h-14 text-center">
            <input
              value={displayPhone}
              onChange={(e) => {
                if (isInCall) return;
                setDraftNumber(e.target.value.replace(/[^\d+*#]/g, ""));
              }}
              onFocus={(e) => {
                const length = e.currentTarget.value.length;
                e.currentTarget.setSelectionRange(length, length);
              }}
              readOnly={isInCall}
              placeholder="Nhập số"
              className="w-full bg-transparent text-center text-[22px] font-semibold! tracking-[0.04em] text-foreground outline-none tabular-nums selection:bg-transparent placeholder:text-muted-foreground/45 dark:text-white dark:placeholder:text-white/35"
              inputMode="tel"
              translate="no"
              aria-label="Số điện thoại"
            />

            <div className="mt-1.5 flex items-center justify-center gap-1.5">
              {isConnected && (
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative size-1.5 rounded-full bg-emerald-400" />
                </span>
              )}
              {(isCalling || isIncoming) && (
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-sky-300 opacity-50" />
                  <span className="relative size-1.5 rounded-full bg-sky-300" />
                </span>
              )}

              <p
                className={cn(
                  "text-sm text-muted-foreground transition-colors duration-300 dark:text-white/65",
                  isConnected &&
                    "font-medium tabular-nums text-emerald-600 dark:text-emerald-300",
                )}
              >
                {statusLabel}
                {(isCalling ||
                  (callSession.status === "ringing" &&
                    callSession.direction === "outbound")) && (
                  <span className="inline-flex w-4 justify-start tracking-tight">
                    <span className="animate-[pulse_1.2s_ease-in-out_infinite]">
                      .
                    </span>
                    <span className="animate-[pulse_1.2s_ease-in-out_0.2s_infinite]">
                      .
                    </span>
                    <span className="animate-[pulse_1.2s_ease-in-out_0.4s_infinite]">
                      .
                    </span>
                  </span>
                )}
              </p>
            </div>

            {showIdleActions && draftNumber.length > 0 && (
              <button
                type="button"
                onClick={handleBackspace}
                className="absolute right-0 top-0 inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground dark:text-white/55 dark:hover:bg-white/12 dark:hover:text-white"
                aria-label="Xóa số"
              >
                <Delete className="size-4" />
              </button>
            )}
          </div>

          {/* Soft separator */}
          <div
            aria-hidden
            className="mx-auto mt-4 h-px w-16 bg-linear-to-r from-transparent via-border to-transparent dark:via-white/25"
          />

          {/* Keypad */}
          {showPad && (
            <div className="mx-auto mt-4 grid w-fit grid-cols-3 gap-x-4 gap-y-3.5">
              {DIAL_PAD.map((item) => (
                <DialPadButton
                  key={item.key}
                  digit={item.key}
                  letters={item.letters}
                  onPress={handlePadPress}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-center gap-8">
            {showIdleActions && (
              <>
                <ActionCircle
                  tone="green"
                  size="lg"
                  disabled={!draftNumber.trim() || !ready}
                  onClick={handleStartCall}
                  ariaLabel="Gọi"
                >
                  <Phone className="size-6" />
                </ActionCircle>
                <ActionCircle
                  tone="red"
                  size="lg"
                  onClick={() => onOpenChange(false)}
                  ariaLabel="Đóng"
                >
                  <PhoneOff className="size-6" />
                </ActionCircle>
              </>
            )}

            {showIncomingActions && (
              <>
                <ActionCircle
                  tone="green"
                  size="lg"
                  onClick={accept}
                  ariaLabel="Nghe máy"
                  pulse
                >
                  <Phone className="size-6" />
                </ActionCircle>
                <ActionCircle
                  tone="red"
                  size="lg"
                  onClick={reject}
                  ariaLabel="Từ chối"
                >
                  <PhoneOff className="size-6" />
                </ActionCircle>
              </>
            )}

            {showActiveActions && (
              <>
                <ActionCircle
                  tone={callSession.muted ? "amber" : "muted"}
                  onClick={toggleMute}
                  ariaLabel={callSession.muted ? "Bật mic" : "Tắt mic"}
                >
                  {callSession.muted ? (
                    <MicOff className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                </ActionCircle>

                {callSession.status === "connected" && (
                  <ActionCircle
                    tone="muted"
                    onClick={() => setShowKeypad((v) => !v)}
                    ariaLabel="Bàn phím số"
                  >
                    <Grid3X3
                      className={cn("size-5", showKeypad && "opacity-100")}
                    />
                  </ActionCircle>
                )}

                <ActionCircle
                  tone="red"
                  size="lg"
                  onClick={handleHangup}
                  ariaLabel="Tắt cuộc gọi"
                >
                  <PhoneOff className="size-6" />
                </ActionCircle>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
