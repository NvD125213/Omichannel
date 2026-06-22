"use client";

import { AnimatePresence, motion, animate } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SidebarDetailSide = "left" | "right";

const OPEN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CLOSE_EASE: [number, number, number, number] = [0.4, 0, 0.2, 1];

const PANEL_WIDTH_OPEN_DURATION = 1.05;
const PANEL_WIDTH_CLOSE_DURATION = 1.05;

const PANEL_CONTENT_ENTER = {
  duration: 0.55,
  ease: OPEN_EASE,
};

const PANEL_CONTENT_EXIT = {
  duration: 0.55,
  ease: CLOSE_EASE,
};

const OVERLAY_ENTER = {
  duration: 0.72,
  ease: OPEN_EASE,
};

const OVERLAY_EXIT = {
  duration: 0.72,
  ease: CLOSE_EASE,
};

const panelHeaderClass =
  "relative shrink-0 overflow-hidden border-b border-primary/10 bg-accent/60 px-5 pb-5 pt-5 text-accent-foreground shadow-sm backdrop-blur-sm dark:border-sidebar-border/40 dark:bg-primary/15 dark:text-sidebar-primary-foreground";

interface SidebarDetailContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width: number;
  minWidth: number;
  maxWidth: number;
  side: SidebarDetailSide;
}

const SidebarDetailContext =
  React.createContext<SidebarDetailContextValue | null>(null);

function useSidebarDetail() {
  const context = React.useContext(SidebarDetailContext);
  if (!context) {
    throw new Error(
      "SidebarDetail components must be used within SidebarDetail",
    );
  }
  return context;
}

interface SidebarDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  side?: SidebarDetailSide;
  className?: string;
  children: React.ReactNode;
}

function SidebarDetail({
  open,
  onOpenChange,
  width = 40,
  minWidth = 24,
  maxWidth = 60,
  side = "right",
  className,
  children,
}: SidebarDetailProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widthAnimationRef = React.useRef<ReturnType<typeof animate> | null>(
    null,
  );
  const prevOpenRef = React.useRef(false);
  const animatedPanelWidthRef = React.useRef(0);
  const [panelWidth, setPanelWidth] = React.useState(width);
  const [animatedPanelWidth, setAnimatedPanelWidth] = React.useState(0);
  const [isResizing, setIsResizing] = React.useState(false);
  const [panelLayoutActive, setPanelLayoutActive] = React.useState(open);

  const setAnimatedWidth = React.useCallback((next: number) => {
    animatedPanelWidthRef.current = next;
    setAnimatedPanelWidth(next);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      open,
      onOpenChange,
      width,
      minWidth,
      maxWidth,
      side,
    }),
    [open, onOpenChange, width, minWidth, maxWidth, side],
  );

  const main = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === SidebarDetailMain,
  );

  const panel = React.Children.toArray(children).find(
    (child) => React.isValidElement(child) && child.type === SidebarDetailPanel,
  );

  React.useEffect(() => {
    widthAnimationRef.current?.stop();

    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (open && !wasOpen) {
      setPanelLayoutActive(true);
      setPanelWidth(width);
      setAnimatedWidth(0);

      widthAnimationRef.current = animate(0, width, {
        duration: PANEL_WIDTH_OPEN_DURATION,
        ease: OPEN_EASE,
        onUpdate: (latest) => setAnimatedWidth(latest),
      });
    } else if (!open && wasOpen) {
      widthAnimationRef.current = animate(animatedPanelWidthRef.current, 0, {
        duration: PANEL_WIDTH_CLOSE_DURATION,
        ease: OPEN_EASE,
        onUpdate: (latest) => setAnimatedWidth(latest),
        onComplete: () => setPanelLayoutActive(false),
      });
    } else if (open) {
      setPanelWidth(width);
      setAnimatedWidth(width);
    }

    return () => {
      widthAnimationRef.current?.stop();
    };
  }, [open, width, setAnimatedWidth]);

  const handleResizeStart = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;

      const containerWidth = container.getBoundingClientRect().width;
      const startX = event.clientX;
      const startWidth = panelWidth;

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaPx =
          side === "right"
            ? startX - moveEvent.clientX
            : moveEvent.clientX - startX;
        const deltaPercent = (deltaPx / containerWidth) * 100;
        const next = Math.min(
          maxWidth,
          Math.max(minWidth, startWidth + deltaPercent),
        );
        setPanelWidth(next);
        setAnimatedWidth(next);
      };

      const onMouseUp = () => {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [panelWidth, minWidth, maxWidth, side, setAnimatedWidth],
  );

  const mainColumn = (
    <div className="relative h-full max-h-full min-h-0 min-w-0 overflow-hidden">
      <AnimatePresence>
        {panelLayoutActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: OVERLAY_ENTER }}
            exit={{ opacity: 0, transition: OVERLAY_EXIT }}
            className="pointer-events-none absolute inset-0 z-10"
          />
        )}
      </AnimatePresence>
      {main}
    </div>
  );

  const panelColumn = panelLayoutActive ? (
    <div className="relative h-full max-h-full min-h-0 min-w-0 overflow-hidden">
      <div className="absolute inset-0 min-h-0 overflow-hidden p-2">
        {" "}
        {/* Thêm p-2 để lộ lớp shadow ngoài */}
        <button
          type="button"
          aria-label="Điều chỉnh độ rộng"
          onMouseDown={handleResizeStart}
          className={cn(
            "group absolute inset-y-0 z-30 flex w-3 cursor-col-resize items-center justify-center border-0 bg-transparent p-0 outline-none",
            side === "right"
              ? "left-2 -translate-x-1/2"
              : "right-2 left-auto translate-x-1/2",
          )}
        >
          <span className="flex h-9 w-4 items-center justify-center rounded-full bg-background opacity-0 ring-1 ring-border shadow-md transition-opacity duration-300 group-hover:opacity-100 dark:bg-popover">
            <GripVertical className="size-2.5 text-muted-foreground" />
          </span>
        </button>
        <aside className="flex h-full min-h-0 flex-col overflow-hidden">
          {/* CẢI TIẾN THỊ GIÁC Ở ĐÂY: Thêm border rõ ràng, tăng shadow-xl gắt hơn để tạo độ nổi */}
          <div
            className={cn(
              "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl",
              "bg-card text-card-foreground border border-border/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]",
              "dark:bg-zinc-900/95 dark:border-zinc-800 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]",
            )}
          >
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[calc(1rem-0.125rem)] bg-background dark:bg-zinc-950">
              {panel}
            </div>
          </div>
        </aside>
      </div>
    </div>
  ) : null;

  const gridPanelWidth = isResizing ? panelWidth : animatedPanelWidth;
  const gridTemplateColumns = panelLayoutActive
    ? side === "right"
      ? `minmax(0, ${100 - gridPanelWidth}fr) minmax(0, ${gridPanelWidth}fr)`
      : `minmax(0, ${gridPanelWidth}fr) minmax(0, ${100 - gridPanelWidth}fr)`
    : "minmax(0, 1fr)";

  return (
    <SidebarDetailContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn(
          "grid h-full max-h-full min-h-0 w-full max-w-full flex-1 overflow-hidden *:max-h-full *:min-h-0",
          className,
        )}
        style={{
          gridTemplateColumns,
          gridTemplateRows: "minmax(0, 1fr)",
        }}
      >
        {side === "left" ? (
          <>
            {panelColumn}
            {mainColumn}
          </>
        ) : (
          <>
            {mainColumn}
            {panelColumn}
          </>
        )}
      </div>
    </SidebarDetailContext.Provider>
  );
}

