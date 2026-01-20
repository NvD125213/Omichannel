"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export function TelesipSDK() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Monkey patch WebSocket as per user requirements
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
          const statusCode = parseInt(statusLine.split(" ")[1]);

          if (statusCode >= 400 && statusCode < 600) {
            console.log("SIP Error:", statusLine);
            console.log("Full SIP message:", event.data);
          }
        }
      });
      return wsInstance;
    };

    return () => {
      (window as any).WebSocket = OriginalWebSocket;
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
          // Initialize key as per script
          window.CGVSDK && (window.CGVSDK.k = "your_api_key");
          console.log("CGV SDK Loaded");

          // Delayed initialization as per script logic (5000ms)
          setTimeout(function () {
            // Ensure SDK is ready (though onLoad guarantees script load, this matches the provided logic flow)
            if (!window.CGVSDK) return;

            // eslint-disable-next-line prefer-const
            let sdkOptions = {
              enableWidget: true,
              sipOnly: true,
              sipDomain: "demo.cgv.vn",
              wsServer: "wss://cgvcall.mobilesip.vn:7444",
              sipPassword: "ldCGV%2025!!!",
            };

            // Create an instance of the SDK
            // eslint-disable-next-line prefer-const
            let cgvSdkInstance = new window.CGVSDK(
              "demo.cgv.vn",
              "xxx",
              "101",
              {},
              sdkOptions,
            );

            // Store instance globally for DashboardHeader button support
            (window as any)._telesipSdkInstance = cgvSdkInstance;

            window.makeCall = function (phoneNumber) {
              cgvSdkInstance.call(phoneNumber, {
                extraHeaders: ["x-PROCESS-ID: 123"],
              });
            };

            // Retain showWidget support for DashboardHeader button
            window.showWidget = function () {
              if (cgvSdkInstance.show) {
                cgvSdkInstance.show();
              } else if (cgvSdkInstance.openWidget) {
                cgvSdkInstance.openWidget();
              } else {
                // Fallback if SDK structure is strictly different but usually one of these exists
                console.log("Widget show method not found on instance");
              }
            };
          }, 5000);
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
