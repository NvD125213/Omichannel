"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";

type AiRobotAvatarProps = {
  className?: string;
};

export function AiRobotAvatar({ className }: AiRobotAvatarProps) {
  return (
    <DotLottieReact
      src="/ai-robot.lottie"
      loop
      autoplay
      className={cn("pointer-events-none", className)}
    />
  );
}
