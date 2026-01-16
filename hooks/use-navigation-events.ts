"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { onRedirectToLogin } from "@/lib/navigation-events";

/**
 * Hook to handle navigation events from non-React code
 * Phải được sử dụng trong React component (ví dụ: layout.tsx)
 */
export function useNavigationEvents() {
  const router = useRouter();

  useEffect(() => {
    // Listen for redirect to login event
    const cleanup = onRedirectToLogin(() => {
      console.log("Navigating to sign-in page...");
      router.push("/sign-in");
    });

    return cleanup;
  }, [router]);
}