interface SidebarDetailMainProps {
  children: React.ReactNode;
  className?: string;
}

function SidebarDetailMain({ children, className }: SidebarDetailMainProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SidebarDetailPanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}

function SidebarDetailPanel({
  title,
  description,
  eyebrow,
  children,
  className,
  footer,
}: SidebarDetailPanelProps) {
  const { open, onOpenChange } = useSidebarDetail();

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col overflow-hidden", className)}
    >
      <div className={panelHeaderClass}>
        <div className="relative flex items-start justify-between gap-3">
          <motion.div
            key={open ? "panel-open" : "panel-closed"}
            initial={{ opacity: 0, y: 10 }}
            animate={open ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{
              delay: open ? 0.38 : 0,
              duration: open
                ? PANEL_CONTENT_ENTER.duration
                : PANEL_CONTENT_EXIT.duration,
              ease: open ? OPEN_EASE : CLOSE_EASE,
            }}
            className="min-w-0 space-y-2"
          >
            {eyebrow && (
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-primary ring-1 ring-primary/15 dark:bg-primary/20 dark:text-primary-foreground">
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="truncate text-[15px] font-semibold tracking-tight text-accent-foreground dark:text-sidebar-primary-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-[13px] leading-relaxed text-accent-foreground/75 dark:text-sidebar-primary-foreground/75">
                {description}
              </p>
            )}
          </motion.div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="group size-9 shrink-0 rounded-full border border-primary/15 bg-background/80 text-muted-foreground shadow-sm backdrop-blur-sm transition-all duration-300 hover:bg-accent hover:text-primary active:scale-[0.96] dark:border-sidebar-border/40 dark:bg-background/70 dark:hover:bg-primary/15 dark:hover:text-primary"
            onClick={() => onOpenChange(false)}
          >
            <span className="flex size-6 items-center justify-center rounded-full border border-primary/10 bg-background/90 transition-transform duration-300 group-hover:scale-105 dark:border-sidebar-border/30">
              <X className="size-3.5" />
            </span>
            <span className="sr-only">Đóng</span>
          </Button>
        </div>
      </div>

      <div className="h-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-5 pb-5 pt-5 thin-scroll">
        <div className="space-y-4">{children}</div>
      </div>

      {footer && (
        <div className="shrink-0 border-t border-border px-5 py-4">
          {footer}
        </div>
      )}
    </div>
  );
}

interface SidebarDetailFieldProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function SidebarDetailField({
  label,
  description,
  children,
  className,
}: SidebarDetailFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-0.5 px-0.5">
        <Label className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </Label>
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        )}
      </div>

      <div className="rounded-xl p-1 border border-border/60">
        <div className="rounded-[calc(0.75rem-0.125rem)] bg-background">
          {children}
        </div>
      </div>
    </div>
  );
}

export {
  SidebarDetail,
  SidebarDetailMain,
  SidebarDetailPanel,
  SidebarDetailField,
};
