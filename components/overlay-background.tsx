"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_STORAGE_KEY = "omichannel:overlay-background:dismissed";
const STORAGE_VALUE = "1";

function readDismissed(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === STORAGE_VALUE;
  } catch {
    return false;
  }
}

function writeDismissed(key: string) {
  try {
    window.localStorage.setItem(key, STORAGE_VALUE);
  } catch {
    // Private mode / quota — overlay still closes for this session.
  }
}

export type OverlayBackgroundProps = {
  children: ReactNode;
  title?: string;
  message?: string;
  actionLabel?: string;
  className?: string;
  /** localStorage key — mỗi key chỉ hiện overlay 1 lần trên máy */
  storageKey?: string;
};

export function OverlayBackground({
  children,
  title = "Đang phát triển",
  message = "Đang trong giai đoạn phát triển, dữ liệu được dùng là dữ liệu mẫu",
  actionLabel = "Tiếp tục xem",
  className,
  storageKey = DEFAULT_STORAGE_KEY,
}: OverlayBackgroundProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readDismissed(storageKey));
  }, [storageKey]);

  const handleContinue = () => {
    writeDismissed(storageKey);
    setVisible(false);
  };

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col overflow-hidden", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      {visible ? (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center bg-background/70 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="overlay-background-title"
          aria-describedby="overlay-background-message"
        >
          <div className="border-border/60 bg-card w-full max-w-md rounded-xl border px-6 py-7 text-center shadow-lg">
            <div className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-full">
              <Construction className="size-5" aria-hidden />
            </div>
            <h2
              id="overlay-background-title"
              className="mt-4 text-base font-semibold tracking-tight"
            >
              {title}
            </h2>
            <p
              id="overlay-background-message"
              className="text-muted-foreground mt-2 text-sm leading-6 text-pretty"
            >
              {message}
            </p>
            <Button
              type="button"
              className="mt-5 cursor-pointer"
              onClick={handleContinue}
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OverlayBackground;
