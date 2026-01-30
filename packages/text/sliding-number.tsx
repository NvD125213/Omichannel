"use client";

import { AnimatePresence, motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SlidingNumberProps extends React.HTMLAttributes<HTMLDivElement> {
  number: number;
}

export const SlidingNumber = React.forwardRef<
  HTMLDivElement,
  SlidingNumberProps
>(({ number, className, ...props }, ref) => {
  const [direction, setDirection] = React.useState<"up" | "down">("up");
  const [prevNumber, setPrevNumber] = React.useState(number);

  React.useEffect(() => {
    if (number > prevNumber) {
      setDirection("up");
    } else if (number < prevNumber) {
      setDirection("down");
    }
    setPrevNumber(number);
  }, [number, prevNumber]);

  return (
    <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={number}
          initial={{
            y: direction === "up" ? 20 : -20,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          exit={{
            y: direction === "up" ? -20 : 20,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            bounce: 0,
            duration: 0.3,
          }}
        >
          {number}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

SlidingNumber.displayName = "SlidingNumber";
