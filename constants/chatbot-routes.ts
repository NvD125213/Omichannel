/** URL prefixes thuộc workspace (chatbot) — dùng cho layout & TeamSwitcher */
export const CHATBOT_ROUTE_PREFIXES = ["/ai-dashboard"] as const;

export function isChatbotPath(pathname: string) {
  return CHATBOT_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
