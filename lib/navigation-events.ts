/**
 * Navigation Events
 * Custom events để trigger navigation từ non-React code (như axios interceptors)
 */

export const NAVIGATION_EVENTS = {
  REDIRECT_TO_LOGIN: "redirect-to-login",
} as const;

/**
 * Trigger redirect to login page
 * Sử dụng custom event thay vì window.location.href
 */
export function triggerRedirectToLogin() {
  if (typeof window !== "undefined") {
    const event = new CustomEvent(NAVIGATION_EVENTS.REDIRECT_TO_LOGIN);
    window.dispatchEvent(event);
  }
}

/**
 * Listen for redirect to login event
 * Sử dụng trong React component với useEffect
 */
export function onRedirectToLogin(callback: () => void) {
  if (typeof window !== "undefined") {
    window.addEventListener(NAVIGATION_EVENTS.REDIRECT_TO_LOGIN, callback);

    return () => {
      window.removeEventListener(NAVIGATION_EVENTS.REDIRECT_TO_LOGIN, callback);
    };
  }
  return () => {};
}
