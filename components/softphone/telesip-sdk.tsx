"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { toast } from "sonner";

export function TelesipSDK() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Monkey patch WebSocket
    const OriginalWebSocket = window.WebSocket;
    (window as any).WebSocket = function (
      url: string | URL,
      protocols?: string | string[],
    ) {
      const wsInstance = new OriginalWebSocket(url, protocols);
      wsInstance.addEventListener("message", function (event) {
        if (typeof event.data === "string") {
          const lines = event.data.split("\r\n");
          const statusLine = lines[0];

          // 1. Detect SIP Errors
          const parts = statusLine.split(" ");
          if (parts.length > 1) {
            const statusCode = parseInt(parts[1]);
            // Filter out 407 (Auth Required) because it's part of normal flow
            if (statusCode >= 400 && statusCode < 600 && statusCode !== 407) {
              console.log("SIP Error:", statusLine);
              toast.error(`Call Error: ${statusLine}`, {
                description: "Vui lòng kiểm tra kết nối hoặc tài khoản.",
              });
              window.dispatchEvent(new CustomEvent("telesip-call-ended"));
            }
          }

          // 2. Detect Hangup (BYE) or busy/unavailable in SIP headers if needed
          // Or we can hook into Console logs if the SDK outputs there
        }
      });
      return wsInstance;
    };

    // Also let's monkey patch console.log to catch "[sip.service]" messages
    // as the SDK logs events there. This is a bit hacky but effective if no event API exists.
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog(...args);
      if (
        args.length > 0 &&
        typeof args[0] === "string" &&
        args[0].includes("[sip.service]")
      ) {
        // SDK log format is usually: [sip.service]:, ["Message content"]
        let sipMessage = "";
        try {
          if (Array.isArray(args[1])) {
            sipMessage = args[1][0];
          } else if (typeof args[1] === "string") {
            sipMessage = args[1];
          } else {
            sipMessage = JSON.stringify(args.slice(1));
          }
        } catch (e) {
          sipMessage = "Sip Event";
        }

        if (sipMessage) {
          // Mapping for standard events to friendlier Vietnamese messages
          let toastContent = sipMessage;
          if (sipMessage === "Call created") {
            toastContent = "Đang kết nối cuộc gọi...";
            window.dispatchEvent(new CustomEvent("telesip-call-started"));
          } else if (sipMessage === "Call hangup") {
            toastContent = "Cuộc gọi đã kết thúc.";
            window.dispatchEvent(new CustomEvent("telesip-call-ended"));
          } else if (sipMessage === "Call accepted") {
            toastContent = "Cuộc gọi đã kết n ối thành công.";
          } else if (
            sipMessage === "Call hangup" ||
            sipMessage === "Call terminated" ||
            sipMessage === "Call ended"
          ) {
            window.dispatchEvent(new CustomEvent("telesip-call-ended"));
          }

          toast.info(toastContent, {
            description: "Sip Service",
            duration: 3000,
          });
        }
      }
    };

    // Masking logic from call.html
    function maskPhone(num: string) {
      if (!num) return "";
      num = num.trim();
      if (num.length <= 5) {
        return num[0] + "*".repeat(num.length - 1);
      }
      const prefix = num.slice(0, -7);
      const lastOne = num.slice(-3);
      return prefix + "****" + lastOne;
    }

    function applyMask(selector: string) {
      const observer = new MutationObserver(() => {
        document.querySelectorAll(selector).forEach((el: any) => {
          if (!el.dataset.masked) {
            // eslint-disable-next-line prefer-const
            let original = el.textContent || el.innerText;
            el.textContent = maskPhone(original);
            el.dataset.masked = "true";
          }
        });
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      document.querySelectorAll(selector).forEach((el: any) => {
        if (!el.dataset.masked) {
          // eslint-disable-next-line prefer-const
          let original = el.textContent || el.innerText;
          el.textContent = maskPhone(original);
          el.dataset.masked = "true";
        }
      });
    }

    applyMask(".pp-phone");
    applyMask(".pp-callee-info");

    return () => {
      window.WebSocket = OriginalWebSocket;
      console.log = originalConsoleLog;
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <>
      <link rel="stylesheet" href="https://sdk.telesip.vn/public/styles.css" />
      <Script
        src="https://sdk.telesip.vn/public/cgvsdk.v1.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("CGV SDK Loaded");

          if (!window.CGVSDK) return;

          // Prevent double initialization
          if ((window as any)._telesipSdkInstance) {
            console.log("Telesip SDK already initialized, skipping init.");
            return;
          }

          window.CGVSDK.k = "your_api_key";

          // Khởi tạo SDK NGAY (không setTimeout)
          const sdkOptions = {
            enableWidget: false,
            sipOnly: true,
            sipDomain: "demo.cgv.vn",
            wsServer: "wss://cgvcall.mobilesip.vn:7444",
            sipPassword: "ldCGV%2025!!!",
          };

          const cgvSdkInstance = new window.CGVSDK(
            "demo.cgv.vn",
            "ldCGV%2025!!!",
            "101",
            {},
            sdkOptions,
          );

          // Store instance globally to prevent garbage collection and ensure singleton
          (window as any)._telesipSdkInstance = cgvSdkInstance;

          window.makeCall = async function (phoneNumber: string) {
            try {
              await navigator.mediaDevices.getUserMedia({ audio: true });

              const instance = (window as any)._telesipSdkInstance;
              if (!instance) return;

              instance.call(phoneNumber, {
                extraHeaders: ["x-PROCESS-ID: 123"],
              });
            } catch (err) {
              console.error("Microphone permission denied", err);
              alert("Vui lòng cho phép microphone để thực hiện cuộc gọi");
            }
          };

          window.hangupCall = function () {
            const instance = (window as any)._telesipSdkInstance;

            if (instance) {
              // Thử các phương thức có thể có trong SDK
              if (instance.hangup) {
                instance.hangup();
              } else if (instance.hangupCall) {
                instance.hangupCall();
              } else if (instance.terminate) {
                instance.terminate();
              } else if (instance.endCall) {
                instance.endCall();
              } else if (instance._currentCall) {
                // Truy cập call instance nội bộ
                const call = instance._currentCall;
                if (call.hangup) call.hangup();
                else if (call.terminate) call.terminate();
              }

              console.log("Hangup called on SDK instance:", instance);
            }
          };
        }}
      />
    </>
  );
}

declare global {
  interface Window {
    CGVSDK: any;
    makeCall: (phoneNumber: string) => void;
    hangupCall: () => void;
    showWidget: () => void;
  }
}
